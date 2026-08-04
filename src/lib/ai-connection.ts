import { db } from "./db";
import type { AiConnection, AiProviderId, AiToolMode, CefrLevel, EnglishPrompt } from "./types";

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

const replySystem="你是一位直播高情商话术专家。使用者输入的是直播情境。请直接输出可以在直播间立即使用的内容。不要任何解释，不要分析，不要前言，不要结尾。严禁出现‘作为AI’、‘作为直播助手’、‘以下提供’、‘我建议’。一次只输出①高情商版、②幽默版、③高互动版。每条20～40个中文字，可直接复制。";
const promptFor=(mode:AiToolMode,input:string,style="高情商",previous="")=>mode==="reply"?`直播情境：${input}\n风格偏好：${style}\n生成批次：${crypto.randomUUID()}\n${previous?`上一次内容如下，三条都必须换一种说法，不得复用句式或关键词：\n${previous}\n`:""}严格按以下格式输出，不得添加其他内容：\n① 高情商版\n……\n\n② 幽默版\n……\n\n③ 高互动版\n……`:mode==="review"?`分析以下直播记录：${input}\n请用清晰小标题给出做得好的地方、需要改善、可替换说法、提高互动率、提高停留率和最终复盘结论。不要自我介绍，不要写无意义前言。`:`直播情境：${input}\n直接给出最佳回复、第二种回复、高情商版、幽默版、带货版、引导成交版，并在每条后用一句短句说明有效原因。不要自我介绍或写前言。`;
const systemFor=(mode:AiToolMode)=>mode==="reply"?replySystem:mode==="review"?"你是专业直播运营复盘顾问。直接进行具体复盘，不要自我介绍或空泛客套。":"你是专业直播话术教练。输出实战话术与简短理由，不要自我介绍或空泛客套。";
const cleanReply=(text:string)=>text.split("\n").filter(line=>!/^\s*(作为(?:AI|直播助手)|以下提供|我建议)/.test(line)).join("\n").trim();
export const buildLiveReplyPrompt=(input:string,style="高情商",previous="")=>({system:replySystem,prompt:promptFor("reply",input,style,previous)});
export const sanitizeLiveReply=cleanReply;
export async function generateWithConnectedAi(mode:AiToolMode,input:string,style?:string,previous=""){const connection=await db.aiConnections.get("active"),apiKey=await readSavedKey();if(!connection||!apiKey)throw new Error("尚未接入 AI，请先到设置 → AI 中心完成连接");const output=await callProvider(connection,apiKey,promptFor(mode,input,style,previous),800,systemFor(mode),.95);return {output:mode==="reply"?cleanReply(output):output,provider:connection.provider}}

type GeneratedEnglish={words:EnglishPrompt[];sentences:EnglishPrompt[];shadowing:EnglishPrompt;speaking:EnglishPrompt;listening:EnglishPrompt};
const cleanJson=(value:string)=>{const cleaned=value.replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/i,"").trim(),start=cleaned.indexOf("{"),end=cleaned.lastIndexOf("}");return start>=0&&end>start?cleaned.slice(start,end+1):cleaned};
function validateEnglish(value:unknown):GeneratedEnglish{const x=value as GeneratedEnglish;if(!x||!Array.isArray(x.words)||x.words.length!==5||!Array.isArray(x.sentences)||x.sentences.length!==3||!x.shadowing||!x.speaking||!x.listening)throw new Error("AI 返回的英语内容格式不完整，请重新生成");for(const word of x.words)if(!word.text||!word.phonetic||!word.translation||!word.example||!word.exampleTranslation)throw new Error("AI 返回的单词资料不完整，请重新生成");return x}
export async function generateEnglishWithConnectedAi(level:CefrLevel,date:string){const connection=await db.aiConnections.get("active"),apiKey=await readSavedKey();if(!connection||!apiKey)throw new Error("请先到设置 → AI 中心连接 AI，再生成今日英语");const prompt=`为 ${level} 程度学习者生成 ${date} 的每日英语内容，避免陈词滥调并确保自然、实用、难度适合。结构必须是：{"words":[5个{"text":"英文单词","phonetic":"IPA音标","translation":"简体中文","example":"英文例句","exampleTranslation":"例句中文"}],"sentences":[3个{"text":"英文短句","translation":"简体中文"}],"shadowing":{"text":"一段40至70词英文跟读","translation":"简体中文"},"speaking":{"text":"一个英文口语情境或问题","translation":"简体中文提示"},"listening":{"text":"一段50至90词英文听力材料","translation":"简体中文"}}`;const system="你是专业英语课程设计师。只输出合法 JSON，不要 Markdown、前言或解释。必须严格满足字段与数量要求。";let output=await callProvider(connection,apiKey,prompt,2000,system,.65,true);try{return {content:validateEnglish(JSON.parse(cleanJson(output))),provider:connection.provider}}catch{output=await callProvider(connection,apiKey,`${prompt}\n上一次输出格式错误。请重新输出完整合法 JSON，严格检查5个单词、3个短句和其余三个项目。`,2000,system,.55,true);try{return {content:validateEnglish(JSON.parse(cleanJson(output))),provider:connection.provider}}catch(error){throw new Error(error instanceof Error?error.message:"AI 返回格式无法读取，请重新生成")}}}

export class MockAiProvider{async test(){return "AI 已连接"}async generate(mode:AiToolMode,input:string){return `[Mock ${mode}] ${input}`}}
