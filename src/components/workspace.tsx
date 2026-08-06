"use client";
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/purity, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-expressions, @typescript-eslint/no-unused-vars, @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { motion } from "motion/react";
import {
  OPEN_NOTE_DIALOG_EVENT,
  OPEN_TASK_DIALOG_EVENT,
  OPEN_WORKOUT_DIALOG_EVENT,
  WORKSPACE_SEARCH_EVENT,
} from "@/lib/workspace-events";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import {
  Archive,
  BookOpen,
  CalendarCheck,
  Check,
  Dumbbell,
  ExternalLink,
  FileText,
  Flower2,
  Gift,
  Heart,
  Home,
  Languages,
  MapPinned,
  Moon,
  Paperclip,
  Pencil,
  Pin,
  Plus,
  Radio,
  Search,
  Settings,
  Sparkles,
  Star,
  Sun,
  Trash2,
  Utensils,
  Users,
} from "lucide-react";
import { db } from "@/lib/db";
import { useWorkspaceTheme } from "@/components/workspace-theme-provider";
import {
  InstallAppButton,
  packShells,
  type PackNavItem,
} from "@/components/ui-pack-shells";
import { packHomes } from "@/components/ui-pack-homes";
import {
  today,
  uid,
  type Contact,
  type EnglishEntry,
  type Note,
  type Stream,
  type Task,
  type Workout,
} from "@/lib/types";
import { workoutGuides } from "@/lib/workout-guides";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  CompleteDataPanel,
  DashboardPhaseTwo,
  EnglishDailyTasks,
  initializeDailyFeatures,
  StreamAiAssistant,
  WorkoutCheckinPanel,
} from "@/components/phase-two";
import { LanguageBridge } from "@/components/language-bridge";
import { AiConnectionCenter } from "@/components/ai-connection-center";
import { PeriodTracker } from "@/components/period-tracker";
import { GiftAssistant, GiftDashboardCard } from "@/components/gift-assistant";
import { NutritionDashboardCard, NutritionPage, TravelPage } from "@/components/life-modules";
import { WorkspaceProfileSettings } from "@/components/workspace-profile";
import { WorkspaceFontSettings } from "@/components/workspace-font-provider";

type Page =
  | "dashboard"
  | "tasks"
  | "english"
  | "workouts"
  | "nutrition"
  | "travel"
  | "periods"
  | "notes"
  | "streams"
  | "gifts"
  | "settings";
const nav: { id: Page; label: string; icon: typeof Home }[] = [
  { id: "dashboard", label: "总览", icon: Home },
  { id: "tasks", label: "每日计划", icon: CalendarCheck },
  { id: "english", label: "英语", icon: Languages },
  { id: "workouts", label: "运动", icon: Dumbbell },
  { id: "nutrition", label: "智慧饮食", icon: Utensils },
  { id: "travel", label: "旅行规划", icon: MapPinned },
  { id: "periods", label: "经期记录", icon: Flower2 },
  { id: "notes", label: "备忘录", icon: FileText },
  { id: "streams", label: "直播复盘", icon: Radio },
  { id: "gifts", label: "直播客户", icon: Gift },
  { id: "settings", label: "设置", icon: Settings },
];
const dateText = new Intl.DateTimeFormat("zh-CN", {
  month: "long",
  day: "numeric",
}).format(new Date());
const weekday = new Intl.DateTimeFormat("zh-CN", { weekday: "long" }).format(
  new Date(),
);
const pageTitle: Record<Page, string> = Object.fromEntries(
  nav.map((n) => [n.id, n.label]),
) as Record<Page, string>;
const cn = (...x: (string | false | undefined)[]) =>
  x.filter(Boolean).join(" ");

