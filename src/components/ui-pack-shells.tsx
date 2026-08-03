"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { createPortal } from "react-dom";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight, ChevronRight, Command, Download, Grid2X2, LayoutGrid,
  Menu, PanelLeft, Search, Share, Sparkles, X,
} from "lucide-react";
import type { WorkspaceTheme } from "./workspace-theme-provider";

export type PackPage = "dashboard"|"tasks"|"english"|"workouts"|"notes"|"streams"|"contacts"|"settings";
export type PackNavItem = { id:PackPage; label:string; icon:LucideIcon };
type Props = { page:PackPage; title:string; nav:PackNavItem[]; go:(page:PackPage)=>void; children:ReactNode; theme:WorkspaceTheme };
type InstallPromptEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:"accepted"|"dismissed"}>};

const dateLabel=()=>new Intl.DateTimeFormat("zh-CN",{month:"numeric",day:"numeric",weekday:"short"}).format(new Date());
const dayLabel=()=>new Intl.DateTimeFormat("zh-CN",{month:"long",day:"numeric"}).format(new Date());

export function InstallAppButton(){
  const [prompt,setPrompt]=useState<InstallPromptEvent|null>(null);const [help,setHelp]=useState(false);
  const [installed,setInstalled]=useState(()=>typeof window!=="undefined"&&(window.matchMedia("(display-mode: standalone)").matches||Boolean((navigator as Navigator&{standalone?:boolean}).standalone)));
  useEffect(()=>{const ready=(event:Event)=>{event.preventDefault();setPrompt(event as InstallPromptEvent)};const done=()=>setInstalled(true);window.addEventListener("beforeinstallprompt",ready);window.addEventListener("appinstalled",done);return()=>{window.removeEventListener("beforeinstallprompt",ready);window.removeEventListener("appinstalled",done)}},[]);
  const install=async()=>{if(prompt){await prompt.prompt();const result=await prompt.userChoice;if(result.outcome==="accepted")setInstalled(true);setPrompt(null)}else setHelp(true)};
  const dialog=help&&typeof document!=="undefined"?createPortal(<div className="install-help-backdrop" onClick={()=>setHelp(false)}><motion.section initial={{scale:.92,opacity:0}} animate={{scale:1,opacity:1}} onClick={e=>e.stopPropagation()} className="install-help"><button className="install-close" onClick={()=>setHelp(false)} aria-label="关闭"><X/></button><span className="install-symbol"><Share/></span><h3>添加到桌面</h3><ol><li>请使用 Safari 打开正式网址。</li><li>点击 Safari 底部的分享按钮。</li><li>选择“添加到主屏幕”。</li><li>确认名称后点击“添加”。</li></ol><a href="https://personal-workspace-dvc.pages.dev">使用 Safari 打开</a></motion.section></div>,document.body):null;
  return <><button className="pack-install" onClick={install} disabled={installed}><Download/><span>{installed?"已经安装到桌面":"安装到桌面 App"}</span></button>{dialog}</>;
}

export function JellyVisionShell({page,title,nav,go,children}:Props){
  const active=nav.find(x=>x.id===page)??nav[0];
  return <div className="v3-shell jelly-product bunny-life">
    <aside className="jelly-dock"><div className="jelly-logo"><Sparkles/></div>{nav.map(item=><motion.button whileTap={{scale:.86}} whileHover={{scale:1.08}} key={item.id} className={page===item.id?"active":""} onClick={()=>go(item.id)} aria-label={item.label}><item.icon/></motion.button>)}</aside>
    <nav className="jelly-context"><small>PERSONAL SPACE</small><h2>{active.label}</h2><div className="jelly-bubbles">{nav.slice(0,5).map((item,index)=><button key={item.id} className={page===item.id?"active":""} onClick={()=>go(item.id)}><span>{String(index+1).padStart(2,"0")}</span>{item.label}<ChevronRight/></button>)}</div><div className="jelly-status"><b>今日节奏</b><span>轻盈 · 专注 · 有序</span></div></nav>
    <section className="jelly-stage"><header><div><small>{dateLabel()}</small><h1>{title}</h1></div><button className="jelly-search" aria-label="搜索"><Search/></button></header><main><AnimatePresence mode="wait"><motion.div key={page} initial={{opacity:0,x:22,scale:.98}} animate={{opacity:1,x:0,scale:1}} exit={{opacity:0,x:-14}} transition={{type:"spring",stiffness:280,damping:26}} className="pack-page">{children}</motion.div></AnimatePresence></main></section>
  </div>;
}

