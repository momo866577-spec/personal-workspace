import "fake-indexeddb/auto";
import test from "node:test";
import assert from "node:assert/strict";
import Dexie from "dexie";
import { WorkspaceDB } from "../src/lib/db";
import { ensureEnglishDailyPlan, workoutStats } from "../src/lib/daily";
import { LocalRuleProvider } from "../src/lib/ai-provider";
import { exportAllData, importAllData } from "../src/lib/data-portability";
import { db } from "../src/lib/db";
import fs from "node:fs";
import {
  buildLiveReplyPrompt,
  deleteAiConnection,
  MockAiProvider,
  sanitizeLiveReply,
} from "../src/lib/ai-connection";
import {
  curriculumStats,
  NGSL_TOTAL,
  NGSL_VERSION,
} from "../src/lib/ngsl-curriculum";
import { workoutGuides } from "../src/lib/workout-guides";
import {
  giftPlatformProvider,
  futureGiftProviders,
} from "../src/lib/gift-platform-provider";
import {
  analyzePeriods,
  cleanPeriodAiOutput,
  periodAiSystemPrompt,
} from "../src/lib/period-health";
import {
  LocalNutritionProvider,
  scaleFood,
} from "../src/lib/nutrition-provider";

test("IndexedDB v1 upgrades to v7 without losing old rows", async () => {
  await Dexie.delete("personal-workspace");
  const old = new Dexie("personal-workspace");
  old
    .version(1)
    .stores({
      tasks: "id,due,done,order,createdAt",
      english: "id,date,completed,createdAt",
      workouts: "id,date,bodyPart,completed,createdAt",
      notes: "id,title,category,favorite,pinned,updatedAt,*tags",
      streams: "id,date,platform,streamer,createdAt",
      contacts: "id,username,platform,country,importance,createdAt,*tags",
    });
  await old
    .table("tasks")
    .add({
      id: "old-task",
      title: "保留",
      due: "2026-08-03",
      done: false,
      order: 0,
      createdAt: "x",
    });
  old.close();
  const upgraded = new WorkspaceDB();
  await upgraded.open();
  assert.equal((await upgraded.tasks.get("old-task"))?.title, "保留");
  for (const name of [
    "workoutCheckins",
    "englishQuestionBanks",
    "aiSecrets",
    "periodRecords",
    "giftRecords",
    "nutritionRecords",
    "travelPlans",
  ])
    assert.ok(upgraded.tables.some((x) => x.name === name));
  upgraded.close();
});

test("NGSL curriculum defaults to B1, is refresh-safe, and advances by level", async () => {
  await Dexie.delete("personal-workspace");
  await db.open();
  const firstDate = "2026-08-03",
    nextDate = "2026-08-04";
  await ensureEnglishDailyPlan(firstDate);
  await ensureEnglishDailyPlan(firstDate);
  const first = await db.englishDailyPlans.get(firstDate);
  assert.equal(await db.englishDailyPlans.count(), 1);
  assert.deepEqual(
    first?.items[0].prompts?.map((x) => x.text),
    ["ball", "cry", "introduction", "requirement", "north"],
  );
  assert.equal(first?.level, "B1");
  assert.equal(first?.source, `${NGSL_VERSION} · CEFR 固定顺序`);
  assert.equal(
    first?.items[0].prompts?.every((x) =>
      Boolean(x.phonetic && x.translation && x.example && x.exampleTranslation),
    ),
    true,
  );
  await db.tasks.where("due").equals(firstDate).modify({ done: true });
  await ensureEnglishDailyPlan(nextDate);
  const next = await db.englishDailyPlans.get(nextDate);
  assert.equal(next?.items[0].prompts?.[0].text, "confirm");
  const tasks = await db.tasks.toArray(),
    plans = await db.englishDailyPlans.toArray(),
    valid = new Set(plans.filter((x) => x.level === "B1").map((x) => x.date)),
    stats = curriculumStats(tasks, valid, nextDate, "B1");
  assert.equal(stats.completedWords, 5);
  assert.equal(stats.level, "B1");
  assert.equal(stats.chapter, 2);
  assert.equal(stats.total, 700);
  assert.equal(stats.libraryTotal, NGSL_TOTAL);
  await ensureEnglishDailyPlan(nextDate, true, "A2");
  assert.equal((await db.englishDailyPlans.get(nextDate))?.level, "A2");
});

test("workout streak, weekly and monthly totals are correct across days", () => {
  const rows = ["2026-08-01", "2026-08-02", "2026-08-03"].map((date) => ({
    date,
    completed: true,
    completedAt: date,
  }));
  assert.deepEqual(workoutStats(rows, "2026-08-03"), {
    todayDone: true,
    streak: 3,
    week: 1,
    month: 3,
  });
});

test("workout recommendations search each recorded action on three mainland-accessible entries", () => {
  const chest = workoutGuides({ bodyPart: "胸部", exercise: "卧推" }),
    legs = workoutGuides({ bodyPart: "腿部", exercise: "深蹲" });
  assert.deepEqual(
    chest.map((x) => x.platform),
    ["Keep 课程", "Pamela Reif", "周六野 Zoey"],
  );
  for (const guide of [...chest, ...legs])
    assert.match(guide.url, /^https:\/\/search\.bilibili\.com\/all\?keyword=/);
  assert.match(decodeURIComponent(chest[0].url), /Keep 胸部 卧推/);
  assert.match(decodeURIComponent(legs[1].url), /Pamela Reif Leg Workout/);
  assert.match(decodeURIComponent(legs[2].url), /周六野 腿部 深蹲/);
});

