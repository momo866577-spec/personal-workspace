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

test("IndexedDB v1 upgrades to v2 without losing old rows",async()=>{await Dexie.delete("personal-workspace");const old=new Dexie("personal-workspace");old.version(1).stores({tasks:"id,due,done,order,createdAt",english:"id,date,completed,createdAt",workouts:"id,date,bodyPart,completed,createdAt",notes:"id,title,category,favorite,pinned,updatedAt,*tags",streams:"id,date,platform,streamer,createdAt",contacts:"id,username,platform,country,importance,createdAt,*tags"});await old.table("tasks").add({id:"old-task",title:"保留",due:"2026-08-03",done:false,order:0,createdAt:"x"});old.close();const upgraded=new WorkspaceDB();await upgraded.open();assert.equal((await upgraded.tasks.get("old-task"))?.title,"保留");assert.ok(upgraded.tables.some(x=>x.name==="workoutCheckins"));upgraded.close()});

test("daily English plan is generated exactly once and refresh-safe",async()=>{await Dexie.delete("personal-workspace");await db.open();const date="2026-08-03";await ensureEnglishDailyPlan(date);await ensureEnglishDailyPlan(date);assert.equal(await db.englishDailyPlans.count(),1);assert.equal(await db.tasks.where("due").equals(date).count(),5)});

test("workout streak, weekly and monthly totals are correct across days",()=>{const rows=["2026-08-01","2026-08-02","2026-08-03"].map(date=>({date,completed:true,completedAt:date}));assert.deepEqual(workoutStats(rows,"2026-08-03"),{todayDone:true,streak:3,week:1,month:3})});

test("all three local rule AI tools return usable output",async()=>{const provider=new LocalRuleProvider();for(const mode of ["reply","review","coach"] as const){const output=await provider.generate({mode,input:"有人觉得价格太高"});assert.ok(output.length>80)}});

test("v2 JSON exports and imports all old and new tables",async()=>{const exported=await exportAllData();for(const name of ["tasks","english","workouts","notes","streams","contacts","workoutCheckins","englishDailyPlans","aiToolRecords"])assert.ok(Array.isArray(exported[name]));await importAllData(exported);assert.equal(await db.englishDailyPlans.count(),1);db.close()});

test("UI source uses Simplified Chinese and zh-CN locale",()=>{const traditional=/總覽|計畫|設定|資料|備忘錄|運動|學習|匯入|匯出|標籤|搜尋|刪除|標題|內容|紀錄|鍛鍊|連續|還沒有/;for(const file of ["src/components/workspace.tsx","src/components/ui-pack-shells.tsx","src/components/workspace-theme-provider.tsx","src/app/layout.tsx","src/app/manifest.ts"]){const source=fs.readFileSync(file,"utf8");assert.equal(traditional.test(source),false,`${file} contains a Traditional Chinese UI label`);assert.equal(source.includes("zh-TW"),false)}assert.match(fs.readFileSync("src/app/layout.tsx","utf8"),/lang="zh-CN"/)});

test("PWA manifest and service worker remain installable",()=>{const manifest=fs.readFileSync("src/app/manifest.ts","utf8");assert.match(manifest,/display:\s*"standalone"/);assert.match(manifest,/icon-maskable-512/);const worker=fs.readFileSync("public/sw.js","utf8");assert.match(worker,/workspace-v7/);assert.match(worker,/skipWaiting/);assert.match(worker,/clients\.claim/)});
