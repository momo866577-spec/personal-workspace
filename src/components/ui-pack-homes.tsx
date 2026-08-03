"use client";

import { motion } from "motion/react";
import {
  ArrowUpRight, BookOpen, CalendarCheck, CheckCircle2, Clock3, Dumbbell,
  FileText, Languages, ListTodo, Radio, Sparkles, Star, TrendingUp,
} from "lucide-react";
import type { WorkspaceTheme } from "./workspace-theme-provider";
import type { EnglishEntry, Note, Stream, Task, Workout } from "@/lib/types";

type Page="dashboard"|"tasks"|"english"|"workouts"|"notes"|"streams"|"contacts"|"settings";
export type PackHomeData={tasks:Task[];english:EnglishEntry[];workouts:Workout[];notes:Note[];streams:Stream[];done:number;pct:number;go:(page:Page)=>void;toggle:(task:Task)=>void;phaseTwo:React.ReactNode};
const dateText=new Intl.DateTimeFormat("zh-CN",{month:"long",day:"numeric",weekday:"long"}).format(new Date());

export function JellyVisionHome(d:PackHomeData){
  return <div className="v3-home jelly-home"><section className="jelly-hero"><div><small>{dateText}</small><h2>让今天柔软地展开</h2><p>完成一点，就会亮起一点。</p></div><motion.strong animate={{boxShadow:["0 0 0 0 #ff8db955","0 0 0 14px #ff8db900"]}} transition={{repeat:Infinity,duration:2}}>{d.pct}<i>%</i></motion.strong></section><div className="jelly-orbit"><button onClick={()=>d.go("tasks")}><CalendarCheck/><b>今日计划</b><span>{d.tasks.length-d.done} 项</span></button><button onClick={()=>d.go("english")}><Languages/><b>英语学习</b><span>{d.english.length} 条</span></button><button onClick={()=>d.go("workouts")}><Dumbbell/><b>运动打卡</b><span>{d.workouts.length} 次</span></button></div><section className="jelly-task-pod"><header><span><ListTodo/>今日任务</span><button onClick={()=>d.go("tasks")}>全部 <ArrowUpRight/></button></header>{d.tasks.length?d.tasks.slice(0,4).map(t=><button key={t.id} onClick={()=>d.toggle(t)} className={t.done?"done":""}><i>{t.done?<CheckCircle2/>:<Clock3/>}</i><span><b>{t.title}</b><small>{t.due}</small></span></button>):<p className="pack-empty">今天还没有任务，慢慢开始吧。</p>}</section><div className="pack-phase-slot">{d.phaseTwo}</div></div>;
}

export function AppleCalmHome(d:PackHomeData){
  const first=d.tasks.find(t=>!t.done);
  return <div className="v3-home apple-home"><section className="apple-today"><small>{dateText}</small><h2>今天</h2><p>{first?`下一件事：${first.title}`:"今天的计划已经完成。"}</p><div><span style={{width:`${d.pct}%`}}/></div></section><div className="apple-widget-row"><button onClick={()=>d.go("tasks")}><span>{d.tasks.length-d.done}</span><small>待办</small></button><button onClick={()=>d.go("english")}><span>{d.english.length}</span><small>学习记录</small></button><button onClick={()=>d.go("workouts")}><span>{d.workouts.length}</span><small>运动</small></button><button onClick={()=>d.go("notes")}><span>{d.notes.length}</span><small>最近笔记</small></button></div><section className="apple-focus"><header><div><Sparkles/><span><b>今日重点</b><small>保持简单，只看下一步</small></span></div><button onClick={()=>d.go("tasks")}>管理</button></header>{d.tasks.slice(0,5).map(t=><label key={t.id}><button onClick={()=>d.toggle(t)} aria-label="切换完成状态">{t.done&&<CheckCircle2/>}</button><span className={t.done?"done":""}>{t.title}</span><small>{t.due}</small></label>)}</section><div className="apple-insight">{d.phaseTwo}</div></div>;
}

export function BentoStudioHome(d:PackHomeData){
  return <div className="v3-home bento-home"><section className="bento-lead"><small>{dateText}</small><h2>我的今日拼图</h2><p>每完成一格，今天就更完整。</p><strong>{d.pct}%</strong></section><button className="bento-piece tasks" onClick={()=>d.go("tasks")}><CalendarCheck/><span><small>TASKS</small><b>{d.tasks.length-d.done} 件待完成</b></span><ArrowUpRight/></button><button className="bento-piece learn" onClick={()=>d.go("english")}><BookOpen/><span><small>LEARN</small><b>{d.english.length} 条学习</b></span></button><button className="bento-piece move" onClick={()=>d.go("workouts")}><TrendingUp/><span><small>MOVE</small><b>{d.workouts.length} 次运动</b></span></button><button className="bento-piece notes" onClick={()=>d.go("notes")}><FileText/><span><small>NOTES</small><b>{d.notes.length} 篇笔记</b></span></button><section className="bento-list"><header><b>正在进行</b><button onClick={()=>d.go("tasks")}>打开计划</button></header>{d.tasks.slice(0,3).map((t,index)=><button key={t.id} onClick={()=>d.toggle(t)}><i>{String(index+1).padStart(2,"0")}</i><span className={t.done?"done":""}>{t.title}</span><small>{t.due}</small></button>)}</section><div className="bento-ai">{d.phaseTwo}</div></div>;
}