test("period tracker analyzes regularity and strips AI filler", () => {
  const records = ["2026-05-01", "2026-05-29", "2026-06-26"].map(
    (startDate, index) => ({
      id: String(index),
      startDate,
      endDate: new Date(
        new Date(`${startDate}T00:00:00`).getTime() + 4 * 86400000,
      ).toLocaleDateString("en-CA"),
      flow: "medium" as const,
      padChanges: 4,
      pain: 2,
      color: "bright-red",
      symptoms: [],
      notes: "",
      createdAt: "x",
      updatedAt: "x",
    }),
  );
  const summary = analyzePeriods(records);
  assert.equal(summary.averageCycle, 28);
  assert.equal(summary.averageDuration, 5);
  assert.equal(summary.regularity, "较规律");
  assert.match(periodAiSystemPrompt(), /禁止前言/);
  assert.equal(
    cleanPeriodAiOutput("作为 AI，我来分析\n【周期概况】\n周期较规律"),
    "【周期概况】\n周期较规律",
  );
});

test("all three local rule AI tools return usable output", async () => {
  const provider = new LocalRuleProvider();
  for (const mode of ["reply", "review", "coach"] as const) {
    const output = await provider.generate({ mode, input: "有人觉得价格太高" });
    assert.ok(output.length > 80);
  }
});

test("AI connection wizard uses Mock Provider without environment variables", async () => {
  const mock = new MockAiProvider();
  assert.equal(await mock.test(), "AI 已连接");
  assert.match(await mock.generate("reply", "你好"), /Mock reply/);
  await deleteAiConnection();
});

test("live reply prompt requests three direct variants and regeneration is unique", () => {
  const first = buildLiveReplyPrompt("直播间怎么没人？", "留人"),
    second = buildLiveReplyPrompt("直播间怎么没人？", "留人", "旧回复");
  for (const label of ["① 高情商版", "② 幽默版", "③ 高互动版"])
    assert.match(first.prompt, new RegExp(label));
  assert.match(first.system, /每条20～40个中文字/);
  assert.notEqual(first.prompt, second.prompt);
  assert.match(second.prompt, /不得复用/);
  assert.equal(
    sanitizeLiveReply("作为AI，我建议如下\n① 高情商版\n欢迎回来"),
    "① 高情商版\n欢迎回来",
  );
});

test("v6 JSON exports and imports all old and new tables", async () => {
  const exported = await exportAllData();
  for (const name of [
    "tasks",
    "english",
    "workouts",
    "notes",
    "streams",
    "contacts",
    "workoutCheckins",
    "englishDailyPlans",
    "aiToolRecords",
    "englishQuestionBanks",
    "periodRecords",
    "giftRecords",
    "nutritionRecords",
    "travelPlans",
  ])
    assert.ok(Array.isArray(exported[name]));
  const count = (exported.englishDailyPlans as unknown[]).length;
  await importAllData(exported);
  assert.equal(await db.englishDailyPlans.count(), count);
  db.close();
});

test("nutrition database scales macros by confirmed grams", async () => {
  const provider = new LocalNutritionProvider();
  const [chicken] = await provider.search("鸡胸肉");
  assert.ok(chicken);
  const result = scaleFood(chicken, 150);
  assert.equal(Math.round(result.kcal * 10) / 10, 247.5);
  assert.equal(Math.round(result.protein * 10) / 10, 46.5);
  assert.equal(Math.round(result.carbs * 10) / 10, 0);
  assert.equal(Math.round(result.fat * 10) / 10, 5.4);
});

test("gift platform architecture defaults to manual and reserves five providers", async () => {
  assert.equal(giftPlatformProvider.id, "manual");
  assert.equal(giftPlatformProvider.automatic, false);
  assert.deepEqual(await giftPlatformProvider.sync(), []);
  assert.deepEqual(
    futureGiftProviders.map((x) => x.id),
    ["bilibili", "douyin", "kuaishou", "youtube", "twitch"],
  );
});

test("AI secrets and connection metadata are excluded from JSON export", async () => {
  await db.open();
  const exported = await exportAllData();
  assert.equal("aiSecrets" in exported, false);
  assert.equal("aiConnections" in exported, false);
  db.close();
});

test("UI source uses Simplified Chinese and zh-CN locale", () => {
  const traditional =
    /總覽|計畫|設定|資料|備忘錄|運動|學習|匯入|匯出|標籤|搜尋|刪除|標題|內容|紀錄|鍛鍊|連續|還沒有/;
  for (const file of [
    "src/components/workspace.tsx",
    "src/components/ui-pack-shells.tsx",
    "src/components/workspace-theme-provider.tsx",
    "src/components/phase-two.tsx",
    "src/lib/english-question-bank.ts",
    "src/app/layout.tsx",
    "src/app/manifest.ts",
  ]) {
    const source = fs.readFileSync(file, "utf8");
    assert.equal(
      traditional.test(source),
      false,
      `${file} contains a Traditional Chinese UI label`,
    );
    assert.equal(source.includes("zh-TW"), false);
  }
  assert.match(fs.readFileSync("src/app/layout.tsx", "utf8"), /lang="zh-CN"/);
});

test("PWA manifest and service worker remain installable", () => {
  const manifest = fs.readFileSync("src/app/manifest.ts", "utf8");
  assert.match(manifest, /display:\s*"standalone"/);
  assert.match(manifest, /icon-maskable-512/);
  const worker = fs.readFileSync("public/sw.js", "utf8");
  assert.match(worker, /workspace-v\d+/);
  assert.match(worker, /skipWaiting/);
  assert.match(worker, /clients\.claim/);
});
