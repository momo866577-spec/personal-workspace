"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { createPortal } from "react-dom";
import type { LucideIcon } from "lucide-react";
import { Download, Grid2X2, Menu, Share, Sparkles, X } from "lucide-react";
import type { WorkspaceTheme } from "./workspace-theme-provider";

export type PackPage = "dashboard"|"tasks"|"english"|"workouts"|"notes"|"streams"|"contacts"|"settings";
export type PackNavItem = { id:PackPage; label:string; icon:LucideIcon };
type Props = { page:PackPage; title:string; nav:PackNavItem[]; go:(page:PackPage)=>void; children:ReactNode; theme:WorkspaceTheme };
type InstallPromptEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:"accepted"|"dismissed"}>};

export function InstallAppButton(){
  const [prompt,setPrompt]=useState<InstallPromptEvent|null>(null);const [help,setHelp]=useState(false);
  const [installed,setInstalled]=useState(()=>typeof window!=="undefined"&&(window.matchMedia("(display-mode: standalone)").matches||Boolean((navigator as Navigator&{standalone?:boolean}).standalone)));
  useEffect(()=>{const ready=(event:Event)=>{event.preventDefault();setPrompt(event as InstallPromptEvent)};const done=()=>setInstalled(true);window.addEventListener("beforeinstallprompt",ready);window.addEventListener("appinstalled",done);return()=>{window.removeEventListener("beforeinstallprompt",ready);window.removeEventListener("appinstalled",done)}},[]);
  const install=async()=>{if(prompt){await prompt.prompt();const result=await prompt.userChoice;if(result.outcome==="accepted")setInstalled(true);setPrompt(null)}else setHelp(true)};
  const dialog=help&&typeof document!=="undefined"?createPortal(<div className="install-help-backdrop" onClick={()=>setHelp(false)}><motion.section initial={{scale:.92,opacity:0}} animate={{scale:1,opacity:1}} onClick={e=>e.stopPropagation()} className="install-help"><button className="install-close" onClick={()=>setHelp(false)} aria-label="关闭"><X/></button><span className="install-symbol"><Share/></span><h3>添加到手机桌面</h3><ol><li>请使用 Safari 打开工作台。</li><li>点击 Safari 的“分享”按钮。</li><li>选择“添加到主屏幕”。</li><li>确认名称后点击“添加”。</li></ol><a href="https://personal-workspace-dvc.pages.dev">使用 Safari 打开</a></motion.section></div>,document.body):null;
  return <><button className="pack-install" onClick={install} disabled={installed}><Download/><span>{installed?"已安装到桌面":"安装桌面 App"}</span></button>{dialog}</>;
}

function Nav({items,page,go,compact=false}:{items:PackNavItem[];page:PackPage;go:(page:PackPage)=>void;compact?:boolean}){return <nav className={compact?"pack-nav compact":"pack-nav"}>{items.map(item=><motion.button whileTap={{scale:.92}} key={item.id} className={page===item.id?"active":""} onClick={()=>go(item.id)} aria-label={item.label}><span className="pack-nav-icon"><item.icon/></span><small>{item.label}</small></motion.button>)}</nav>}
function PageMotion({page,children}:{page:PackPage;children:ReactNode}){return <AnimatePresence mode="wait"><motion.div key={page} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{type:"spring",stiffness:300,damping:28}}>{children}</motion.div></AnimatePresence>}
function DateChip(){return <span className="pack-date">{new Intl.DateTimeFormat("zh-CN",{month:"numeric",day:"numeric",weekday:"short"}).format(new Date())}</span>}

function RailShell({page,title,nav,go,children,theme}:Props){const active=nav.find(x=>x.id===page)??nav[0];return <div className={`pack-shell rail-shell ${theme}`}><aside><div className="pack-mark"><Grid2X2/><span>工作台</span></div><Nav items={nav} page={page} go={go}/></aside><section className="pack-canvas"><header><span className="title-icon"><active.icon/></span><div><h1>{title}</h1><p>把今天安排得轻松一点</p></div><DateChip/></header><main><PageMotion page={page}>{children}</PageMotion></main></section></div>}

