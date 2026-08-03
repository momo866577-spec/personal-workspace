"use client";
import { useEffect } from "react";

export function LanguageBridge(){
  useEffect(()=>{document.documentElement.lang="zh-CN"},[]);
  return null;
}
