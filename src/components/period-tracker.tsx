"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Activity, AlertTriangle, CalendarDays, ChevronLeft, ChevronRight, Droplets, GlassWater, HeartPulse, Plus, Save, Sparkles, Trash2, Utensils } from "lucide-react";
import { db } from "@/lib/db";
import { callProvider, readSavedKey } from "@/lib/ai-connection";
import { analyzePeriods, cleanPeriodAiOutput, periodAdvice, periodAiPrompt, periodAiSystemPrompt } from "@/lib/period-health";
import { today, uid, type PeriodFlow, type PeriodRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const flowOptions:{value:PeriodFlow;label:string;hint:string}[]=[
 {value:"spotting",label:"点滴",hint:"少量点状"},{value:"light",label:"偏少",hint:"流量较轻"},{value:"medium",label:"正常",hint:"日常流量"},{value:"heavy",label:"偏多",hint:"流量较重"},
];
const symptoms=["腹痛","腰酸","头痛","疲劳","乳房胀痛","腹胀","情绪波动","长痘","恶心","失眠"];
const colors=[{value:"bright-red",label:"鲜红"},{value:"dark-red",label:"暗红"},{value:"brown",label:"褐色"},{value:"pink",label:"粉红"}];
const dateKey=(date:Date)=>date.toLocaleDateString("en-CA");
const blank=(date=today())=>({startDate:date,endDate:"",flow:"medium" as PeriodFlow,padChanges:4,pain:0,color:"bright-red",symptoms:[] as string[],notes:""});

function MonthCalendar({month,records,selected,onSelect,onMove}:{month:Date;records:PeriodRecord[];selected:string;onSelect:(date:string)=>void;onMove:(offset:number)=>void}){
 const year=month.getFullYear(),monthIndex=month.getMonth(),first=new Date(year,monthIndex,1),count=new Date(year,monthIndex+1,0).getDate();
 const cells=Array.from({length:first.getDay()+count},(_,index)=>index<first.getDay()?null:new Date(year,monthIndex,index-first.getDay()+1));
 const byDate=new Map(records.map(record=>[record.startDate,record]));
 return <section className="period-calendar"><header><button onClick={()=>onMove(-1)} aria-label="上个月"><ChevronLeft/></button><div><b>{year} 年 {monthIndex+1} 月</b><small>点击日期记录当天情况</small></div><button onClick={()=>onMove(1)} aria-label="下个月"><ChevronRight/></button></header><div className="period-weekdays">{["日","一","二","三","四","五","六"].map(day=><span key={day}>{day}</span>)}</div><div className="period-days">{cells.map((date,index)=>{if(!date)return <i key={`empty-${index}`}/>;const key=dateKey(date),record=byDate.get(key);return <button key={key} className={`${selected===key?"selected":""} ${record?`recorded ${record.flow}`:""} ${key===today()?"today":""}`} onClick={()=>onSelect(key)}><span>{date.getDate()}</span>{record&&<><Droplets/><small>{flowOptions.find(option=>option.value===record.flow)?.label}</small></>}</button>})}</div><footer><span><i className="spotting"/>点滴</span><span><i className="light"/>偏少</span><span><i className="medium"/>正常</span><span><i className="heavy"/>偏多</span></footer></section>;
}

export function PeriodTracker(){
 const queriedRecords=useLiveQuery(()=>db.periodRecords.orderBy("startDate").reverse().toArray(),[]);
 const records=useMemo(()=>queriedRecords||[],[queriedRecords]);
 const connection=useLiveQuery(()=>db.aiConnections.get("active"),[]);
 const [month,setMonth]=useState(()=>{const now=new Date();return new Date(now.getFullYear(),now.getMonth(),1)});
 const [selected,setSelected]=useState(today()),[form,setForm]=useState(blank),[editing,setEditing]=useState<string|null>(null),[notice,setNotice]=useState(""),[aiOutput,setAiOutput]=useState(""),[busy,setBusy]=useState(false);
 const summary=analyzePeriods(records);
 const selectedRecord=useMemo(()=>records.find(record=>record.startDate===selected),[records,selected]);
 const selectDate=(date:string)=>{const record=records.find(item=>item.startDate===date);setSelected(date);setEditing(record?.id||null);setForm(record?{startDate:date,endDate:"",flow:record.flow,padChanges:record.padChanges,pain:record.pain,color:record.color,symptoms:record.symptoms,notes:record.notes}:blank(date));setNotice("")};
 const save=async()=>{const now=new Date().toISOString();const existing=records.find(record=>record.startDate===selected);const row:PeriodRecord={...form,startDate:selected,endDate:undefined,id:existing?.id||editing||uid(),createdAt:existing?.createdAt||now,updatedAt:now};await db.periodRecords.put(row);setEditing(row.id);setNotice(`${selected} 的记录已保存`)};
 const remove=async()=>{if(!selectedRecord)return;await db.periodRecords.delete(selectedRecord.id);setEditing(null);setForm(blank(selected));setNotice(`${selected} 的记录已删除`)};
 const toggleSymptom=(symptom:string)=>setForm(value=>({...value,symptoms:value.symptoms.includes(symptom)?value.symptoms.filter(x=>x!==symptom):[...value.symptoms,symptom]}));
 const analyzeWithAi=async()=>{setBusy(true);setNotice("");try{if(!connection)throw new Error("尚未连接 AI，请先到设置 → AI 中心完成连接");const apiKey=await readSavedKey();if(!apiKey)throw new Error("AI 密钥不可用，请到设置 → AI 中心重新连接");const result=await callProvider(connection,apiKey,periodAiPrompt(records,summary),700,periodAiSystemPrompt(),.25);setAiOutput(cleanPeriodAiOutput(result))}catch(error){setNotice(error instanceof Error?error.message:"AI 分析失败")}finally{setBusy(false)}};
 return <div className="period-page">
  <MonthCalendar month={month} records={records} selected={selected} onSelect={selectDate} onMove={offset=>setMonth(value=>new Date(value.getFullYear(),value.getMonth()+offset,1))}/>
  <div className="period-layout">
   <section className="period-editor"><header><div><CalendarDays/><span><b>{selected} · 当天记录</b><small>{selectedRecord?"这一天已有记录，可以继续修改":"填写后会标记在上方月历"}</small></span></div>{selectedRecord&&<button className="period-delete-day" onClick={remove}><Trash2/>删除当天</button>}</header>
    <fieldset><legend>当天经量</legend><div className="flow-options">{flowOptions.map(option=><button type="button" key={option.value} className={form.flow===option.value?"active":""} onClick={()=>setForm({...form,flow:option.value})}><Droplets/><b>{option.label}</b><small>{option.hint}</small></button>)}</div></fieldset>
    <div className="period-date-grid"><label>当天更换经期用品次数<Input type="number" min="0" max="30" value={form.padChanges} onChange={event=>setForm({...form,padChanges:Number(event.target.value)})}/></label><label>当天疼痛程度 <b>{form.pain}/10</b><input className="period-range" type="range" min="0" max="10" value={form.pain} onChange={event=>setForm({...form,pain:Number(event.target.value)})}/></label></div>
    <fieldset><legend>当天颜色</legend><div className="period-colors">{colors.map(color=><button type="button" key={color.value} className={form.color===color.value?"active":""} onClick={()=>setForm({...form,color:color.value})}><i className={color.value}/>{color.label}</button>)}</div></fieldset>
    <fieldset><legend>当天身体感受</legend><div className="symptom-grid">{symptoms.map(symptom=><button type="button" key={symptom} className={form.symptoms.includes(symptom)?"active":""} onClick={()=>toggleSymptom(symptom)}><Plus/>{symptom}</button>)}</div></fieldset>
    <label className="period-notes">当天备注<Textarea value={form.notes} onChange={event=>setForm({...form,notes:event.target.value})} placeholder="例如：上午量较多，热敷后腹痛缓解"/></label>
    {notice&&<p className="period-notice" role="status">{notice}</p>}<Button className="period-save" onClick={save}><Save/>保存 {selected} 的记录</Button>
   </section>
   <aside className="period-insights"><section className="period-stats"><header><Activity/><b>周期概况</b></header><div><span><strong>{summary.cycleCount}</strong><small>已识别周期</small></span><span><strong>{summary.averageCycle??"—"}</strong><small>平均周期（天）</small></span><span><strong>{summary.averageDuration??"—"}</strong><small>平均经期（天）</small></span><span><strong>{summary.nextEstimate?.slice(5)||"—"}</strong><small>下次预计</small></span></div><p className={`regularity ${summary.regularity==="建议关注"?"attention":""}`}><HeartPulse/>{summary.regularity}{summary.variation!==null&&<small>周期波动 {summary.variation} 天</small>}</p></section>
    <section className="period-analysis"><header><div><Sparkles/><span><b>安全周期分析</b><small>{connection?`连接 ${connection.provider} · ${connection.model}`:"当前使用本机规则"}</small></span></div>{connection&&<Button size="sm" onClick={analyzeWithAi} disabled={busy}>{busy?"分析中…":"使用 AI 分析"}</Button>}</header>{summary.alerts.length?<ul>{summary.alerts.map(alert=><li key={alert}><AlertTriangle/>{alert}</li>)}</ul>:<p>{summary.cycleCount<3?"记录至少 3 个完整周期后，可更可靠地观察规律性。":"暂未发现明显的周期提醒。"}</p>}{!connection&&<small>需要更深入分析时，可前往设置 → AI 中心连接服务商。</small>}{aiOutput&&<pre>{aiOutput}</pre>}</section>
    <section className="period-care"><header><GlassWater/><b>经期照顾建议</b></header><div><span><Utensils/><b>吃什么</b></span>{periodAdvice.food.map(item=><p key={item}>{item}</p>)}</div><div><span><HeartPulse/><b>舒服一点</b></span>{periodAdvice.comfort.map(item=><p key={item}>{item}</p>)}</div></section>
    <section className="period-warning"><header><AlertTriangle/><b>需要就医的情况</b></header>{periodAdvice.urgent.map(item=><p key={item}>{item}</p>)}<small>本页提供记录与健康提醒，不替代医生诊断。</small></section>
   </aside>
  </div>
 </div>;
}
