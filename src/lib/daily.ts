import { db } from "./db";
import { completedCurriculumDates, lessonForLevelGroup, NGSL_VERSION, selectableLevels } from "./ngsl-curriculum";
import { today, type CefrLevel, type EnglishDailyItem, type EnglishDailyItemKind, type EnglishPrompt, type Task, type WorkoutCheckin } from "./types";

export const ENGLISH_LEVEL_KEY="workspace-english-level";
export function preferredEnglishLevel():CefrLevel{if(typeof window==="undefined")return "B1";const saved=window.localStorage.getItem(ENGLISH_LEVEL_KEY) as CefrLevel|null;return saved&&selectableLevels.includes(saved)?saved:"B1"}

const describe=(prompts:EnglishPrompt[])=>prompts.map(x=>x.translation?`${x.text}｜${x.translation}`:x.text).join(" · ");
function itemsFor(date:string,lesson:ReturnType<typeof lessonForLevelGroup>){
 const rows:{kind:EnglishDailyItemKind;title:string;detail:string;prompts:EnglishPrompt[]}[]=[
  {kind:"words",title:"今日单词",detail:describe(lesson.words),prompts:lesson.words},
  {kind:"sentences",title:"今日短句",detail:describe(lesson.sentences),prompts:lesson.sentences},
  {kind:"shadowing",title:"今日跟读",detail:`跟读 5 分钟：${describe([lesson.shadowing])}`,prompts:[lesson.shadowing]},
  {kind:"speaking",title:"今日口语",detail:`口语主题：${describe([lesson.speaking])}`,prompts:[lesson.speaking]},
  {kind:"listening",title:"今日听力",detail:`听力 5 分钟：${describe([lesson.listening])}`,prompts:[lesson.listening]},
 ];
 return rows.map(x=>({...x,taskId:`english-daily:${date}:${x.kind}`})) satisfies EnglishDailyItem[];
}

export async function ensureEnglishDailyPlan(date=today(),replace=false,requestedLevel: CefrLevel=preferredEnglishLevel()){
 return db.transaction("rw",db.englishDailyPlans,db.tasks,async()=>{
  const existing=await db.englishDailyPlans.get(date);if(existing&&!replace&&existing.source?.startsWith(NGSL_VERSION)&&existing.level===requestedLevel)return existing;
  const plans=await db.englishDailyPlans.toArray(),allTasks=await db.tasks.toArray(),validDates=new Set(plans.filter(x=>x.source?.startsWith(NGSL_VERSION)&&x.level===requestedLevel).map(x=>x.date));
  const group=completedCurriculumDates(allTasks,validDates).filter(x=>x<date).length,lesson=lessonForLevelGroup(requestedLevel,group);
  const createdAt=new Date().toISOString(),items=itemsFor(date,lesson),count=allTasks.length;
  const currentTasks=await db.tasks.where("due").equals(date).toArray();
  const done=new Map((existing?.source?.startsWith(NGSL_VERSION)&&existing.level===requestedLevel&&!replace?currentTasks:[]).filter(x=>x.id.startsWith(`english-daily:${date}:`)).map(x=>[x.id,x.done]));
  const tasks:Task[]=items.map((x,index)=>({id:x.taskId,title:`英语 · ${x.title}`,due:date,done:done.get(x.taskId)||false,order:count+index,createdAt}));
  await db.tasks.bulkPut(tasks);
  const plan={date,items,createdAt,level:lesson.level,bankVersion:`ngsl-1.2:${lesson.level}:${lesson.start}`,source:`${NGSL_VERSION} · CEFR 固定顺序`};
  await db.englishDailyPlans.put(plan);return plan;
 });
}
export async function toggleEnglishDailyTask(taskId:string,done:boolean){await db.tasks.update(taskId,{done})}
export async function setWorkoutCheckin(date=today(),completed=true){const row:WorkoutCheckin={date,completed,completedAt:new Date().toISOString()};await db.workoutCheckins.put(row);return row}
const day=(s:string)=>new Date(`${s}T00:00:00`);
export function workoutStats(rows:WorkoutCheckin[],anchor=today()){
 const done=new Set(rows.filter(x=>x.completed).map(x=>x.date));let streak=0;const cursor=day(anchor);
 while(done.has(cursor.toLocaleDateString("en-CA"))){streak++;cursor.setDate(cursor.getDate()-1)}
 const now=day(anchor),weekday=(now.getDay()+6)%7,weekStart=new Date(now);weekStart.setDate(now.getDate()-weekday);
 const monthPrefix=anchor.slice(0,7),week=[...done].filter(x=>day(x)>=weekStart&&day(x)<=now).length,month=[...done].filter(x=>x.startsWith(monthPrefix)).length;
 return {todayDone:done.has(anchor),streak,week,month};
}