export function AppleCalmShell({page,title,nav,go,children}:Props){
  const active=nav.find(x=>x.id===page)??nav[0];
  return <div className="v3-shell apple-product cat-cafe">
    <aside className="apple-sidebar"><div className="apple-brand"><span><PanelLeft/></span><b>Workspace</b></div><div className="apple-nav-label">收藏</div>{nav.slice(0,4).map(item=><button key={item.id} className={page===item.id?"active":""} onClick={()=>go(item.id)}><item.icon/><span>{item.label}</span></button>)}<div className="apple-nav-label">资料库</div>{nav.slice(4).map(item=><button key={item.id} className={page===item.id?"active":""} onClick={()=>go(item.id)}><item.icon/><span>{item.label}</span></button>)}<p className="apple-foot">数据仅保存在此设备</p></aside>
    <section className="apple-stage"><header><div className="apple-breadcrumb"><span>工作台</span><ChevronRight/><b>{active.label}</b></div><div className="apple-heading"><div><h1>{title}</h1><p>{dayLabel()}，把重要的事放在前面。</p></div><button aria-label="快速操作"><Command/></button></div></header><main><motion.div key={page} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.28,ease:[.2,.8,.2,1]}} className="pack-page">{children}</motion.div></main></section>
  </div>;
}

export function BentoStudioShell({page,title,nav,go,children}:Props){
  const active=nav.find(x=>x.id===page)??nav[0];
  return <div className="v3-shell bento-product peach-bubble">
    <aside className="bento-sidebar"><div className="bento-brand"><LayoutGrid/><span><b>BENTO</b><small>daily studio</small></span></div><nav>{nav.map((item,index)=><motion.button layout whileTap={{scale:.94}} key={item.id} className={`${page===item.id?"active":""} tile-${index%4}`} onClick={()=>go(item.id)}><item.icon/><b>{item.label}</b><small>{index<4?"今日":"工具"}</small></motion.button>)}</nav></aside>
    <section className="bento-stage"><header><span className="bento-number">{String(nav.findIndex(x=>x.id===page)+1).padStart(2,"0")}</span><div><small>MY DAILY COLLECTION</small><h1>{title}</h1></div><span className="bento-active-icon"><active.icon/></span></header><main><AnimatePresence mode="popLayout"><motion.div key={page} initial={{opacity:0,scale:.96,rotateX:2}} animate={{opacity:1,scale:1,rotateX:0}} exit={{opacity:0,scale:.98}} transition={{type:"spring",stiffness:240,damping:24}} className="pack-page">{children}</motion.div></AnimatePresence></main></section>
  </div>;
}

export function FloatingGlassShell({page,title,nav,go,children}:Props){
  const active=nav.find(x=>x.id===page)??nav[0];
  return <div className="v3-shell float-product forest-diary"><div className="float-glow glow-one"/><div className="float-glow glow-two"/>
    <aside className="float-rail"><div className="float-logo"><Sparkles/></div>{nav.map(item=><motion.button whileHover={{x:4}} whileTap={{scale:.9}} key={item.id} className={page===item.id?"active":""} onClick={()=>go(item.id)}><span><item.icon/></span><b>{item.label}</b></motion.button>)}</aside>
    <section className="float-stage"><header><div className="float-title"><span><active.icon/></span><div><small>{dateLabel()}</small><h1>{title}</h1></div></div><div className="float-pills"><button>今日</button><button>本周</button><button aria-label="菜单"><Grid2X2/></button></div></header><main><motion.div key={page} initial={{opacity:0,y:22,filter:"blur(8px)"}} animate={{opacity:1,y:0,filter:"blur(0px)"}} transition={{type:"spring",stiffness:220,damping:24}} className="pack-page">{children}</motion.div></main></section>
  </div>;
}

