"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { createPortal } from "react-dom";
import type { LucideIcon } from "lucide-react";
import { Download, Menu, Share, Sparkles, X } from "lucide-react";
import type { WorkspaceTheme } from "./workspace-theme-provider";

export type PackPage = "dashboard"|"tasks"|"english"|"workouts"|"notes"|"streams"|"contacts"|"settings";
export type PackNavItem = { id:PackPage; label:string; icon:LucideIcon };
type Props = { page:PackPage; title:string; nav:PackNavItem[]; go:(page:PackPage)=>void; children:ReactNode; theme:WorkspaceTheme };

type InstallPromptEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:"accepted"|"dismissed"}>};
function InstallAppButton(){
  const [prompt,setPrompt]=useState<InstallPromptEvent|null>(null);
  const [help,setHelp]=useState(false);
  const [installed,setInstalled]=useState(()=>typeof window!=="undefined"&&(window.matchMedia("(display-mode: standalone)").matches||Boolean((navigator as Navigator&{standalone?:boolean}).standalone)));
  useEffect(()=>{
    const ready=(event:Event)=>{event.preventDefault();setPrompt(event as InstallPromptEvent)};
    const done=()=>setInstalled(true);
    window.addEventListener("beforeinstallprompt",ready);window.addEventListener("appinstalled",done);
    return()=>{window.removeEventListener("beforeinstallprompt",ready);window.removeEventListener("appinstalled",done)};
  },[]);
  const install=async()=>{if(prompt){await prompt.prompt();const result=await prompt.userChoice;if(result.outcome==="accepted")setInstalled(true);setPrompt(null)}else setHelp(true)};
  const dialog=help&&typeof document!=="undefined"?createPortal(<div className="install-help-backdrop" onClick={()=>setHelp(false)}><motion.section initial={{scale:.92,opacity:0}} animate={{scale:1,opacity:1}} onClick={e=>e.stopPropagation()} className="install-help"><button className="install-close" onClick={()=>setHelp(false)} aria-label="关闭"><X/></button><span className="install-symbol"><Share/></span><h3>加入 iPhone 主画面</h3><ol><li>请先使用 Safari 开启工作台。</li><li>点击 Safari 下方的「分享」按钮。</li><li>向下找到「加入主画面」。</li><li>确认名称后点击「加入」。</li></ol><a href="https://personal-workspace-dvc.pages.dev">使用 Safari 开启</a><small>如果目前是从分享页或 App 内浏览器开启，请先选择「在 Safari 中开启」。</small></motion.section></div>,document.body):null;
  return <><button className="companion-install" onClick={install} disabled={installed}><Download/><span>{installed?"已安装到桌面":"安装桌面 App"}</span></button>{dialog}</>;
}

function Companion({kind,active}:{kind:"rabbit"|"fox";active:boolean}){
  return <motion.img
    className={`ui-companion ${kind}`}
    src={kind==="rabbit"?"/mascots/pink-rabbit.png":"/mascots/blue-fox.png"}
    alt={kind==="rabbit"?"粉雪兔兔助手":"月光小狐助手"}
    animate={active?{y:[0,-13,0],rotate:[0,-4,4,0],scale:[1,1.06,1]}:{y:[0,-5,0]}}
    transition={{duration:active?1.05:3.2,repeat:Infinity,type:"tween"}}
    draggable={false}
  />;
}

export function CompanionShell({page,title,nav,go,children}:Props){
  const [menu,setMenu]=useState(false);const [reaction,setReaction]=useState(0);
  const navigate=(id:PackPage)=>{setReaction(x=>x+1);go(id);setMenu(false)};
  return <div className="companion-app" onPointerDown={e=>{if((e.target as HTMLElement).closest("button,.glass-card,.task"))setReaction(x=>x+1)}}>
    <aside className={menu?"companion-sidebar open":"companion-sidebar"}>
      <button className="companion-brand" onClick={()=>navigate("dashboard")}><span><Sparkles/></span><b>我的生活工作台</b><small>和两位伙伴一起完成今天</small></button>
      <nav>{nav.map((item,index)=><motion.button whileTap={{scale:.95}} key={item.id} className={page===item.id?"active":""} onClick={()=>navigate(item.id)}><item.icon/><span>{item.label}</span>{index===1&&<i>今日</i>}</motion.button>)}</nav>
      <div className="sidebar-friends"><Companion kind="rabbit" active={reaction%2===0}/><Companion kind="fox" active={reaction%2===1}/></div>
      <InstallAppButton/>
    </aside>
    <button className="mobile-menu-button" onClick={()=>setMenu(true)} aria-label="开启功能列"><Menu/></button>
    <AnimatePresence>{menu&&<motion.button className="sidebar-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setMenu(false)} aria-label="关闭功能列"/>}</AnimatePresence>
    <header className="companion-header"><div><small>PERSONAL WORKSPACE</small><h1>{title}</h1></div><div className="header-buddy"><span>{reaction%2===0?"一起完成一件小事吧！":"做得很好，继续前进！"}</span><Companion kind={reaction%2===0?"rabbit":"fox"} active/></div></header>
    <main className="companion-stage">{children}</main>
  </div>
}

export const BunnyLifeShell=CompanionShell;
export const CatCafeShell=CompanionShell;
export const PeachBubbleShell=CompanionShell;
export const ForestDiaryShell=CompanionShell;
export const LittlePlanetShell=CompanionShell;
export const PetAssistantShell=CompanionShell;
export const packShells:Record<WorkspaceTheme,(props:Props)=>ReactNode>={"bunny-life":CompanionShell,"cat-cafe":CompanionShell,"peach-bubble":CompanionShell,"forest-diary":CompanionShell,"little-planet":CompanionShell,"pet-assistant":CompanionShell};