function CapsuleShell({page,title,nav,go,children,theme}:Props){const active=nav.find(x=>x.id===page)??nav[0];return <div className={`pack-shell capsule-shell ${theme}`}><aside><div className="pack-mark"><Sparkles/><span>日常</span></div><Nav items={nav} page={page} go={go} compact/></aside><section className="pack-canvas"><div className="capsule-top"><div><small>PERSONAL SPACE</small><h1>{title}</h1></div><span className="title-icon"><active.icon/></span></div><div className="capsule-strip"><b>今日进行中</b><DateChip/></div><main><PageMotion page={page}>{children}</PageMotion></main></section></div>}

function SplitShell({page,title,nav,go,children,theme}:Props){const active=nav.find(x=>x.id===page)??nav[0];const primary=nav.slice(0,4),secondary=nav.slice(4);return <div className={`pack-shell split-shell ${theme}`}><aside><div className="pack-mark"><Grid2X2/><span>MY DAY</span></div><Nav items={primary} page={page} go={go}/><i className="nav-divider"/><Nav items={secondary} page={page} go={go}/></aside><section className="pack-canvas"><header><div><small>今天的空间</small><h1>{title}</h1></div><div className="split-badge"><active.icon/><DateChip/></div></header><main><PageMotion page={page}>{children}</PageMotion></main></section></div>}

function RibbonShell({page,title,nav,go,children,theme}:Props){const active=nav.find(x=>x.id===page)??nav[0];return <div className={`pack-shell ribbon-shell ${theme}`}><aside><div className="pack-mark"><Sparkles/><span>小小工作台</span></div><Nav items={nav} page={page} go={go}/></aside><section className="pack-canvas"><header><div className="ribbon-title"><span className="title-icon"><active.icon/></span><div><h1>{title}</h1><p>记录每一点小进步</p></div></div><DateChip/></header><main><PageMotion page={page}>{children}</PageMotion></main></section></div>}

function PetalShell({page,title,nav,go,children,theme}:Props){const [open,setOpen]=useState(false);const active=nav.find(x=>x.id===page)??nav[0];const navigate=(id:PackPage)=>{go(id);setOpen(false)};return <div className={`pack-shell petal-shell ${theme}`}><button className="petal-menu" onClick={()=>setOpen(true)} aria-label="打开菜单"><Menu/></button><aside className={open?"open":""}><div className="pack-mark"><Grid2X2/><span>MY SPACE</span></div><Nav items={nav} page={page} go={navigate}/></aside>{open&&<button className="pack-backdrop" onClick={()=>setOpen(false)} aria-label="关闭菜单"/>}<section className="pack-canvas"><div className="petal-heading"><span><small>DAILY NOTE</small><h1>{title}</h1></span><span className="title-icon"><active.icon/></span></div><main><PageMotion page={page}>{children}</PageMotion></main></section></div>}

function CandyShell({page,title,nav,go,children,theme}:Props){const active=nav.find(x=>x.id===page)??nav[0];return <div className={`pack-shell candy-shell ${theme}`}><aside><div className="pack-mark"><Sparkles/><span>SWEET DAY</span></div><Nav items={nav} page={page} go={go} compact/></aside><section className="pack-canvas"><header><div className="candy-orb"><active.icon/></div><div><h1>{title}</h1><p>今天也要好好生活</p></div><DateChip/></header><main><PageMotion page={page}>{children}</PageMotion></main></section></div>}

export const BunnyLifeShell=RibbonShell;
export const CatCafeShell=RailShell;
export const PeachBubbleShell=CandyShell;
export const ForestDiaryShell=SplitShell;
export const LittlePlanetShell=CapsuleShell;
export const PetAssistantShell=PetalShell;
export const packShells:Record<WorkspaceTheme,(props:Props)=>ReactNode>={"bunny-life":RibbonShell,"cat-cafe":RailShell,"peach-bubble":CandyShell,"forest-diary":SplitShell,"little-planet":CapsuleShell,"pet-assistant":PetalShell};