export function NotebookPagesShell({page,title,nav,go,children}:Props){
  const [open,setOpen]=useState(false);
  const navigate=(id:PackPage)=>{go(id);setOpen(false)};
  return <div className="v3-shell notebook-product little-planet"><button className="notebook-menu" onClick={()=>setOpen(true)} aria-label="打开目录"><Menu/></button>
    <aside className={open?"open":""}><div className="notebook-cover"><b>MY</b><span>NOTEBOOK</span><small>{new Date().getFullYear()}</small></div><nav>{nav.map((item,index)=><button key={item.id} className={page===item.id?"active":""} onClick={()=>navigate(item.id)}><span>{String(index+1).padStart(2,"0")}</span><item.icon/><b>{item.label}</b></button>)}</nav></aside>{open&&<button className="notebook-backdrop" onClick={()=>setOpen(false)} aria-label="关闭目录"/>}
    <section className="notebook-paper"><header><div><small>CHAPTER {String(nav.findIndex(x=>x.id===page)+1).padStart(2,"0")}</small><h1>{title}</h1></div><span className="notebook-date">{dayLabel()}</span></header><div className="notebook-tabs">{nav.slice(0,5).map(item=><button key={item.id} className={page===item.id?"active":""} onClick={()=>go(item.id)}>{item.label}</button>)}</div><main><motion.div key={page} initial={{opacity:0,x:28}} animate={{opacity:1,x:0}} transition={{type:"spring",stiffness:260,damping:28}} className="pack-page">{children}</motion.div></main></section>
  </div>;
}

export function AiWorkspaceShell({page,title,nav,go,children}:Props){
  const active=nav.find(x=>x.id===page)??nav[0];
  return <div className="v3-shell ai-product pet-assistant">
    <aside className="ai-sidebar"><div className="ai-brand"><span><Command/></span><b>Personal OS</b></div><button className="ai-command"><Search/><span>搜索或执行</span><kbd>⌘ K</kbd></button><div className="ai-group"><small>WORKSPACE</small>{nav.slice(0,4).map(item=><button key={item.id} className={page===item.id?"active":""} onClick={()=>go(item.id)}><item.icon/><span>{item.label}</span>{page===item.id&&<i/>}</button>)}</div><div className="ai-group"><small>LIBRARY</small>{nav.slice(4).map(item=><button key={item.id} className={page===item.id?"active":""} onClick={()=>go(item.id)}><item.icon/><span>{item.label}</span>{page===item.id&&<i/>}</button>)}</div><div className="ai-sync"><span/><div><b>本地模式</b><small>全部数据已同步</small></div></div></aside>
    <section className="ai-stage"><header><div><small>PERSONAL WORKSPACE / {active.label.toUpperCase()}</small><h1>{title}</h1></div><button><Sparkles/>快速开始</button></header><div className="ai-context-bar"><span><active.icon/>当前页面</span><button onClick={()=>go("dashboard")}>返回总览 <ArrowRight/></button></div><main><AnimatePresence mode="wait"><motion.div key={page} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.22}} className="pack-page">{children}</motion.div></AnimatePresence></main></section>
  </div>;
}

export const BunnyLifeShell=JellyVisionShell;
export const CatCafeShell=AppleCalmShell;
export const PeachBubbleShell=BentoStudioShell;
export const ForestDiaryShell=FloatingGlassShell;
export const LittlePlanetShell=NotebookPagesShell;
export const PetAssistantShell=AiWorkspaceShell;
export const packShells:Record<WorkspaceTheme,(props:Props)=>ReactNode>={"bunny-life":JellyVisionShell,"cat-cafe":AppleCalmShell,"peach-bubble":BentoStudioShell,"forest-diary":FloatingGlassShell,"little-planet":NotebookPagesShell,"pet-assistant":AiWorkspaceShell};