const taskDestination = (title: string): Page => {
  const text = title.toLowerCase().replace(/\s+/g, "");
  if (/英语|英文|单词|短句|跟读|口语|听力|阅读|english/.test(text)) return "english";
  if (/旅行|旅游|行程|景点|酒店|饭店|机票|travel/.test(text)) return "travel";
  if (/备忘|笔记|memo|note/.test(text)) return "notes";
  if (/运动|健身|跑步|瑜伽|训练|锻炼|workout/.test(text)) return "workouts";
  if (/饮食|食物|热量|早餐|午餐|晚餐|nutrition/.test(text)) return "nutrition";
  if (/经期|月经|姨妈|period/.test(text)) return "periods";
  if (/直播|复盘|话术|投稿|stream/.test(text)) return "streams";
  if (/客户|粉丝|礼物|crm/.test(text)) return "gifts";
  if (/设置|ai中心|api/.test(text)) return "settings";
  return "tasks";
};

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}
function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
function Empty({
  icon: Icon = Archive,
  title = "还没有数据",
  text = "新增第一笔内容，开始建立你的工作流。",
}: {
  icon?: typeof Archive;
  title?: string;
  text?: string;
}) {
  return (
    <div className="empty">
      <span className="icon-orb">
        <Icon size={22} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function Tags({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <Input
      value={value.join(", ")}
      onChange={(e) =>
        onChange(
          e.target.value
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
        )
      }
      placeholder="以逗号分隔"
    />
  );
}
function Fab({
  onClick,
  label = "新增",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <Button onClick={onClick} className="premium-button gap-2">
      <Plus size={17} />
      {label}
    </Button>
  );
}

export function Workspace() {
  const [page, setPage] = useState<Page>("dashboard");
  const [taskStatus, setTaskStatus] = useState<"all" | "done" | "pending">("all");
  const [mounted, setMounted] = useState(false);
  const { workspaceTheme } = useWorkspaceTheme();
  useEffect(() => {
    setMounted(true);
    initializeDailyFeatures().catch(() => {});
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  useEffect(() => {
    if (mounted) window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [page, mounted]);
  if (!mounted)
    return (
      <div className="grid min-h-screen place-items-center">
        <Sparkles className="animate-pulse text-violet-500" />
      </div>
    );
  const PackShell = packShells[workspaceTheme];
  const go = (nextPage: Page) => {
    if (nextPage === "tasks") setTaskStatus("all");
    setPage(nextPage);
  };
  const openTaskSummary = (status: "done" | "pending") => {
    setTaskStatus(status);
    setPage("tasks");
  };
  const content =
    page === "dashboard" ? (
      <Dashboard go={go} openTaskSummary={openTaskSummary} />
    ) : page === "tasks" ? (
      <Tasks go={go} status={taskStatus} setStatus={setTaskStatus} />
    ) : page === "english" ? (
      <>
        <EnglishDailyTasks />
        <English />
      </>
    ) : page === "workouts" ? (
      <>
        <WorkoutCheckinPanel />
        <Workouts />
      </>
    ) : page === "nutrition" ? (
      <NutritionPage />
    ) : page === "travel" ? (
      <TravelPage />
    ) : page === "periods" ? (
      <PeriodTracker />
    ) : page === "notes" ? (
      <Notes />
    ) : page === "streams" ? (
      <>
        <StreamAiAssistant />
        <Streams />
      </>
    ) : page === "gifts" ? (
      <GiftAssistant />
    ) : (
      <>
        <AiConnectionCenter />
        <CompleteDataPanel />
        <SettingsPage />
        <InstallAppSettings />
      </>
    );
  return (
    <>
      <LanguageBridge />
      <PackShell
        page={page}
        title={pageTitle[page]}
        nav={nav as PackNavItem[]}
        go={go}
        theme={workspaceTheme}
      >
        <div className="pack-page mx-auto max-w-7xl">{content}</div>
      </PackShell>
    </>
  );
}
function InstallAppSettings() {
  return (
    <Card className="mb-6">
      <SectionTitle
        title="安装应用"
        subtitle="将 Personal Workspace 添加到手机或电脑桌面"
      />
      <div className="max-w-xs">
        <InstallAppButton />
      </div>
    </Card>
  );
}
function Dashboard({
  go,
  openTaskSummary,
}: {
  go: (p: Page) => void;
  openTaskSummary: (status: "done" | "pending") => void;
}) {
  const tasks =
    useLiveQuery(() => db.tasks.where("due").equals(today()).toArray(), []) ||
    [];
  const english =
    useLiveQuery(
      () => db.english.where("date").equals(today()).toArray(),
      [],
    ) || [];
  const workouts =
    useLiveQuery(
      () => db.workouts.where("date").equals(today()).toArray(),
      [],
    ) || [];
  const notes =
    useLiveQuery(
      () => db.notes.orderBy("updatedAt").reverse().limit(3).toArray(),
      [],
    ) || [];
  const streams =
    useLiveQuery(
      () => db.streams.orderBy("date").reverse().limit(3).toArray(),
      [],
    ) || [];
  const done = tasks.filter((t) => t.done).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const { workspaceTheme } = useWorkspaceTheme();
  const PackHome = packHomes[workspaceTheme];
  return (
    <PackHome
      tasks={tasks}
      english={english}
      workouts={workouts}
      notes={notes}
      streams={streams}
      done={done}
      pct={pct}
      go={go}
      openTaskSummary={openTaskSummary}
      openTask={(task) => go(taskDestination(task.title))}
      toggleTask={(task) => db.tasks.update(task.id, { done: !task.done })}
      phaseTwo={
        <>
          <DashboardPhaseTwo />
          <NutritionDashboardCard open={() => go("nutrition")} />
          <GiftDashboardCard open={() => go("gifts")} />
        </>
      }
    />
  );
}

function TaskRow({ task, open }: { task: Task; open: (t: Task) => void }) {
  return (
    <motion.div
      layout
      className="task"
    >
      <Checkbox
        checked={task.done}
        onCheckedChange={() => db.tasks.update(task.id, { done: !task.done })}
        aria-label={`完成：${task.title}`}
      />
      <button className="task-open" onClick={() => open(task)} aria-label={`打开：${task.title}`}>
        <p
          className={cn(
            "task-title font-medium",
            task.done && "line-through opacity-45",
          )}
        >
          {task.title}
        </p>
        <small>
          {new Date(task.due + "T00:00:00").toLocaleDateString("zh-CN", {
            month: "short",
            day: "numeric",
            weekday: "short",
          })}
        </small>
      </button>
      <Button
        size="icon-sm"
        variant="ghost"
        onClick={() => db.tasks.delete(task.id)}
        aria-label={`删除：${task.title}`}
      >
        <Trash2 />
      </Button>
    </motion.div>
  );
}
function Tasks({
  go,
  status,
  setStatus,
}: {
  go: (page: Page) => void;
  status: "all" | "done" | "pending";
  setStatus: (status: "all" | "done" | "pending") => void;
}) {
  const all = useLiveQuery(() => db.tasks.orderBy("order").toArray(), []) || [];
  const [filter, setFilter] = useState("today");
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<Task | null>(null);
  useEffect(() => {
    const showNewTaskDialog = () => setOpen(true);
    window.addEventListener(OPEN_TASK_DIALOG_EVENT, showNewTaskDialog);
    return () =>
      window.removeEventListener(OPEN_TASK_DIALOG_EVENT, showNewTaskDialog);
  }, []);
  const dateVisible = all.filter(
    (t) =>
      filter === "all" ||
      (filter === "today"
        ? t.due === today()
        : filter === "tomorrow"
          ? t.due === new Date(Date.now() + 864e5).toLocaleDateString("en-CA")
          : new Date(t.due) >= new Date() &&
            new Date(t.due) <= new Date(Date.now() + 7 * 864e5)),
  );
  const visible = dateVisible.filter((task) =>
    status === "all" ? true : status === "done" ? task.done : !task.done,
  );
  const done = visible.filter((t) => t.done).length;
  const openTask = (task: Task) => {
    const destination = taskDestination(task.title);
    if (destination === "tasks") setDetail(task);
    else go(destination);
  };
  return (
    <div className="tasks-page">
      <Card className="task-list-card">
        <div className="task-filter-bar">
          {[
            ["today", "今日"],
            ["tomorrow", "明日"],
            ["week", "本周"],
            ["all", "全部"],
          ].map((x) => (
            <Button
              key={x[0]}
              size="sm"
              variant={filter === x[0] ? "default" : "outline"}
              onClick={() => setFilter(x[0])}
            >
              {x[1]}
            </Button>
          ))}
          {[
            ["all", "全部状态"],
            ["pending", "待完成"],
            ["done", "已完成"],
          ].map(([value, label]) => (
            <Button
              key={value}
              size="sm"
              variant={status === value ? "default" : "outline"}
              onClick={() => setStatus(value as "all" | "done" | "pending")}
            >
              {label}
            </Button>
          ))}
          <div className="task-completion">
            完成率{" "}
            <b>
              {visible.length ? Math.round((done / visible.length) * 100) : 0}%
            </b>
          </div>
        </div>
        <Progress
          value={visible.length ? (done / visible.length) * 100 : 0}
          className="task-progress"
        />
        {visible.length ? (
          <div className="task-list">
            {visible.map((task) => (
              <TaskRow key={task.id} task={task} open={openTask} />
            ))}
          </div>
        ) : (
          <Empty icon={CalendarCheck} />
        )}
      </Card>
      <TaskDialog
        open={open}
        setOpen={setOpen}
        task={null}
        count={all.length}
      />
      <Dialog open={Boolean(detail)} onOpenChange={(value) => !value && setDetail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detail?.title}</DialogTitle>
            <DialogDescription>任务详情</DialogDescription>
          </DialogHeader>
          <div className="task-detail">
            <p><b>日期</b><span>{detail?.due}</span></p>
            <p><b>状态</b><span>{detail?.done ? "已完成" : "待完成"}</span></p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
function TaskDialog({
  open,
  setOpen,
  task,
  count,
}: {
  open: boolean;
  setOpen: (x: boolean) => void;
  task: Task | null;
  count: number;
}) {
  const [title, setTitle] = useState("");
  const [due, setDue] = useState(today());
  useEffect(() => {
    setTitle(task?.title || "");
    setDue(task?.due || today());
  }, [task, open]);
  const save = async () => {
    if (!title.trim()) return;
    const now = new Date().toISOString();
    if (task) await db.tasks.update(task.id, { title: title.trim(), due });
    else
      await db.tasks.add({
        id: uid(),
        title: title.trim(),
        due,
        done: false,
        order: count,
        createdAt: now,
      });
    setOpen(false);
  };
  return (
    <FormDialog
      open={open}
      setOpen={setOpen}
      title={task ? "修改计划" : "新增计划"}
      onSave={save}
    >
      <Field label="待办事项">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          placeholder="例如：完成本周企划"
        />
      </Field>
      <Field label="日期">
        <Input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
        />
      </Field>
    </FormDialog>
  );
}

function English() {
  const items =
    useLiveQuery(() => db.english.orderBy("date").reverse().toArray(), []) ||
    [];
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<EnglishEntry | null>(null);
  const streak = useMemo(() => {
    const days = new Set(items.filter((x) => x.completed).map((x) => x.date));
    let n = 0,
      d = new Date();
    while (days.has(d.toLocaleDateString("en-CA"))) {
      n++;
      d = new Date(d.getTime() - 864e5);
    }
    return n;
  }, [items]);
  return (
    <>
      <PageHead
        title="英语学习"
        text="每天输入、输出一点，语感会替你记住累积。"
        action={
          <Fab
            onClick={() => {
              setEdit(null);
              setOpen(true);
            }}
            label="建立今日学习"
          />
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat icon={BookOpen} label="学习记录" value={`${items.length} 天`} />
        <Stat
          icon={Check}
          label="完成天数"
          value={`${items.filter((x) => x.completed).length} 天`}
        />
        <Stat icon={Sparkles} label="连续打卡" value={`${streak} 天`} />
      </div>
      <div className="space-y-4">
        {items.length ? (
          items.map((e) => (
            <Card key={e.id}>
              <div className="flex items-start gap-4">
                <button
                  onClick={() =>
                    db.english.update(e.id, { completed: !e.completed })
                  }
                  className={cn("check-big", e.completed && "done")}
                >
                  <Check />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="mb-4 flex items-center gap-2">
                    <b className="text-lg">{e.word || "学习记录"}</b>
                    <Badge variant="secondary">{e.date}</Badge>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {[
                      ["例句", e.sentence],
                      ["文法", e.grammar],
                      ["阅读", e.reading],
                      ["口说", e.speaking],
                      ["听力", e.listening],
                    ]
                      .filter((x) => x[1])
                      .map((x) => (
                        <div className="content-box" key={x[0]}>
                          <small>{x[0]}</small>
                          <p>{x[1]}</p>
                        </div>
                      ))}
                  </div>
                </div>
                <Actions
                  edit={() => {
                    setEdit(e);
                    setOpen(true);
                  }}
                  del={() => db.english.delete(e.id)}
                />
              </div>
            </Card>
          ))
        ) : (
          <Card>
            <Empty icon={Languages} />
          </Card>
        )}
      </div>
      <EnglishDialog open={open} setOpen={setOpen} value={edit} />
    </>
  );
}
function EnglishDialog({
  open,
  setOpen,
  value,
}: {
  open: boolean;
  setOpen: (x: boolean) => void;
  value: EnglishEntry | null;
}) {
  const empty = {
    date: today(),
    word: "",
    sentence: "",
    grammar: "",
    reading: "",
    speaking: "",
    listening: "",
  };
  const [f, setF] = useState(empty);
  useEffect(
    () =>
      setF(
        value
          ? {
              date: value.date,
              word: value.word,
              sentence: value.sentence,
              grammar: value.grammar,
              reading: value.reading,
              speaking: value.speaking,
              listening: value.listening,
            }
          : empty,
      ),
    [value, open],
  );
  const save = async () => {
    if (!Object.values(f).slice(1).some(Boolean)) return;
    value
      ? await db.english.update(value.id, f)
      : await db.english.add({
          ...f,
          id: uid(),
          completed: false,
          createdAt: new Date().toISOString(),
        });
    setOpen(false);
  };
  return (
    <FormDialog
      wide
      open={open}
      setOpen={setOpen}
      title="英语学习记录"
      onSave={save}
    >
      <div className="form-grid">
        <Field label="日期">
          <Input
            type="date"
            value={f.date}
            onChange={(e) => setF({ ...f, date: e.target.value })}
          />
        </Field>
        <Field label="单字">
          <Input
            value={f.word}
            onChange={(e) => setF({ ...f, word: e.target.value })}
            placeholder="Vocabulary"
          />
        </Field>
        <Field label="例句">
          <Textarea
            value={f.sentence}
            onChange={(e) => setF({ ...f, sentence: e.target.value })}
          />
        </Field>
        <Field label="文法">
          <Textarea
            value={f.grammar}
            onChange={(e) => setF({ ...f, grammar: e.target.value })}
          />
        </Field>
        <Field label="阅读">
          <Textarea
            value={f.reading}
            onChange={(e) => setF({ ...f, reading: e.target.value })}
          />
        </Field>
        <Field label="口说">
          <Textarea
            value={f.speaking}
            onChange={(e) => setF({ ...f, speaking: e.target.value })}
          />
        </Field>
        <Field label="听力">
          <Textarea
            value={f.listening}
            onChange={(e) => setF({ ...f, listening: e.target.value })}
          />
        </Field>
      </div>
    </FormDialog>
  );
}

function WorkoutRecommendations({
  workout,
}: {
  workout: Pick<Workout, "bodyPart" | "exercise">;
}) {
  return (
    <section className="workout-guides">
      <b>推荐教程</b>
      {workoutGuides(workout).map((guide) => (
        <a
          key={guide.platform}
          href={guide.url}
          target="_blank"
          rel="noreferrer"
        >
          <i>{guide.mark}</i>
          <span>
            <small>{guide.platform}</small>
            <strong>{guide.title}</strong>
          </span>
          <em>
            查看教程 <ExternalLink />
          </em>
        </a>
      ))}
    </section>
  );
}
function Workouts() {
  const items =
    useLiveQuery(() => db.workouts.orderBy("date").reverse().toArray(), []) ||
    [];
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Workout | null>(null);
  const [guide, setGuide] = useState({ bodyPart: "全身", exercise: "训练" });
  useEffect(() => {
    const showWorkoutDialog = () => {
      setEdit(null);
      setOpen(true);
    };
    window.addEventListener(OPEN_WORKOUT_DIALOG_EVENT, showWorkoutDialog);
    return () =>
      window.removeEventListener(OPEN_WORKOUT_DIALOG_EVENT, showWorkoutDialog);
  }, []);
  const chart = useMemo(
    () =>
      Object.values(
        items.reduce<Record<string, { date: string; volume: number }>>(
          (a, w) => {
            a[w.date] ??= { date: w.date.slice(5), volume: 0 };
            a[w.date].volume += w.sets * w.reps * w.weight;
            return a;
          },
          {},
        ),
      ).slice(-10),
    [items],
  );
  return (
    <>
      <Card className="workout-guide-library">
        <SectionTitle
          title="推荐教程"
          subtitle="选择训练方向，直接前往对应平台搜索"
        />
        <div className="workout-guide-chips">
          {["全身", "胸部", "背部", "腿部", "肩部", "腹部", "拉伸"].map(
            (part) => (
              <button
                key={part}
                className={guide.bodyPart === part ? "active" : ""}
                onClick={() =>
                  setGuide({
                    bodyPart: part,
                    exercise: part === "拉伸" ? "拉伸放松" : "训练",
                  })
                }
              >
                {part}
              </button>
            ),
          )}
        </div>
        <WorkoutRecommendations workout={guide} />
      </Card>
      {items.length > 0 && (
        <Card className="mb-6 h-64">
          <SectionTitle title="训练量趋势" subtitle="组数 × 次数 × 重量" />
          <ResponsiveContainer width="100%" height="75%">
            <AreaChart data={chart}>
              <defs>
                <linearGradient id="vol" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c6df2" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#7c6df2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                opacity={0.15}
              />
              <XAxis dataKey="date" axisLine={false} tickLine={false} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="volume"
                stroke="#7c6df2"
                fill="url(#vol)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.length ? (
          items.map((w) => (
            <Card key={w.id}>
              <div className="flex items-start gap-3">
                <span className="icon-orb">
                  <Dumbbell />
                </span>
                <div className="min-w-0 flex-1">
                  <small className="text-muted-foreground">
                    {w.date} · {w.bodyPart}
                  </small>
                  <h3 className="mt-1 truncate text-lg font-semibold">
                    {w.exercise}
                  </h3>
                </div>
                <Actions
                  edit={() => {
                    setEdit(w);
                    setOpen(true);
                  }}
                  del={() => db.workouts.delete(w.id)}
                />
              </div>
              {w.photo && (
                <img
                  src={w.photo}
                  alt="训练照片"
                  className="mt-4 aspect-video w-full rounded-xl object-cover"
                />
              )}
              <div className="mt-5 grid grid-cols-4 gap-2 text-center">
                {[
                  [w.sets, "组"],
                  [w.reps, "次"],
                  [w.weight, "kg"],
                  [w.minutes, "分钟"],
                ].map((x, i) => (
                  <div className="metric" key={i}>
                    <b>{x[0]}</b>
                    <small>{x[1]}</small>
                  </div>
                ))}
              </div>
              <WorkoutRecommendations workout={w} />
            </Card>
          ))
        ) : (
          <Card className="md:col-span-2 xl:col-span-3">
            <Empty
              icon={Dumbbell}
              title="还没有运动记录，可先使用上方推荐教程"
            />
          </Card>
        )}
      </div>
      <WorkoutDialog open={open} setOpen={setOpen} value={edit} />
    </>
  );
}
function WorkoutDialog({
  open,
  setOpen,
  value,
}: {
  open: boolean;
  setOpen: (x: boolean) => void;
  value: Workout | null;
}) {
  const empty = {
    date: today(),
    bodyPart: "",
    exercise: "",
    sets: 3,
    weight: 0,
    reps: 10,
    minutes: 0,
    photo: "",
  };
  const [f, setF] = useState(empty);
  useEffect(
    () =>
      setF(
        value
          ? {
              date: value.date,
              bodyPart: value.bodyPart,
              exercise: value.exercise,
              sets: value.sets,
              weight: value.weight,
              reps: value.reps,
              minutes: value.minutes,
              photo: value.photo || "",
            }
          : empty,
      ),
    [value, open],
  );
  const file = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const x = e.target.files?.[0];
    if (x && x.size < 5_000_000) {
      const r = new FileReader();
      r.onload = () => setF({ ...f, photo: String(r.result) });
      r.readAsDataURL(x);
    }
  };
  const save = async () => {
    if (!f.exercise.trim()) return;
    value
      ? await db.workouts.update(value.id, f)
      : await db.workouts.add({
          ...f,
          id: uid(),
          completed: true,
          createdAt: new Date().toISOString(),
        });
    setOpen(false);
  };
  return (
    <FormDialog
      wide
      open={open}
      setOpen={setOpen}
      title="运动记录"
      onSave={save}
    >
      <div className="form-grid">
        <Field label="日期">
          <Input
            type="date"
            value={f.date}
            onChange={(e) => setF({ ...f, date: e.target.value })}
          />
        </Field>
        <Field label="训练部位">
          <Input
            value={f.bodyPart}
            onChange={(e) => setF({ ...f, bodyPart: e.target.value })}
            placeholder="例如：胸部"
          />
        </Field>
        <Field label="动作">
          <Input
            value={f.exercise}
            onChange={(e) => setF({ ...f, exercise: e.target.value })}
            placeholder="例如：卧推"
          />
        </Field>
        {(
          [
            ["sets", "组数"],
            ["weight", "重量（kg）"],
            ["reps", "次数"],
            ["minutes", "时间（分钟）"],
          ] as const
        ).map((x) => (
          <Field key={x[0]} label={x[1]}>
            <Input
              type="number"
              min="0"
              value={f[x[0]]}
              onChange={(e) => setF({ ...f, [x[0]]: Number(e.target.value) })}
            />
          </Field>
        ))}
        <Field label="照片（小于 5MB）">
          <Input type="file" accept="image/*" onChange={file} />
        </Field>
      </div>
      {(f.bodyPart.trim() || f.exercise.trim()) && (
        <WorkoutRecommendations workout={f} />
      )}
    </FormDialog>
  );
}

function Notes() {
  const items =
    useLiveQuery(() => db.notes.orderBy("updatedAt").reverse().toArray(), []) ||
    [];
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Note | null>(null);
  useEffect(() => {
    const showNoteDialog = () => {
      setEdit(null);
      setOpen(true);
    };
    const updateNoteSearch = (event: Event) => {
      const detail = (event as CustomEvent<{ page: string; query: string }>).detail;
      if (detail?.page === "notes") setQ(detail.query);
    };
    window.addEventListener(OPEN_NOTE_DIALOG_EVENT, showNoteDialog);
    window.addEventListener(WORKSPACE_SEARCH_EVENT, updateNoteSearch);
    return () => {
      window.removeEventListener(OPEN_NOTE_DIALOG_EVENT, showNoteDialog);
      window.removeEventListener(WORKSPACE_SEARCH_EVENT, updateNoteSearch);
    };
  }, []);
  const shown = items
    .filter((n) =>
      [n.title, n.content, n.category, ...n.tags]
        .join(" ")
        .toLowerCase()
        .includes(q.toLowerCase()),
    )
    .sort((a, b) => Number(b.pinned) - Number(a.pinned));
  return (
    <>
      <div className="columns-1 gap-4 md:columns-2 xl:columns-3">
        {shown.length ? (
          shown.map((n) => (
            <Card key={n.id} className="mb-4 break-inside-avoid">
              <div className="mb-3 flex items-start">
                <div className="flex-1">
                  <div className="mb-2 flex gap-2">
                    {n.pinned && (
                      <Badge>
                        <Pin />
                        置顶
                      </Badge>
                    )}
                    {n.category && (
                      <Badge variant="secondary">{n.category}</Badge>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold">{n.title}</h3>
                </div>
                <button
                  onClick={() =>
                    db.notes.update(n.id, { favorite: !n.favorite })
                  }
                >
                  {n.favorite ? (
                    <Heart fill="currentColor" className="text-rose-500" />
                  ) : (
                    <Heart />
                  )}
                </button>
              </div>
              <div className="markdown line-clamp-[10]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {n.content}
                </ReactMarkdown>
              </div>
              {n.files.length > 0 && (
                <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                  <Paperclip size={13} />
                  {n.files.length} 个附件
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-1">
                {n.tags.map((t) => (
                  <Badge key={t} variant="outline">
                    #{t}
                  </Badge>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <Actions
                  edit={() => {
                    setEdit(n);
                    setOpen(true);
                  }}
                  del={() => db.notes.delete(n.id)}
                />
              </div>
            </Card>
          ))
        ) : (
          <Card>
            <Empty icon={FileText} />
          </Card>
        )}
      </div>
      <NoteDialog open={open} setOpen={setOpen} value={edit} />
    </>
  );
}
function NoteDialog({
  open,
  setOpen,
  value,
}: {
  open: boolean;
  setOpen: (x: boolean) => void;
  value: Note | null;
}) {
  const empty = {
    title: "",
    content: "",
    category: "",
    tags: [] as string[],
    favorite: false,
    pinned: false,
    files: [] as { name: string; data: string }[],
  };
  const [f, setF] = useState(empty);
  useEffect(
    () =>
      setF(
        value
          ? {
              title: value.title,
              content: value.content,
              category: value.category,
              tags: value.tags,
              favorite: value.favorite,
              pinned: value.pinned,
              files: value.files,
            }
          : empty,
      ),
    [value, open],
  );
  const files = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = [...(e.target.files || [])];
    const converted = await Promise.all(
      selected
        .filter((x) => x.size < 5_000_000)
        .map(
          (x) =>
            new Promise<{ name: string; data: string }>((r) => {
              const fr = new FileReader();
              fr.onload = () => r({ name: x.name, data: String(fr.result) });
              fr.readAsDataURL(x);
            }),
        ),
    );
    setF({ ...f, files: [...f.files, ...converted] });
  };
  const save = async () => {
    if (!f.title.trim()) return;
    const now = new Date().toISOString();
    value
      ? await db.notes.update(value.id, { ...f, updatedAt: now })
      : await db.notes.add({ ...f, id: uid(), createdAt: now, updatedAt: now });
    setOpen(false);
  };
  return (
    <FormDialog wide open={open} setOpen={setOpen} title="备忘录" onSave={save}>
      <div className="form-grid">
        <Field label="标题">
          <Input
            value={f.title}
            onChange={(e) => setF({ ...f, title: e.target.value })}
          />
        </Field>
        <Field label="分类">
          <Input
            value={f.category}
            onChange={(e) => setF({ ...f, category: e.target.value })}
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="内容（支援 Markdown）">
            <Textarea
              className="min-h-48 font-mono"
              value={f.content}
              onChange={(e) => setF({ ...f, content: e.target.value })}
            />
          </Field>
        </div>
        <Field label="标签">
          <Tags value={f.tags} onChange={(tags) => setF({ ...f, tags })} />
        </Field>
        <Field label="附件（单档小于 5MB）">
          <Input type="file" multiple onChange={files} />
        </Field>
        <label className="toggle">
          <Switch
            checked={f.pinned}
            onCheckedChange={(pinned) => setF({ ...f, pinned })}
          />
          置顶
        </label>
        <label className="toggle">
          <Switch
            checked={f.favorite}
            onCheckedChange={(favorite) => setF({ ...f, favorite })}
          />
          收藏
        </label>
      </div>
    </FormDialog>
  );
}

function Streams() {
  const items =
    useLiveQuery(() => db.streams.orderBy("date").reverse().toArray(), []) ||
    [];
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Stream | null>(null);
  return (
    <>
      <PageHead
        title="直播投稿 / 复盘"
        text="留下每一次互动，让下一次表达更好。"
        action={
          <Fab
            onClick={() => {
              setEdit(null);
              setOpen(true);
            }}
            label="新增直播记录"
          />
        }
      />
      <div className="space-y-4">
        {items.length ? (
          items.map((s) => (
            <Card key={s.id}>
              <div className="flex flex-wrap items-start gap-3">
                <span className="icon-orb">
                  <Radio />
                </span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold">{s.streamer}</h3>
                    <Badge variant="secondary">{s.platform}</Badge>
                    {s.mentioned && <Badge>有被念到</Badge>}
                  </div>
                  <small className="text-muted-foreground">{s.date}</small>
                </div>
                <span className="text-amber-500">
                  {"★".repeat(s.rating)}
                  {"☆".repeat(5 - s.rating)}
                </span>
                <Actions
                  edit={() => {
                    setEdit(s);
                    setOpen(true);
                  }}
                  del={() => db.streams.delete(s.id)}
                />
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {[
                  ["投稿内容", s.submission],
                  ["直播心得", s.thoughts],
                  ["复盘", s.review],
                  ["改善点", s.improvements],
                ]
                  .filter((x) => x[1])
                  .map((x) => (
                    <div className="content-box" key={x[0]}>
                      <small>{x[0]}</small>
                      <p className="whitespace-pre-wrap">{x[1]}</p>
                    </div>
                  ))}
              </div>
            </Card>
          ))
        ) : (
          <Card>
            <Empty icon={Radio} />
          </Card>
        )}
      </div>
      <StreamDialog open={open} setOpen={setOpen} value={edit} />
    </>
  );
}
function StreamDialog({
  open,
  setOpen,
  value,
}: {
  open: boolean;
  setOpen: (x: boolean) => void;
  value: Stream | null;
}) {
  const empty = {
    date: today(),
    platform: "YouTube",
    streamer: "",
    submission: "",
    mentioned: false,
    thoughts: "",
    review: "",
    improvements: "",
    rating: 3,
  };
  const [f, setF] = useState(empty);
  useEffect(
    () =>
      setF(
        value
          ? {
              date: value.date,
              platform: value.platform,
              streamer: value.streamer,
              submission: value.submission,
              mentioned: value.mentioned,
              thoughts: value.thoughts,
              review: value.review,
              improvements: value.improvements,
              rating: value.rating,
            }
          : empty,
      ),
    [value, open],
  );
  const save = async () => {
    if (!f.streamer.trim()) return;
    value
      ? await db.streams.update(value.id, f)
      : await db.streams.add({
          ...f,
          id: uid(),
          createdAt: new Date().toISOString(),
        });
    setOpen(false);
  };
  return (
    <FormDialog
      wide
      open={open}
      setOpen={setOpen}
      title="直播记录"
      onSave={save}
    >
      <div className="form-grid">
        <Field label="日期">
          <Input
            type="date"
            value={f.date}
            onChange={(e) => setF({ ...f, date: e.target.value })}
          />
        </Field>
        <Field label="平台">
          <Input
            value={f.platform}
            onChange={(e) => setF({ ...f, platform: e.target.value })}
          />
        </Field>
        <Field label="主播">
          <Input
            value={f.streamer}
            onChange={(e) => setF({ ...f, streamer: e.target.value })}
          />
        </Field>
        <Field label="评分">
          <Select
            value={String(f.rating)}
            onValueChange={(x) => setF({ ...f, rating: Number(x) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((x) => (
                <SelectItem key={x} value={String(x)}>
                  {"★".repeat(x)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        {(
          [
            ["submission", "投稿内容"],
            ["thoughts", "直播心得"],
            ["review", "复盘"],
            ["improvements", "改善点"],
          ] as const
        ).map((x) => (
          <Field key={x[0]} label={x[1]}>
            <Textarea
              value={f[x[0]]}
              onChange={(e) => setF({ ...f, [x[0]]: e.target.value })}
            />
          </Field>
        ))}
        <label className="toggle">
          <Switch
            checked={f.mentioned}
            onCheckedChange={(mentioned) => setF({ ...f, mentioned })}
          />
          有被念到
        </label>
      </div>
    </FormDialog>
  );
}

function Contacts() {
  const items = useLiveQuery(() => db.contacts.toArray(), []) || [];
  const [q, setQ] = useState("");
  const [platform, setPlatform] = useState("all");
  const [sort, setSort] = useState("importance");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Contact | null>(null);
  const platforms = [...new Set(items.map((x) => x.platform).filter(Boolean))];
  const interestText = (c: Contact) =>
    Array.isArray(c.interests) ? c.interests.join("、") : c.interests;
  const shown = items
    .filter(
      (c) =>
        (platform === "all" || c.platform === platform) &&
        [c.username, c.country, interestText(c), c.notes, ...c.tags]
          .join(" ")
          .toLowerCase()
          .includes(q.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.username.localeCompare(b.username)
        : b.importance - a.importance,
    );
  return (
    <>
      <PageHead
        title="直播用户管理"
        text="用心记住每一位重要的社群伙伴。"
        action={
          <Fab
            onClick={() => {
              setEdit(null);
              setOpen(true);
            }}
            label="新增用户"
          />
        }
      />
      <Card className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="search flex-1">
            <Search />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索名称、兴趣、国家、标签"
            />
          </div>
          <Select value={platform} onValueChange={(x) => x && setPlatform(x)}>
            <SelectTrigger className="sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有平台</SelectItem>
              {platforms.map((x) => (
                <SelectItem key={x} value={x}>
                  {x}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(x) => x && setSort(x)}>
            <SelectTrigger className="sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="importance">重要程度</SelectItem>
              <SelectItem value="name">名称排序</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {shown.length ? (
          shown.map((c) => (
            <Card key={c.id}>
              <div className="flex items-start gap-3">
                <span className="avatar">
                  {c.username.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold">{c.username}</h3>
                  <p className="text-sm text-muted-foreground">
                    {c.platform}
                    {c.country && ` · ${c.country}`}
                  </p>
                </div>
                <Actions
                  edit={() => {
                    setEdit(c);
                    setOpen(true);
                  }}
                  del={() => db.contacts.delete(c.id)}
                />
              </div>
              <div className="my-4 flex gap-1 text-amber-500">
                {[1, 2, 3, 4, 5].map((x) => (
                  <Star
                    key={x}
                    size={15}
                    fill={x <= c.importance ? "currentColor" : "none"}
                  />
                ))}
              </div>
              {c.interests && (
                <p className="line-clamp-2 text-sm">{interestText(c)}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-1">
                {c.tags.map((t) => (
                  <Badge variant="outline" key={t}>
                    #{t}
                  </Badge>
                ))}
              </div>
            </Card>
          ))
        ) : (
          <Card className="md:col-span-2 xl:col-span-3">
            <Empty icon={Users} />
          </Card>
        )}
      </div>
      <ContactDialog open={open} setOpen={setOpen} value={edit} />
    </>
  );
}
function ContactDialog({
  open,
  setOpen,
  value,
}: {
  open: boolean;
  setOpen: (x: boolean) => void;
  value: Contact | null;
}) {
  const empty = {
    username: "",
    platform: "",
    country: "",
    interests: "",
    birthday: "",
    chats: "",
    notes: "",
    tags: [] as string[],
    importance: 3,
  };
  const [f, setF] = useState(empty);
  useEffect(
    () =>
      setF(
        value
          ? {
              username: value.username,
              platform: value.platform,
              country: value.country,
              interests: Array.isArray(value.interests)
                ? value.interests.join("，")
                : value.interests,
              birthday: value.birthday,
              chats: value.chats,
              notes: value.notes,
              tags: value.tags,
              importance: value.importance,
            }
          : empty,
      ),
    [value, open],
  );
  const save = async () => {
    if (!f.username.trim()) return;
    value
      ? await db.contacts.update(value.id, f)
      : await db.contacts.add({
          ...f,
          id: uid(),
          createdAt: new Date().toISOString(),
        });
    setOpen(false);
  };
  return (
    <FormDialog
      wide
      open={open}
      setOpen={setOpen}
      title="用户数据"
      onSave={save}
    >
      <div className="form-grid">
        <Field label="用户名">
          <Input
            value={f.username}
            onChange={(e) => setF({ ...f, username: e.target.value })}
          />
        </Field>
        <Field label="平台">
          <Input
            value={f.platform}
            onChange={(e) => setF({ ...f, platform: e.target.value })}
          />
        </Field>
        <Field label="国家">
          <Input
            value={f.country}
            onChange={(e) => setF({ ...f, country: e.target.value })}
          />
        </Field>
        <Field label="生日">
          <Input
            type="date"
            value={f.birthday}
            onChange={(e) => setF({ ...f, birthday: e.target.value })}
          />
        </Field>
        <Field label="兴趣">
          <Textarea
            value={f.interests}
            onChange={(e) => setF({ ...f, interests: e.target.value })}
          />
        </Field>
        <Field label="聊天记录">
          <Textarea
            value={f.chats}
            onChange={(e) => setF({ ...f, chats: e.target.value })}
          />
        </Field>
        <Field label="备注">
          <Textarea
            value={f.notes}
            onChange={(e) => setF({ ...f, notes: e.target.value })}
          />
        </Field>
        <Field label="标签">
          <Tags value={f.tags} onChange={(tags) => setF({ ...f, tags })} />
        </Field>
        <Field label="重要程度">
          <Select
            value={String(f.importance)}
            onValueChange={(x) => setF({ ...f, importance: Number(x) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((x) => (
                <SelectItem value={String(x)} key={x}>
                  {x} 星
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
    </FormDialog>
  );
}

function SettingsPage() {
  return (
    <div>
      <WorkspaceProfileSettings />
      <WorkspaceFontSettings />
      <Card>
        <div>
          <b>Personal Workspace</b>
          <p>PWA · IndexedDB · 离线优先</p>
        </div>
      </Card>
    </div>
  );
}

function PageHead({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        <p className="eyebrow">PERSONAL WORKSPACE</p>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      {action}
    </div>
  );
}
function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Home;
  label: string;
  value: string;
}) {
  return (
    <Card className="flex items-center gap-4">
      <span className="icon-orb">
        <Icon />
      </span>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <b className="text-xl">{value}</b>
      </div>
    </Card>
  );
}
function Actions({ edit, del }: { edit: () => void; del: () => void }) {
  return (
    <div className="flex">
      <Button variant="ghost" size="icon-sm" onClick={edit}>
        <Pencil />
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={del}>
        <Trash2 />
      </Button>
    </div>
  );
}
function FormDialog({
  open,
  setOpen,
  title,
  onSave,
  children,
  wide = false,
}: {
  open: boolean;
  setOpen: (x: boolean) => void;
  title: string;
  onSave: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={cn("max-h-[90vh] overflow-y-auto", wide && "sm:max-w-3xl")}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            数据会自动保存在此设备，不会上传至云端。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">{children}</div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button className="premium-button" onClick={onSave}>
            保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
function SettingRow({
  icon: Icon,
  title,
  text,
  children,
}: {
  icon: typeof Home;
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <div className="setting-row">
      <span className="icon-orb">
        <Icon />
      </span>
      <div className="flex-1">
        <b>{title}</b>
        <p>{text}</p>
      </div>
      {children}
    </div>
  );
}
