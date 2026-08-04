"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Activity, AlertTriangle, CalendarDays, Droplets, GlassWater, HeartPulse, Plus, Save, Sparkles, Trash2, Utensils } from "lucide-react";
import { db } from "@/lib/db";
import { callProvider, readSavedKey } from "@/lib/ai-connection";
import { analyzePeriods, cleanPeriodAiOutput, periodAdvice, periodAiPrompt, periodAiSystemPrompt, periodDuration } from "@/lib/period-health";
import { today, uid, type PeriodFlow, type PeriodRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const flowOptions:{value:PeriodFlow;label:string;hint:string}[]=[
 {value:"spotting",label:"点滴",hint:"少量点状"},{value:"light",label:"偏少",hint:"流量较轻"},{value:"medium",label:"正常",hint:"日常流量"},{value:"heavy",label:"偏多",hint:"流量较重"},
];
const symptoms=["腹痛","腰酸","头痛","疲劳","乳房胀痛","腹胀","情绪波动","长痘","恶心","失眠"];
const colors=[{value:"bright-red",label:"鲜红"},{value:"dark-red",label:"暗红"},{value:"brown",label:"褐色"},{value:"pink",label:"粉红"}];
const blank=()=>({startDate:today(),endDate:"",flow:"medium" as PeriodFlow,padChanges:4,pain:0,color:"bright-red",symptoms:[] as string[],notes:""});

export function PeriodTracker(){
 const records=useLiveQuery(()=>db.periodRecords.orderBy("startDate").reverse().toArray(),[])||[];
 const connection=useLiveQuery(()=>db.aiConnections.get("active"),[]);
 const [form,setForm]=useState(blank),[editing,setEditing]=useState<string|null>(null),[notice,setNotice]=useState(""),[aiOutput,setAiOutput]=useState(""),[busy,setBusy]=useState(false);
 const summary=analyzePeriods(records);
 const save=async()=>{if(form.endDate&&form.endDate<form.startDate){setNotice("结束日期不能早于开始日期");return}const now=new Date().toISOString();const row:PeriodRecord={...form,endDate:form.endDate||undefined,id:editing||uid(),createdAt:editing?(records.find(x=>x.id===editing)?.createdAt||now):now,updatedAt:now};await db.periodRecords.put(row);setForm(blank());setEditing(null);setNotice("记录已保存")};
 const edit=(record:PeriodRecord)=>{setEditing(record.id);setForm({startDate:record.startDate,endDate:record.endDate||"",flow:record.flow,padChanges:record.padChanges,pain:record.pain,color:record.color,symptoms:record.symptoms,notes:record.notes});window.scrollTo({top:0,behavior:"smooth"})};
 const toggleSymptom=(symptom:string)=>setForm(value=>({...value,symptoms:value.symptoms.includes(symptom)?value.symptoms.filter(x=>x!==symptom):[...value.symptoms,symptom]}));
 const analyzeWithAi=async()=>{setBusy(true);setNotice("");try{if(!connection)throw new Error("尚未连接 AI，请先到设置 → AI 中心完成连接");const apiKey=await readSavedKey();if(!apiKey)throw new Error("AI 密钥不可用，请到设置 → AI 中心重新连接");const result=await callProvider(connection,apiKey,periodAiPrompt(records,summary),700,periodAiSystemPrompt(),.25);setAiOutput(cleanPeriodAiOutput(result))}catch(error){setNotice(error instanceof Error?error.message:"AI 分析失败")}finally{setBusy(false)}};
 return <div className="period-page">
  <section className="period-hero"><div><small>PRIVATE · LOCAL FIRST</small><h2>经期记录</h2><p>记录日期、流量和身体感受，看见自己的周期节奏。</p></div><span><Droplets/><b>{summary.regularity}</b></span></section>
  <div className="period-layout">
   <section className="period-editor"><header><div><CalendarDays/><span><b>{editing?"修改记录":"添加一次经期"}</b><small>数据只保存在本机 IndexedDB</small></span></div>{editing&&<button onClick={()=>{setEditing(null);setForm(blank())}}>取消修改</button>}</header>
    <div className="period-date-grid"><label>开始日期<Input type="date" value={form.startDate} onChange={event=>setForm({...form,startDate:event.target.value})}/></label><label>结束日期<Input type="date" min={form.startDate} value={form.endDate} onChange={event=>setForm({...form,endDate:event.target.value})}/></label></div>
    <fieldset><legend>经量</legend><div className="flow-options">{flowOptions.map(option=><button type="button" key={option.value} className={form.flow===option.value?"active":""} onClick={()=>setForm({...form,flow:option.value})}><Droplets/><b>{option.label}</b><small>{option.hint}</small></button>)}</div></fieldset>
    <div className="period-date-grid"><label>一天更换经期用品次数<Input type="number" min="0" max="30" value={form.padChanges} onChange={event=>setForm({...form,padChanges:Number(event.target.value)})}/></label><label>疼痛程度 <b>{form.pain}/10</b><input className="period-range" type="range" min="0" max="10" value={form.pain} onChange={event=>setForm({...form,pain:Number(event.target.value)})}/></label></div>
    <fieldset><legend>颜色</legend><div className="period-colors">{colors.map(color=><button type="button" key={color.value} className={form.color===color.value?"active":""} onClick={()=>setForm({...form,color:color.value})}><i className={color.value}/>{color.label}</button>)}</div></fieldset>
    <fieldset><legend>身体感受</legend><div className="symptom-grid">{symptoms.map(symptom=><button type="button" key={symptom} className={form.symptoms.includes(symptom)?"active":""} onClick={()=>toggleSymptom(symptom)}><Plus/>{symptom}</button>)}</div></fieldset>
    <label className="period-notes">备注<Textarea value={form.notes} onChange={event=>setForm({...form,notes:event.target.value})} placeholder="例如：今天比较疲劳、使用热敷后舒服一些"/></label>
    {notice&&<p className="period-notice" role="status">{notice}</p>}<Button className="period-save" onClick={save}><Save/>{editing?"保存修改":"保存记录"}</Button>
   </section>
   <aside className="period-insights"><section className="period-stats"><header><Activity/><b>周期概况</b></header><div><span><strong>{summary.cycleCount}</strong><small>已记录周期</small></span><span><strong>{summary.averageCycle??"—"}</strong><small>平均周期（天）</small></span><span><strong>{summary.averageDuration??"—"}</strong><small>平均经期（天）</small></span><span><strong>{summary.nextEstimate?.slice(5)||"—"}</strong><small>下次预计</small></span></div><p className={`regularity ${summary.regularity==="建议关注"?"attention":""}`}><HeartPulse/>{summary.regularity}{summary.variation!==null&&<small>周期波动 {summary.variation} 天</small>}</p></section>
    <section className="period-analysis"><header><div><Sparkles/><span><b>安全周期分析</b><small>{connection?`连接 ${connection.provider} · ${connection.model}`:"当前使用本机规则"}</small></span></div>{connection&&<Button size="sm" onClick={analyzeWithAi} disabled={busy}>{busy?"分析中…":"使用 AI 分析"}</Button>}</header>{summary.alerts.length?<ul>{summary.alerts.map(alert=><li key={alert}><AlertTriangle/>{alert}</li>)}</ul>:<p>{records.length<3?"至少记录 3 次开始日期后，可判断周期规律性。":"暂未发现明显的周期提醒。"}</p>}{!connection&&<small>需要更深入分析时，可前往设置 → AI 中心连接服务商。</small>}{aiOutput&&<pre>{aiOutput}</pre>}</section>
    <section className="period-care"><header><GlassWater/><b>经期照顾建议</b></header><div><span><Utensils/><b>吃什么</b></span>{periodAdvice.food.map(item=><p key={item}>{item}</p>)}</div><div><span><HeartPulse/><b>舒服一点</b></span>{periodAdvice.comfort.map(item=><p key={item}>{item}</p>)}</div></section>
    <section className="period-warning"><header><AlertTriangle/><b>需要就医的情况</b></header>{periodAdvice.urgent.map(item=><p key={item}>{item}</p>)}<small>本页提供记录与健康提醒，不替代医生诊断。</small></section>
   </aside>
  </div>
  <section className="period-history"><header><div><CalendarDays/><span><b>历史记录</b><small>按开始日期排列</small></span></div></header>{records.length?<div>{records.map(record=><article key={record.id}><span className={`flow-dot ${record.flow}`}><Droplets/></span><div><b>{record.startDate} {record.endDate?`— ${record.endDate}`:"— 进行中"}</b><small>{flowOptions.find(x=>x.value===record.flow)?.label} · {periodDuration(record)} 天 · 疼痛 {record.pain}/10</small>{record.symptoms.length>0&&<p>{record.symptoms.join(" · ")}</p>}</div><button onClick={()=>edit(record)}>修改</button><button className="delete" onClick={()=>db.periodRecords.delete(record.id)} aria-label={`删除 ${record.startDate} 经期记录`}><Trash2/></button></article>)}</div>:<p className="period-empty">还没有经期记录，添加第一次记录后就能开始分析周期。</p>}</section>
 </div>;
}
