"use client";

import type { ReactNode } from "react";
import {
  BookOpenText,
  Check,
  Dumbbell,
  FileText,
  Flower2,
  Radio,
  Sparkles,
  Target,
} from "lucide-react";
import type { WorkspaceTheme } from "./workspace-theme-provider";
import type { EnglishEntry, Note, Stream, Task, Workout } from "@/lib/types";

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
export type PackHomeData = {
  tasks: Task[];
  english: EnglishEntry[];
  workouts: Workout[];
  notes: Note[];
  streams: Stream[];
  done: number;
  pct: number;
  go: (page: Page) => void;
  toggle: (task: Task) => void;
  phaseTwo: ReactNode;
};

function Ring({ value }: { value: number }) {
  return (
    <div
      className="progress-ring"
      style={
        {
          "--progress": `${Math.max(3, value) * 3.6}deg`,
        } as React.CSSProperties
      }
    >
      <b>{value}%</b>
      <small>今日完成</small>
    </div>
  );
}
function GlassPinkDashboard(data: PackHomeData) {
  const pending = data.tasks.filter((task) => !task.done).slice(0, 5);
  return (
    <div className="dashboard-glass">
      <section className="progress-hero glass-panel">
        <div className="hero-copy">
          <small>今日进度</small>
          <strong>{data.pct}%</strong>
          <p>保持节奏，稳步前进</p>
        </div>
        <div className="hero-track">
          <i style={{ width: `${data.pct}%` }} />
        </div>
        <div className="hero-stats">
          <span>
            <Target />
            <b>{data.done}</b>
            <small>完成任务</small>
          </span>
          <span>
            <FileText />
            <b>{data.tasks.length - data.done}</b>
            <small>待办任务</small>
          </span>
          <span>
            <Sparkles />
            <b>{data.english.length}</b>
            <small>学习记录</small>
          </span>
        </div>
      </section>
      <section className="focus-panel glass-panel">
        <header>
          <Flower2 className="section-flower" aria-hidden="true" />
          <h2>今日聚焦</h2>
        </header>
        <div className="focus-quote-wrap">
          <blockquote className="focus-quote">小小的进步，也是向前迈出的一大步。</blockquote>
          <Flower2 className="quote-flower" aria-hidden="true" />
        </div>
        <button className="glass-action" onClick={() => data.go("tasks")}>
          开始专注
        </button>
      </section>
      <section className="today-tasks glass-panel">
        <header>
          <h2>今日任务</h2>
          <button onClick={() => data.go("tasks")}>查看全部</button>
        </header>
        <div>
          {pending.length ? (
            pending.map((task) => (
              <button
                className="task-row"
                key={task.id}
                onClick={() => data.toggle(task)}
              >
                <span>
                  <Check />
                </span>
                <b>{task.title}</b>
                <small>{task.due}</small>
              </button>
            ))
          ) : (
            <p className="soft-empty">今天的任务都完成啦</p>
          )}
        </div>
      </section>
      <section className="period-preview glass-panel">
        <header>
          <h2>经期记录</h2>
          <button onClick={() => data.go("periods")}>打开日历</button>
        </header>
        <p>按天记录经量、颜色与身体感受，月历会清楚显示每天状态。</p>
        <button className="glass-action" onClick={() => data.go("periods")}>
          记录今天
        </button>
      </section>
      <section className="learning-card glass-panel">
        <header>
          <BookOpenText />
          <h2>英语学习</h2>
        </header>
        <div>
          <Ring value={Math.min(100, data.english.length * 20)} />
          <p>
            <b>{data.english.length}</b> 条学习记录
          </p>
        </div>
        <button className="glass-action" onClick={() => data.go("english")}>
          继续学习
        </button>
      </section>
      <section className="workout-card glass-panel">
        <header>
          <Dumbbell />
          <h2>运动打卡</h2>
        </header>
        <div>
          <Ring value={data.workouts.length ? 100 : 0} />
          <p>
            <b>{data.workouts.length}</b> 次运动记录
          </p>
        </div>
        <button className="glass-action" onClick={() => data.go("workouts")}>
          记录运动
        </button>
      </section>
      <section className="recent-card glass-panel">
        <header>
          <FileText />
          <h2>最近笔记</h2>
          <button onClick={() => data.go("notes")}>查看全部</button>
        </header>
        {data.notes.length ? (
          <ul>
            {data.notes.map((note) => (
              <li key={note.id}>
                <b>{note.title}</b>
                <small>
                  {new Date(note.updatedAt).toLocaleDateString("zh-CN")}
                </small>
              </li>
            ))}
          </ul>
        ) : (
          <p className="soft-empty">还没有最近笔记</p>
        )}
      </section>
      <section className="stream-card glass-panel">
        <header>
          <Radio />
          <h2>最近直播</h2>
          <button onClick={() => data.go("streams")}>进入复盘</button>
        </header>
        <p>
          {data.streams.length
            ? `已有 ${data.streams.length} 条近期直播记录`
            : "完成直播后，在这里快速复盘。"}
        </p>
      </section>
      <div className="phase-two-slot">{data.phaseTwo}</div>
    </div>
  );
}
export const packHomes: Record<
  WorkspaceTheme,
  (props: PackHomeData) => ReactNode
> = { "glass-pink": GlassPinkDashboard };
