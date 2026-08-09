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
export async function callProvider(connection:Pick<AiConnection,"provider"|"model"|"baseUrl">,apiKey:string,prompt:string,maxTokens=800,system?:string,temperature=.75,json=false){
 const base=connection.baseUrl.replace(/\/$/,"");let response:Response;
 try{
  if(connection.provider==="gemini")response=await fetch(`${base}/models/${encodeURIComponent(connection.model)}:generateContent`,{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":apiKey},body:JSON.stringify({systemInstruction:system?{parts:[{text:system}]}:undefined,contents:[{role:"user",parts:[{text:prompt}]}],generationConfig:{maxOutputTokens:maxTokens,temperature,responseMimeType:json?"application/json":undefined}})});
  else if(connection.provider==="claude")response=await fetch(`${base}/messages`,{method:"POST",headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:connection.model,max_tokens:maxTokens,temperature,system,messages:[{role:"user",content:prompt}]})});
  else response=await fetch(`${base}/chat/completions`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${apiKey}`},body:JSON.stringify({model:connection.model,messages:[...(system?[{role:"system",content:system}]:[]),{role:"user",content:prompt}],max_tokens:maxTokens,temperature,...(json&&connection.provider!=="openai-compatible"?{response_format:{type:"json_object"}}:{})})});
 }catch(error){throw new Error(error instanceof TypeError?"网络请求失败：浏览器无法连接 AI 服务商，请检查网络、API 地址或服务商的浏览器访问限制。":error instanceof Error?error.message:"AI 请求失败")}
 if(!response.ok)throw new Error(await errorMessage(response));const data=await response.json() as {choices?:{message?:{content?:string}}[];candidates?:{content?:{parts?:{text?:string}[]}}[];content?:{text?:string}[]};
 const text=data.choices?.[0]?.message?.content||data.candidates?.[0]?.content?.parts?.map(x=>x.text||"").join("")||data.content?.map(x=>x.text||"").join("");if(!text)throw new Error("服务已响应，但没有返回文字内容");return text;
}
export async function testAiConnection(config:Pick<AiConnection,"provider"|"model"|"baseUrl">,apiKey:string){return callProvider(config,apiKey,"你好。请只回复：AI 已连接")}
export async function saveAiConnection(config:Pick<AiConnection,"provider"|"model"|"baseUrl">,apiKey:string){await encryptAndSaveKey(apiKey);const row:AiConnection={id:"active",...config,status:"connected",testedAt:new Date().toISOString()};await db.aiConnections.put(row);return row}

const replySystem="你是一位直播高情商话术专家。使用者输入的是直播情境。请直接输出可以在直播间立即说出口的三条回复。必须恰好三条，不多不少。不要解释，不要分析，不要前言，不要后记，不要小标题。严禁出现‘作为AI’、‘作为直播助手’、‘以下提供’、‘我建议’。严格使用三行格式：回答1：内容、回答2：内容、回答3：内容。每条20～40个中文字，可直接复制。";
export const liveReplyStyles=["亲切","幽默","谢榜","高情商","高价值","宠粉","留人","夸夸句"] as const;
const replyStyleRule=(style:string)=>style==="谢榜"
 ? "根据输入的榜单、昵称、名次或礼物进行感谢；每条都要点出对方的支持与陪伴，适合直播间当场谢榜。"
 :style==="夸夸句"
  ? "围绕输入的观众、昵称、行为或特点进行具体夸赞；自然、有细节、不尴尬，不要只说空泛的‘你好棒’。"
  :`严格使用${style}风格，三条表达角度必须不同。`;
const promptFor=(mode:AiToolMode,input:string,style="高情商",previous="")=>mode==="reply"?`观众留言或对象资料：${input}\n回复风格：${style}\n风格执行规则：${replyStyleRule(style)}\n生成批次：${crypto.randomUUID()}\n${previous?`上一次内容如下，三条都必须换一种说法，不得复用句式或关键词：\n${previous}\n`:""}只输出以下三行，不得添加任何其他文字：\n回答1：可以直接对观众说的话\n回答2：可以直接对观众说的话\n回答3：可以直接对观众说的话`:mode==="review"?`分析以下直播记录：${input}\n请用清晰小标题给出做得好的地方、需要改善、可替换说法、提高互动率、提高停留率和最终复盘结论。不要自我介绍，不要写无意义前言。`:`直播情境：${input}\n直接给出最佳回复、第二种回复、高情商版、幽默版、带货版、引导成交版，并在每条后用一句短句说明有效原因。不要自我介绍或写前言。`;
const systemFor=(mode:AiToolMode)=>mode==="reply"?replySystem:mode==="review"?"你是专业直播运营复盘顾问。直接进行具体复盘，不要自我介绍或空泛客套。":"你是专业直播话术教练。输出实战话术与简短理由，不要自我介绍或空泛客套。";
export const extractLiveReplies=(text:string)=>{
 const withoutFiller=text
  .replace(/```(?:text|markdown)?/gi,"")
  .replace(/\s+(?=(?:(?:回答|答案|回复)\s*)?[①②③]|(?:回答|答案|回复)\s*[1-3]\s*[：:、.)）-])/g,"\n")
  .split("\n")
  .map(line=>line.trim())
  .filter(line=>line&&!/^(作为(?:AI|直播助手)|以下提供|我建议|建议如下|当然可以|没问题)/.test(line))
  .join("\n");
 return withoutFiller
  .split(/\n+/)
  .map(line=>line.replace(/^(?:回答|答案|回复)?\s*[①②③1-3一二三]\s*[：:、.)）-]?\s*/,"").trim())
  .filter(line=>line&&!/^(高情商版|幽默版|高互动版|亲切版|互动版)\s*[：:]?$/.test(line))
  .filter((line,index,all)=>all.indexOf(line)===index);
};
export const liveRepliesAreCompleteAndFresh=(text:string,previous="")=>{
 const replies=extractLiveReplies(text),oldReplies=extractLiveReplies(previous);
 return replies.length===3&&replies.every(reply=>!oldReplies.includes(reply));
};
const cleanReply=(text:string)=>extractLiveReplies(text).slice(0,3).map((reply,index)=>`回答${index+1}：${reply}`).join("\n");
export const buildLiveReplyPrompt=(input:string,style="高情商",previous="")=>({system:replySystem,prompt:promptFor("reply",input,style,previous)});
export const sanitizeLiveReply=cleanReply;
export async function generateWithConnectedAi(mode:AiToolMode,input:string,style="高情商",previous=""){
 const connection=await db.aiConnections.get("active"),apiKey=await readSavedKey();
 if(!connection||!apiKey)throw new Error("尚未接入 AI，请先到设置 → AI 中心完成连接");
 let output=await callProvider(connection,apiKey,promptFor(mode,input,style,previous),800,systemFor(mode),.95);
 if(mode==="reply"&&!liveRepliesAreCompleteAndFresh(output,previous)){
  const failedOutput=output;
  const repairPrompt=`${promptFor(mode,input,style,previous)}\n\n刚才的输出不合格：\n${failedOutput}\n\n请重新生成三条全新的${style}回复。每一条都必须紧扣“${input.trim()}”和${style}风格，三条彼此不同，也不得与上一次内容相同。只输出回答1、回答2、回答3三行。`;
  output=await callProvider(connection,apiKey,repairPrompt,800,systemFor(mode),1);
 }
 if(mode==="reply"&&!liveRepliesAreCompleteAndFresh(output,previous))throw new Error("AI 未按要求返回三条不同且符合主题的回复，请点击重新生成再试一次");
 return {output:mode==="reply"?cleanReply(output):output,provider:connection.provider};
}

export class MockAiProvider{async test(){return "AI 已连接"}async generate(mode:AiToolMode,input:string){return `[Mock ${mode}] ${input}`}}
