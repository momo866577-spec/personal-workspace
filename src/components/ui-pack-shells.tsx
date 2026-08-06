"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState, type ReactNode } from "react";
import { Flower2, Heart, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { WorkspaceTheme } from "./workspace-theme-provider";
import { useWorkspaceProfile } from "./workspace-profile";

export type PackPage = "dashboard"|"tasks"|"english"|"workouts"|"nutrition"|"travel"|"periods"|"notes"|"streams"|"gifts"|"settings";
export type PackNavItem = { id:PackPage; label:string; icon:LucideIcon };
type Props = { page:PackPage; title:string; nav:PackNavItem[]; go:(page:PackPage)=>void; children:ReactNode; theme:WorkspaceTheme };
type InstallPromptEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:"accepted"|"dismissed"}>};

export function InstallAppButton(){
  const [prompt,setPrompt]=useState<InstallPromptEvent|null>(null);
  const [installed,setInstalled]=useState(()=>typeof window!=="undefined"&&(window.matchMedia("(display-mode: standalone)").matches||Boolean((navigator as Navigator&{standalone?:boolean}).standalone)));
  useEffect(()=>{const ready=(event:Event)=>{event.preventDefault();setPrompt(event as InstallPromptEvent)};const done=()=>setInstalled(true);window.addEventListener("beforeinstallprompt",ready);window.addEventListener("appinstalled",done);return()=>{window.removeEventListener("beforeinstallprompt",ready);window.removeEventListener("appinstalled",done)}},[]);
  const install=async()=>{if(!prompt){alert("请使用浏览器菜单中的‘安装应用’或‘添加到主屏幕’。");return}await prompt.prompt();const result=await prompt.userChoice;if(result.outcome==="accepted")setInstalled(true);setPrompt(null)};
  return <button className="glass-action" onClick={install} disabled={installed}>{installed?"已安装":"安装到桌面"}</button>;
}

function GlassPinkShell({page,title,nav,go,children}:Props){
  const profile=useWorkspaceProfile();
  return <div className="glass-app" data-theme="glass-pink">
    <aside className="glass-sidebar">
      <div className="brand-profile">
        <div className="brand-gem" aria-hidden="true">
          {profile.avatar?<img src={profile.avatar} alt=""/>:<Heart/>}
        </div>
      </div>
      <nav aria-label="主要功能">{nav.map(({id,label,icon:Icon})=><button key={id} className={page===id?"active":""} aria-current={page===id?"page":undefined} onClick={()=>go(id)}><span><Icon/></span><b>{label}</b></button>)}</nav>
    </aside>
    <div className="glass-workspace">
      <header className="glass-topbar"><div><small className="topbar-date"><Flower2 aria-hidden="true"/>{new Intl.DateTimeFormat("zh-CN",{month:"long",day:"numeric",weekday:"long"}).format(new Date())}</small><h1 className="topbar-title">{page==="dashboard"?(profile.name||"今日工作台"):title}</h1></div><div className="top-actions"><label><Search/><input placeholder="搜索内容、任务、笔记…"/></label></div></header>
      <main>{children}</main>
    </div>
  </div>;
}

export const packShells:Record<WorkspaceTheme,(props:Props)=>ReactNode>={"glass-pink":GlassPinkShell};