export function FloatingGlassHome(d:PackHomeData){
  return <div className="v3-home floating-home"><section className="floating-intro"><span className="floating-star"><Star/></span><div><small>{dateText}</small><h2>你的轻盈空间</h2><p>把注意力放在此刻最重要的事情上。</p></div><strong>{d.pct}%</strong></section><div className="floating-cards"><motion.button whileHover={{y:-7,rotate:-1}} onClick={()=>d.go("tasks")}><CalendarCheck/><b>今日计划</b><span>{d.tasks.length-d.done} 项等待你</span></motion.button><motion.button whileHover={{y:-7,rotate:1}} onClick={()=>d.go("english")}><Languages/><b>学习空间</b><span>{d.english.length} 条记录</span></motion.button><motion.button whileHover={{y:-7,rotate:-1}} onClick={()=>d.go("workouts")}><Dumbbell/><b>身体节奏</b><span>{d.workouts.length} 次运动</span></motion.button></div><section className="floating-timeline"><h3>今天的轨迹</h3>{d.tasks.slice(0,4).map(t=><button key={t.id} onClick={()=>d.toggle(t)}><i className={t.done?"done":""}/><span><b>{t.title}</b><small>{t.due}</small></span></button>)}</section><div className="floating-advice">{d.phaseTwo}</div></div>;
}

export function NotebookPagesHome(d:PackHomeData){
  return <div className="v3-home notebook-home"><div className="notebook-margin"/><section className="notebook-entry"><small>{dateText}</small><h2>今天这一页</h2><p>留下一点进度，也留下一点呼吸。</p></section><section className="notebook-summary"><span><b>{d.done}/{d.tasks.length}</b><small>任务</small></span><span><b>{d.english.length}</b><small>学习</small></span><span><b>{d.workouts.length}</b><small>运动</small></span></section><section className="notebook-checklist"><header><b>TO DO</b><button onClick={()=>d.go("tasks")}>查看清单</button></header>{d.tasks.slice(0,5).map(t=><label key={t.id}><button className={t.done?"checked":""} onClick={()=>d.toggle(t)}>{t.done&&<CheckCircle2/>}</button><span className={t.done?"done":""}>{t.title}</span><small>{t.due}</small></label>)}</section><div className="notebook-quote"><Sparkles/><span>今天也只需要比昨天多走一点点。</span></div><div className="notebook-advice">{d.phaseTwo}</div></div>;
}

export function AiWorkspaceHome(d:PackHomeData){
  const current=d.tasks.filter(t=>!t.done).slice(0,3);
  return <div className="v3-home ai-home"><section className="ai-brief"><div><span><Sparkles/>DAILY BRIEF</span><h2>早上好，这是你的今日工作区</h2><p>{current.length?`还有 ${current.length} 件优先事项需要处理。`:"主要事项已经处理完毕。"}</p></div><strong>{d.pct}%</strong></section><div className="ai-columns"><section className="ai-priority"><header><b>优先队列</b><button onClick={()=>d.go("tasks")}>查看全部</button></header>{current.map((t,index)=><button key={t.id} onClick={()=>d.toggle(t)}><i>P{index+1}</i><span><b>{t.title}</b><small>{t.due}</small></span><CheckCircle2/></button>)}</section><section className="ai-activity"><header><b>工作区</b></header><button onClick={()=>d.go("english")}><Languages/><span><b>英语学习</b><small>{d.english.length} 条记录</small></span><ArrowUpRight/></button><button onClick={()=>d.go("workouts")}><Dumbbell/><span><b>运动打卡</b><small>{d.workouts.length} 次记录</small></span><ArrowUpRight/></button><button onClick={()=>d.go("streams")}><Radio/><span><b>直播复盘</b><small>{d.streams.length} 条记录</small></span><ArrowUpRight/></button></section></div><div className="ai-daily-advice">{d.phaseTwo}</div></div>;
}

export const packHomes:Record<WorkspaceTheme,(props:PackHomeData)=>React.ReactNode>={
  "bunny-life":JellyVisionHome,
  "cat-cafe":AppleCalmHome,
  "peach-bubble":BentoStudioHome,
  "forest-diary":FloatingGlassHome,
  "little-planet":NotebookPagesHome,
  "pet-assistant":AiWorkspaceHome,
};
