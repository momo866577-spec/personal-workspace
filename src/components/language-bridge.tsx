"use client";
import { useEffect } from "react";
import { Converter } from "opencc-js";
const toSimplified=Converter({from:"tw",to:"cn"});
const convertTree=(root:Node)=>{const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node:Node|null;while((node=walker.nextNode())){const parent=node.parentElement;if(parent?.closest("script,style,textarea,[data-no-translate]"))continue;const value=node.nodeValue||"";const next=toSimplified(value);if(next!==value)node.nodeValue=next}if(root instanceof Element){[root,...root.querySelectorAll("[placeholder],[title],[aria-label]")].forEach(el=>["placeholder","title","aria-label"].forEach(attr=>{const value=el.getAttribute(attr);if(value)el.setAttribute(attr,toSimplified(value))}))}};
export function LanguageBridge(){useEffect(()=>{document.documentElement.lang="zh-CN";convertTree(document.body);const observer=new MutationObserver(records=>records.forEach(record=>{record.addedNodes.forEach(convertTree);if(record.type==="characterData")convertTree(record.target)}));observer.observe(document.body,{subtree:true,childList:true,characterData:true});return()=>observer.disconnect()},[]);return null}
