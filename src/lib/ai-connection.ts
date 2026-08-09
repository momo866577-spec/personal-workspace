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

export const formatAiProviderError=(status:number,detail="")=>{
 const normalized=detail.toLowerCase();
 if(status===429||/quota|rate.?limit|too many requests/.test(normalized)){
  const seconds=detail.match(/retry in\s+([\d.]+)s/i)?.[1];
  return seconds
   ? `AI 请求次数已达上限，请约 ${Math.ceil(Number(seconds))} 秒后再试；若持续出现，请到设置 → AI 中心更换模型或服务商。`
   : "AI 请求次数或免费额度已达上限，请稍后再试；若持续出现，请到设置 → AI 中心更换模型或服务商。";
 }
 if(/insufficient balance|insufficient quota|billing|credit/.test(normalized))return "AI 账户余额或额度不足，请到服务商后台检查额度，或在设置 → AI 中心更换服务商。";
 if(status===401||status===403||/invalid.*(?:key|token)|unauthorized|forbidden/.test(normalized))return "AI API Key 无效或没有此模型权限，请到设置 → AI 中心重新测试连接。";
 if(status>=500)return "AI 服务商暂时不可用，请稍后再试。";
 return detail&&/[^\x00-\x7F]/.test(detail)?detail:`AI 请求失败（HTTP ${status}），请稍后再试或到设置 → AI 中心检查连接。`;
};
const errorMessage=async(response:Response)=>{let detail="";try{const body=await response.json() as {error?:{message?:string}|string;message?:string};detail=typeof body.error==="string"?body.error:body.error?.message||body.message||""}catch{}return formatAiProviderError(response.status,detail)};
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

const replySystem="你是直播话术生成器。仅用简体中文输出3条回复，每条20～40字，紧扣情境与指定风格，三条角度不同。禁止解释、前后言、小标题和自我介绍。";
export const liveReplyStyles=["亲切","幽默","谢榜","高情商","高价值","宠粉","留人","夸夸句"] as const;
const replyStyleRule=(style:string)=>style==="谢榜"
 ? "适合当场谢榜；点名感谢昵称、名次或礼物"
 :style==="夸夸句"
  ? "具体夸赞人或行为，有细节、不尴尬"
  :`${style}语气`;
const compactPromptText=(value:string,maxLength:number)=>value.replace(/\s+/g," ").trim().slice(0,maxLength);
const promptFor=(mode:AiToolMode,input:string,style="高情商",previous="")=>mode==="reply"?`情境：${compactPromptText(input,400)}\n风格：${style}；${replyStyleRule(style)}\n${previous?`避开旧句：${compactPromptText(extractLiveReplies(previous).join("｜"),240)}\n`:""}格式仅限：\n回答1：…\n回答2：…\n回答3：…`:mode==="review"?`分析以下直播记录：${input}\n请用清晰小标题给出做得好的地方、需要改善、可替换说法、提高互动率、提高停留率和最终复盘结论。不要自我介绍，不要写无意义前言。`:`直播情境：${input}\n直接给出最佳回复、第二种回复、高情商版、幽默版、带货版、引导成交版，并在每条后用一句短句说明有效原因。不要自我介绍或写前言。`;
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
  .map(line=>line.replace(/^(?:回答|答案|回复)\s*[：:]\s*/,"").replace(/^(?:回答|答案|回复)?\s*[①②③1-3一二三]\s*[：:、.)）-]?\s*/,"").trim())
  .filter(line=>line&&!/^(高情商版|幽默版|高互动版|亲切版|互动版)\s*[：:]?$/.test(line))
  .filter((line,index,all)=>all.indexOf(line)===index);
};
export const liveRepliesAreFresh=(text:string,previous="")=>{
 const replies=extractLiveReplies(text),oldReplies=extractLiveReplies(previous);
 return replies.length===3&&replies.every(reply=>!oldReplies.includes(reply));
};
const cleanReply=(text:string)=>extractLiveReplies(text).slice(0,3).map((reply,index)=>`回答${index+1}：${reply}`).join("\n");
export const buildLiveReplyPrompt=(input:string,style="高情商",previous="")=>({system:replySystem,prompt:promptFor("reply",input,style,previous)});
export const sanitizeLiveReply=cleanReply;
export async function generateWithConnectedAi(mode:AiToolMode,input:string,style="高情商",previous=""){
 const connection=await db.aiConnections.get("active"),apiKey=await readSavedKey();
 if(!connection||!apiKey)throw new Error("尚未接入 AI，请先到设置 → AI 中心完成连接");
 const output=await callProvider(connection,apiKey,promptFor(mode,input,style,previous),mode==="reply"?240:800,systemFor(mode),.95);
 if(mode==="reply"&&!liveRepliesAreFresh(output,previous))throw new Error("AI 本次没有返回三条新的有效回复，请稍后点击重新生成。");
 return {output:mode==="reply"?cleanReply(output):output,provider:connection.provider};
}

export class MockAiProvider{async test(){return "AI 已连接"}async generate(mode:AiToolMode,input:string){return `[Mock ${mode}] ${input}`}}
