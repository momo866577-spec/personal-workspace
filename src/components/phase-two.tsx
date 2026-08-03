"use client";
/* eslint-disable react-hooks/exhaustive-deps */
import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Check, Copy, Dumbbell, Languages, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { aiProvider } from "@/lib/ai-provider";
import { ensureEnglishDailyPlan, setWorkoutCheckin, toggleEnglishDailyTask, workoutStats } from "@/lib/daily";
import { today, uid, type AiToolMode } from "@/lib/types";
import { exportAllData, importAllData } from "@/lib/data-portability";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

export function DashboardPhaseTwo(){
 const tasks=useLiveQuery(()=>db.tasks.where("due").equals(today()).toArray(),[])||[];
 const checkins=useLiveQuery(()=>db.workoutCheckins.toArray(),[]); const plan=useLiveQuery(()=>db.englishDailyPlans.get(today()),[]);
 const stats=useMemo(()=>workoutStats(checkins||[]),[checkins]); const englishTasks=tasks.filter(x=>x.id.startsWith(`english-daily:${today()}:`));
 const remaining=tasks.filter(x=>!x.done).length; const suggestion=stats.todayDone?(englishTasks.some(x=>!x.done)?"今天英语还没有全部完成，抽出五分钟就能推进一点。":remaining?`今天还剩 ${remaining} 项任务，先完成最轻松的一项。`:"今天的目标已经全部完成，可以安心休息了。") : "今天建议先完成运动打卡，让身体先进入状态。";
 return <div className="phase-grid"><section className="phase-card"><Dumbbell/><div><b>今日运动</b><p>{stats.todayDone?"今日已完成":"今日未完成"} · 连续打卡 {stats.streak} 天</p></div></section><section className="phase-card"><Languages/><div><b>今日英语</b><p>{plan?`${englishTasks.filter(x=>x.done).length}/${plan.items.length} 已完成`:"正在准备今日任务"}</p></div></section><section className="phase-card phase-advice"><Sparkles/><div><b>今日 AI 建议</b><p>{suggestion}</p></div></section></div>
}

export function EnglishDailyTasks(){const plan=useLiveQuery(()=>db.englishDailyPlans.get(today()),[]);const tasks=useLiveQuery(()=>db.tasks.where("due").equals(today()).toArray(),[])||[];if(!plan)return null;return <section className="phase-panel"><header><div><b>AI 每日五分钟学习</b><p>每天只生成一次，并同步到今日任务。</p></div><span>{tasks.filter(x=>x.id.startsWith(`english-daily:${today()}:`)&&x.done).length}/{plan.items.length}</span></header><div className="phase-list">{plan.items.map(item=>{const task=tasks.find(x=>x.id===item.taskId);return <label key={item.kind}><Checkbox checked={task?.done||false} onCheckedChange={v=>toggleEnglishDailyTask(item.taskId,Boolean(v))}/><span><b>{item.title}</b><small>{item.detail}</small></span></label>})}</div></section>}

export function WorkoutCheckinPanel(){const rows=useLiveQuery(()=>db.workoutCheckins.toArray(),[])||[];const stats=useMemo(()=>workoutStats(rows),[rows]);return <section className="phase-panel workout-checkin"><header><div><b>每日运动打卡</b><p>点击即可记录今天的完成状态。</p></div><Button onClick={()=>setWorkoutCheckin(today(),!stats.todayDone)} variant={stats.todayDone?"secondary":"default"}>{stats.todayDone?<><Check/>已打卡</>:"今日打卡"}</Button></header><div className="checkin-stats"><span><b>{stats.streak}</b><small>连续天数</small></span><span><b>{stats.week}</b><small>本周打卡</small></span><span><b>{stats.month}</b><small>本月打卡</small></span></div></section>}

const modes:{id:AiToolMode;label:string;placeholder:string}[]=[{id:"reply",label:"高情商回复",placeholder:"输入观众留言"},{id:"review",label:"直播复盘",placeholder:"输入今天直播的内容、对话和发生的事情"},{id:"coach",label:"话术教练",placeholder:"输入直播间情境，例如：有人嫌贵、冷场、没人留言"}];
export function StreamAiAssistant(){const [mode,setMode]=useState<AiToolMode>("reply"),[input,setInput]=useState(""),[output,setOutput]=useState(""),[busy,setBusy]=useState(false);const current=modes.find(x=>x.id===mode)!;const run=async()=>{if(!input.trim())return;setBusy(true);try{const result=await aiProvider.generate({mode,input});setOutput(result);await db.aiToolRecords.add({id:uid(),mode,input,output:result,provider:aiProvider.id,createdAt:new Date().toISOString()})}finally{setBusy(false)}};return <section className="phase-panel ai-assistant"><header><div><b>直播 AI 助手</b><p>当前由本地规则模板驱动，不是真正的大模型 AI。</p></div></header><nav>{modes.map(x=><button className={mode===x.id?"active":""} onClick={()=>{setMode(x.id);setOutput("")}} key={x.id}>{x.label}</button>)}</nav><Textarea value={input} onChange={e=>setInput(e.target.value)} placeholder={current.placeholder} className="min-h-28"/><div className="phase-actions"><Button onClick={run} disabled={busy||!input.trim()}>{busy?"生成中…":"生成内容"}</Button></div>{output&&<div className="ai-output"><button onClick={()=>navigator.clipboard.writeText(output)}><Copy/>一键复制</button><pre>{output}</pre></div>}</section>}

export async function initializeDailyFeatures(){await ensureEnglishDailyPlan()}

export function CompleteDataPanel(){const [status,setStatus]=useState("");const exportData=async()=>{const data=await exportAllData();const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));const link=document.createElement("a");link.href=url;link.download=`personal-workspace-v2-${today()}.json`;link.click();URL.revokeObjectURL(url);setStatus("完整数据已导出")};const importData=async(e:React.ChangeEvent<HTMLInputElement>)=>{try{const file=e.target.files?.[0];if(!file)return;await importAllData(JSON.parse(await file.text()));setStatus("完整数据已导入")}catch(error){setStatus(error instanceof Error?error.message:"导入失败")}};return <section className="phase-panel"><header><div><b>完整数据管理（v2）</b><p>涵盖原有六张表、运动打卡、每日英语计划与本地 AI 历史。</p></div></header><div className="phase-actions"><Button onClick={exportData}>导出完整 JSON</Button><label className="import-button">导入完整 JSON<input type="file" accept="application/json" onChange={importData}/></label></div>{status&&<p className="phase-status">{status}</p>}</section>}
