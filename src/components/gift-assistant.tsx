"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronRight, Clock3, Gift, Pencil, Plus, Search, Star, Trash2, UserRound, Users } from "lucide-react";
import { db } from "@/lib/db";
import { today, uid, type Contact, type GiftRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const platforms = ["B站", "抖音", "快手"];
const defaultTags = ["新粉", "老粉", "VIP", "高价值", "高互动", "需要跟进", "潜力客户"];
const defaultTraits = ["幽默", "理性", "冲动", "爱聊天", "不爱说话", "高消费", "慢热"];
const money = (value:number) => `¥${value.toFixed(2)}`;
const nowTime = () => new Date().toTimeString().slice(0,5);
const recordTotal = (row:GiftRecord) => row.quantity * row.unitValue;
const emptyRecord = () => ({date:today(), time:nowTime(), platform:"B站", username:"", giftName:"", quantity:1, amount:0, notes:""});
const emptyContact = () => ({username:"", platform:"B站", country:"", age:"", profession:"", interests:[] as string[], traits:[] as string[], notes:"", tags:[] as string[], importance:3});

function toggle(list:string[], value:string){return list.includes(value)?list.filter(item=>item!==value):[...list,value]}
function splitTags(value:string){return value.split(/[,，]/).map(item=>item.trim()).filter(Boolean)}

export function GiftDashboardCard({open}:{open:()=>void}){
  const contacts=useLiveQuery(()=>db.contacts.toArray(),[])||[];
  const queriedRecords=useLiveQuery(()=>db.giftRecords.orderBy("date").reverse().toArray(),[]);
  const records=useMemo(()=>queriedRecords||[],[queriedRecords]);
  const important=contacts.filter(contact=>contact.importance>=4||contact.tags.some(tag=>["VIP","需要跟进"].includes(tag))).sort((a,b)=>b.importance-a.importance).slice(0,3);
  const recent=records[0];
  return <button className="crm-home-card" onClick={open}>
    <span className="crm-home-icon"><Users/></span>
    <span className="crm-home-copy"><small>直播 · 暖橘</small><b>近期重要客户</b><em>{important.length?`${important.length} 位重点客户等待回顾`:"还没有标记重点客户"}</em></span>
    <span className="crm-home-meta">{recent?<><b>{recent.username}</b><small>{recent.date} · {recent.giftName}</small></>:<small>新增第一位常用用户</small>}</span>
    <ChevronRight/>
  </button>
}

export function GiftAssistant(){
  const contacts=useLiveQuery(()=>db.contacts.toArray(),[])||[];
  const queriedRecords=useLiveQuery(()=>db.giftRecords.orderBy("date").reverse().toArray(),[]);
  const records=useMemo(()=>queriedRecords||[],[queriedRecords]);
  const [query,setQuery]=useState("");
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const [showRecord,setShowRecord]=useState(false);
  const [showContact,setShowContact]=useState(false);
  const [editingContact,setEditingContact]=useState<Contact|null>(null);
  const [record,setRecord]=useState(emptyRecord);
  const [contactForm,setContactForm]=useState(emptyContact);
  const [customTag,setCustomTag]=useState("");
  const [customTrait,setCustomTrait]=useState("");
  const [notice,setNotice]=useState("");
  const commonGifts=useMemo(()=>[...new Set(records.map(item=>item.giftName).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"zh-CN")),[records]);
  const normalized=query.trim().toLowerCase();
  const shownContacts=contacts.filter(contact=>[contact.username,contact.country,contact.profession||"",...(contact.interests||[]),...(contact.traits||[]),...contact.tags,contact.notes].join(" ").toLowerCase().includes(normalized)).sort((a,b)=>b.importance-a.importance||a.username.localeCompare(b.username,"zh-CN"));
  const selected=contacts.find(contact=>contact.id===selectedId) || shownContacts[0];
  const history=selected?records.filter(row=>row.username===selected.username&&(row.platform===selected.platform||!selected.platform)).sort((a,b)=>`${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)):[];
  const selectedTotal=history.reduce((sum,row)=>sum+recordTotal(row),0);
  const selectedCount=history.reduce((sum,row)=>sum+row.quantity,0);

  const openNewContact=()=>{setEditingContact(null);setContactForm(emptyContact());setShowContact(true)};
  const openEditContact=(contact:Contact)=>{setEditingContact(contact);setContactForm({username:contact.username,platform:contact.platform||"B站",country:contact.country||"",age:contact.age?String(contact.age):"",profession:contact.profession||"",interests:Array.isArray(contact.interests)?contact.interests:splitTags(String(contact.interests||"")),traits:contact.traits||[],notes:contact.notes||"",tags:contact.tags||[],importance:contact.importance||3});setShowContact(true)};
  const saveContact=async()=>{if(!contactForm.username.trim()){setNotice("请输入用户名称");return}const value={username:contactForm.username.trim(),platform:contactForm.platform,country:contactForm.country.trim(),age:contactForm.age?Number(contactForm.age):undefined,profession:contactForm.profession.trim(),interests:contactForm.interests,traits:contactForm.traits,notes:contactForm.notes.trim(),tags:contactForm.tags,importance:contactForm.importance,birthday:editingContact?.birthday||"",chats:editingContact?.chats||""};if(editingContact){await db.contacts.update(editingContact.id,value);setSelectedId(editingContact.id)}else{const id=uid();await db.contacts.add({...value,id,createdAt:new Date().toISOString()});setSelectedId(id)}setShowContact(false);setNotice("客户资料已保存")};
  const saveRecord=async()=>{const contact=contacts.find(item=>item.username===record.username&&(!record.platform||item.platform===record.platform));if(!contact){setNotice("请从常用用户中搜索并选择");return}if(!record.giftName.trim()){setNotice("请选择或输入礼物");return}const stamp=new Date().toISOString();await db.giftRecords.add({id:uid(),date:record.date,time:record.time,platform:record.platform,room:"",username:contact.username,giftName:record.giftName.trim(),quantity:Math.max(1,record.quantity),unitValue:Math.max(0,record.amount)/Math.max(1,record.quantity),notes:record.notes.trim(),tags:contact.tags,source:"manual",createdAt:stamp,updatedAt:stamp});setSelectedId(contact.id);setRecord(emptyRecord());setShowRecord(false);setNotice("直播记录已保存，礼物已加入常用列表")};
  const deleteContact=async(contact:Contact)=>{await db.contacts.delete(contact.id);if(selectedId===contact.id)setSelectedId(null);setNotice("客户资料已删除，历史直播记录仍保留")};

  return <div className="live-crm-page">
    <section className="live-crm-hero">
      <div><small>LIVE CUSTOMER CRM</small><h2>直播客户管理</h2><p>直播结束后，用 30 秒记住重要的人与互动。</p></div>
      <div><Button variant="outline" onClick={openNewContact}><UserRound/>新增用户</Button><Button onClick={()=>setShowRecord(true)}><Plus/>新增记录</Button></div>
    </section>
    {notice&&<p className="live-crm-notice" role="status">{notice}</p>}
    <section className="live-crm-toolbar">
      <label><Search/><Input value={query} onChange={event=>setQuery(event.target.value)} placeholder="搜索用户、标签、兴趣、所在地……"/></label>
      <span>{contacts.length} 位常用用户</span><span>{records.length} 条互动记录</span>
    </section>
    <div className="live-crm-layout">
      <section className="live-crm-list">
        <header><div><b>常用用户</b><small>按重要程度优先显示</small></div><button onClick={openNewContact}><Plus/>添加</button></header>
        <div>{shownContacts.length?shownContacts.map(contact=>{
          const contactRows=records.filter(row=>row.username===contact.username&&(row.platform===contact.platform||!contact.platform));
          const latest=contactRows.sort((a,b)=>`${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))[0];
          return <button key={contact.id} className={selected?.id===contact.id?"active":""} onClick={()=>setSelectedId(contact.id)}><span className="live-crm-avatar">{contact.username.slice(0,1)}</span><span><b>{contact.username}</b><small>{contact.platform}{latest?` · 最近 ${latest.date}`:" · 尚无记录"}</small></span><em>{"★".repeat(contact.importance)}</em><ChevronRight/></button>
        }):<p className="live-crm-empty">还没有常用用户，先添加第一位客户。</p>}</div>
      </section>
      <section className="live-crm-detail">
        {selected?<>
          <header><div className="live-crm-person"><span className="live-crm-avatar large">{selected.username.slice(0,1)}</span><div><small>{selected.platform||"未设置平台"}</small><h3>{selected.username}</h3><p>{[selected.country,selected.profession].filter(Boolean).join(" · ")||"等待补充客户资料"}</p></div></div><div className="live-crm-actions"><button onClick={()=>openEditContact(selected)}><Pencil/>编辑</button><button className="danger" onClick={()=>deleteContact(selected)}><Trash2/>删除</button></div></header>
          <div className="live-crm-stats"><article><Gift/><span><b>{selectedCount}</b><small>累计礼物数量</small></span></article><article><span className="currency">¥</span><span><b>{money(selectedTotal)}</b><small>累计金额</small></span></article><article><Clock3/><span><b>{history.length}</b><small>互动记录</small></span></article><article><Star/><span><b>{selected.importance} 星</b><small>重要程度</small></span></article></div>
          <div className="live-crm-tags"><div><b>客户标签</b><span>{selected.tags.length?selected.tags.map(tag=><i key={tag}>{tag}</i>):<small>暂无标签</small>}</span></div><div><b>客户特征</b><span>{(selected.traits||[]).length?selected.traits?.map(tag=><i className="trait" key={tag}>{tag}</i>):<small>暂无特征</small>}</span></div><div><b>兴趣</b><span>{(Array.isArray(selected.interests)?selected.interests:splitTags(String(selected.interests||""))).map(tag=><i className="interest" key={tag}>{tag}</i>)}</span></div></div>
          {selected.notes&&<p className="live-crm-note"><b>备注</b>{selected.notes}</p>}
          <div className="live-crm-history"><header><div><b>全部互动记录</b><small>送过的礼物、次数与金额</small></div><Button size="sm" onClick={()=>{setRecord({...emptyRecord(),platform:selected.platform||"B站",username:selected.username});setShowRecord(true)}}><Plus/>为此用户记录</Button></header>{history.length?history.map(row=><article key={row.id}><span className="history-date"><b>{row.date.slice(5)}</b><small>{row.time}</small></span><span><b>{row.giftName} × {row.quantity}</b><small>{row.notes||`${row.platform} 直播互动`}</small></span><strong>{money(recordTotal(row))}</strong><button aria-label="删除记录" onClick={()=>db.giftRecords.delete(row.id)}><Trash2/></button></article>):<p className="live-crm-empty">这位用户还没有直播记录。</p>}</div>
        </>:<div className="live-crm-placeholder"><Users/><h3>选择一位常用用户</h3><p>这里会显示礼物历史、累计金额、标签与客户特征。</p></div>}
      </section>
    </div>
    {showRecord&&<div className="live-crm-modal-backdrop" onClick={()=>setShowRecord(false)}><section className="live-crm-modal" onClick={event=>event.stopPropagation()}><header><div><small>30 秒快速记录</small><h3>新增直播记录</h3></div><button onClick={()=>setShowRecord(false)}>×</button></header><div className="live-crm-form-grid"><label>日期<Input type="date" value={record.date} onChange={event=>setRecord({...record,date:event.target.value})}/></label><label>平台<select value={record.platform} onChange={event=>setRecord({...record,platform:event.target.value,username:""})}>{platforms.map(item=><option key={item}>{item}</option>)}</select></label><label className="wide">用户<Input list="common-users" value={record.username} onChange={event=>setRecord({...record,username:event.target.value})} placeholder="输入名称搜索常用用户"/><datalist id="common-users">{contacts.filter(item=>!record.platform||item.platform===record.platform).map(item=><option value={item.username} key={item.id}/>)}</datalist></label><label className="wide">礼物<Input list="common-gifts" value={record.giftName} onChange={event=>setRecord({...record,giftName:event.target.value})} placeholder="输入新礼物或搜索常用礼物"/><datalist id="common-gifts">{commonGifts.map(item=><option value={item} key={item}/>)}</datalist></label><label>数量<Input type="number" min="1" value={record.quantity} onChange={event=>setRecord({...record,quantity:Number(event.target.value)})}/></label><label>总金额<Input type="number" min="0" step="0.01" value={record.amount} onChange={event=>setRecord({...record,amount:Number(event.target.value)})}/></label><label className="wide">备注<Textarea value={record.notes} onChange={event=>setRecord({...record,notes:event.target.value})} placeholder="这次聊了什么、下次要记得什么……"/></label></div><footer><Button variant="outline" onClick={()=>setShowRecord(false)}>取消</Button><Button onClick={saveRecord}>保存记录</Button></footer></section></div>}
    {showContact&&<div className="live-crm-modal-backdrop" onClick={()=>setShowContact(false)}><section className="live-crm-modal contact-modal" onClick={event=>event.stopPropagation()}><header><div><small>永久保存为常用用户</small><h3>{editingContact?"编辑客户资料":"新增常用用户"}</h3></div><button onClick={()=>setShowContact(false)}>×</button></header><div className="live-crm-form-grid"><label>用户名称<Input value={contactForm.username} onChange={event=>setContactForm({...contactForm,username:event.target.value})}/></label><label>平台<select value={contactForm.platform} onChange={event=>setContactForm({...contactForm,platform:event.target.value})}>{platforms.map(item=><option key={item}>{item}</option>)}</select></label><label>所在地<Input value={contactForm.country} onChange={event=>setContactForm({...contactForm,country:event.target.value})}/></label><label>年龄（可选）<Input type="number" min="1" value={contactForm.age} onChange={event=>setContactForm({...contactForm,age:event.target.value})}/></label><label>职业（可选）<Input value={contactForm.profession} onChange={event=>setContactForm({...contactForm,profession:event.target.value})}/></label><label>重要程度<select value={contactForm.importance} onChange={event=>setContactForm({...contactForm,importance:Number(event.target.value)})}>{[1,2,3,4,5].map(item=><option value={item} key={item}>{"★".repeat(item)} {item} 星</option>)}</select></label><div className="wide live-crm-chip-field"><b>客户标签</b><span>{defaultTags.map(tag=><button className={contactForm.tags.includes(tag)?"active":""} onClick={()=>setContactForm({...contactForm,tags:toggle(contactForm.tags,tag)})} key={tag}>{tag}</button>)}</span><label><Input value={customTag} onChange={event=>setCustomTag(event.target.value)} placeholder="自定义标签"/><button onClick={()=>{if(customTag.trim())setContactForm({...contactForm,tags:[...new Set([...contactForm.tags,customTag.trim()])]});setCustomTag("")}}>添加</button></label></div><div className="wide live-crm-chip-field"><b>性格特征</b><span>{defaultTraits.map(tag=><button className={contactForm.traits.includes(tag)?"active":""} onClick={()=>setContactForm({...contactForm,traits:toggle(contactForm.traits,tag)})} key={tag}>{tag}</button>)}</span><label><Input value={customTrait} onChange={event=>setCustomTrait(event.target.value)} placeholder="自定义特征"/><button onClick={()=>{if(customTrait.trim())setContactForm({...contactForm,traits:[...new Set([...contactForm.traits,customTrait.trim()])]});setCustomTrait("")}}>添加</button></label></div><label className="wide">兴趣（逗号分隔）<Input value={contactForm.interests.join("，")} onChange={event=>setContactForm({...contactForm,interests:splitTags(event.target.value)})}/></label><label className="wide">备注<Textarea value={contactForm.notes} onChange={event=>setContactForm({...contactForm,notes:event.target.value})}/></label></div><footer><Button variant="outline" onClick={()=>setShowContact(false)}>取消</Button><Button onClick={saveContact}>保存客户</Button></footer></section></div>}
  </div>
}
