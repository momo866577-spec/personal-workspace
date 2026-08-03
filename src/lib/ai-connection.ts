import { db } from "./db";
import type { AiConnection, AiProviderId, AiToolMode } from "./types";

export type ProviderDefinition={id:AiProviderId;name:string;mark:string;color:string;model:string;baseUrl:string;website:string;help:string[];compatible?:boolean};
export const providerCatalog:ProviderDefinition[]=[
 {id:"deepseek",name:"DeepSeek",mark:"DS",color:"#4f6bff",model:"deepseek-v4-flash",baseUrl:"https://api.deepseek.com",website:"https://platform.deepseek.com/api_keys",help:["登录 DeepSeek 开放平台。","进入 API Keys 页面并创建新密钥。","复制密钥后返回这里粘贴。"],compatible:true},
 {id:"doubao",name:"豆包",mark:"豆",color:"#336cff",model:"doubao-seed-2-0-lite-260215",baseUrl:"https://ark.cn-beijing.volces.com/api/v3",website:"https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey",help:["登录火山方舟控制台。","在 API Key 管理中创建密钥。","确认模型已开通后复制密钥。"],compatible:true},
 {id:"openai",name:"OpenAI",mark:"OA",color:"#111827",model:"gpt-4.1-mini",baseUrl:"https://api.openai.com/v1",website:"https://platform.openai.com/api-keys",help:["登录 OpenAI Platform。","打开 API Keys 并创建 Secret Key。","密钥只显示一次，请复制后返回。"],compatible:true},
 {id:"gemini",name:"Gemini",mark:"G",color:"#5b7cfa",model:"gemini-3.5-flash",baseUrl:"https://generativelanguage.googleapis.com/v1beta",website:"https://aistudio.google.com/app/apikey",help:["登录 Google AI Studio。","选择项目并创建 API Key。","复制 Key 后返回测试连接。"]},
 {id:"claude",name:"Claude",mark:"C",color:"#d97757",model:"claude-haiku-4-5",baseUrl:"https://api.anthropic.com/v1",website:"https://console.anthropic.com/settings/keys",help:["登录 Anthropic Console。","在 API Keys 中创建密钥。","复制密钥后返回这里。"]},
 {id:"openai-compatible",name:"OpenAI Compatible",mark:"API",color:"#7c6df2",model:"",baseUrl:"",website:"",help:["向服务商取得 API Base URL、模型名称和 API Key。","Base URL 通常以 /v1 结尾。","确保服务商允许浏览器直接请求。"],compatible:true},
];
export const providerDefinition=(id:AiProviderId)=>providerCatalog.find(x=>x.id===id)!;

const encoder=new TextEncoder(),decoder=new TextDecoder();
export async function encryptAndSaveKey(apiKey:string){
 const key=await crypto.subtle.generateKey({name:"AES-GCM",length:256},false,["encrypt","decrypt"]);const iv=crypto.getRandomValues(new Uint8Array(12));
 const cipher=await crypto.subtle.encrypt({name:"AES-GCM",iv},key,encoder.encode(apiKey));await db.aiSecrets.put({id:"active",key,cipher,iv});
}
export async function readSavedKey(){const secret=await db.aiSecrets.get("active");if(!secret)return null;const plain=await crypto.subtle.decrypt({name:"AES-GCM",iv:secret.iv},secret.key,secret.cipher);return decoder.decode(plain)}
export async function deleteAiConnection(){await db.transaction("rw",db.aiConnections,db.aiSecrets,async()=>{await db.aiConnections.delete("active");await db.aiSecrets.delete("active")})}

const errorMessage=async(response:Response)=>{let detail="";try{const body=await response.json() as {error?:{message?:string}|string;message?:string};detail=typeof body.error==="string"?body.error:body.error?.message||body.message||""}catch{}return detail||`HTTP ${response.status}`};
export async function callProvider(connection:Pick<AiConnection,"provider"|"model"|"baseUrl">,apiKey:string,prompt:string){
 const base=connection.baseUrl.replace(/\/$/,"");let response:Response;
 if(connection.provider==="gemini")response=await fetch(`${base}/models/${encodeURIComponent(connection.model)}:generateContent`,{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":apiKey},body:JSON.stringify({contents:[{role:"user",parts:[{text:prompt}]}],generationConfig:{maxOutputTokens:800}})});
 else if(connection.provider==="claude")response=await fetch(`${base}/messages`,{method:"POST",headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:connection.model,max_tokens:800,messages:[{role:"user",content:prompt}]})});
 else response=await fetch(`${base}/chat/completions`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${apiKey}`},body:JSON.stringify({model:connection.model,messages:[{role:"user",content:prompt}],max_tokens:800})});
 if(!response.ok)throw new Error(await errorMessage(response));const data=await response.json() as {choices?:{message?:{content?:string}}[];candidates?:{content?:{parts?:{text?:string}[]}}[];content?:{text?:string}[]};
 const text=data.choices?.[0]?.message?.content||data.candidates?.[0]?.content?.parts?.map(x=>x.text||"").join("")||data.content?.map(x=>x.text||"").join("");if(!text)throw new Error("服务已响应，但没有返回文字内容");return text;
}
export async function testAiConnection(config:Pick<AiConnection,"provider"|"model"|"baseUrl">,apiKey:string){return callProvider(config,apiKey,"你好。请只回复：AI 已连接")}
export async function saveAiConnection(config:Pick<AiConnection,"provider"|"model"|"baseUrl">,apiKey:string){await encryptAndSaveKey(apiKey);const row:AiConnection={id:"active",...config,status:"connected",testedAt:new Date().toISOString()};await db.aiConnections.put(row);return row}

const promptFor=(mode:AiToolMode,input:string)=>mode==="reply"?`你是专业直播互动助手。针对观众留言“${input}”，分别给出高情商版、幽默版、亲切版、高互动版、主播风格版。回答自然、具体，不要套话。`:mode==="review"?`你是直播运营复盘顾问。分析以下直播记录：${input}\n请给出做得好的地方、需要改善、可替换说法、提高互动率、提高停留率和最终复盘结论。`:`你是直播话术教练。情境：${input}\n给出最佳回复、第二种回复、高情商版、幽默版、带货版、引导成交版，并解释每种话术有效的原因。`;
export async function generateWithConnectedAi(mode:AiToolMode,input:string){const connection=await db.aiConnections.get("active"),apiKey=await readSavedKey();if(!connection||!apiKey)throw new Error("尚未接入 AI，请先到设置 → AI 中心完成连接");return {output:await callProvider(connection,apiKey,promptFor(mode,input)),provider:connection.provider}}

export class MockAiProvider{async test(){return "AI 已连接"}async generate(mode:AiToolMode,input:string){return `[Mock ${mode}] ${input}`}}
