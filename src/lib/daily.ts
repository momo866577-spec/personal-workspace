import { db } from "./db";
import { today, type EnglishDailyItem, type EnglishDailyItemKind, type Task, type WorkoutCheckin } from "./types";

const lessons = [
  {
    words: "focus 专注 · steady 稳定 · improve 改善 · reflect 反思 · achieve 达成",
    sentences: "I will focus on one thing. · Small steps still count. · I am proud of my progress.",
    shadowing: "跟读 5 分钟：Small steps every day can create meaningful change.",
    speaking: "口语主题：分享今天最重要的一件事（1 次）",
    listening: "听力 5 分钟：选择一段日常英语，记录 3 个听到的关键词",
  },
  {
    words: "habit 习惯 · gentle 温和的 · energy 精力 · prepare 准备 · complete 完成",
    sentences: "How are you feeling today? · Let me prepare before I begin. · I completed my plan.",
    shadowing: "跟读 5 分钟：A gentle routine helps me use my energy well.",
    speaking: "口语主题：描述你的晨间习惯（1 次）",
    listening: "听力 5 分钟：选择一段慢速英语，复述其中 1 句话",
  },
  {
    words: "curious 好奇的 · practice 练习 · confident 自信的 · balance 平衡 · notice 注意到",
    sentences: "I learn something new each day. · Could you say that again? · Practice makes me confident.",
    shadowing: "跟读 5 分钟：Stay curious and notice the progress you make.",
    speaking: "口语主题：介绍最近学会的一件事（1 次）",
    listening: "听力 5 分钟：选择一段英语对话，辨认说话者的情绪",
  },
] as const;

function lessonFor(date:string){
  const seed=[...date].reduce((sum,char)=>sum+char.charCodeAt(0),0);
  const lesson=lessons[seed%lessons.length];
  return [
    {kind:"words",title:"今日单词",detail:lesson.words},
    {kind:"sentences",title:"今日短句",detail:lesson.sentences},
    {kind:"shadowing",title:"今日跟读",detail:lesson.shadowing},
    {kind:"speaking",title:"今日口语",detail:lesson.speaking},
    {kind:"listening",title:"今日听力",detail:lesson.listening},
  ] satisfies {kind:EnglishDailyItemKind;title:string;detail:string}[];
}
export async function ensureEnglishDailyPlan(date=today()){
  return db.transaction("rw",db.englishDailyPlans,db.tasks,async()=>{
    const existing=await db.englishDailyPlans.get(date); if(existing)return existing;
    const createdAt=new Date().toISOString(); const count=await db.tasks.count();
    const items:EnglishDailyItem[]=lessonFor(date).map(x=>({...x,taskId:`english-daily:${date}:${x.kind}`}));
    const tasks:Task[]=items.map((x,index)=>({id:x.taskId,title:`英语 · ${x.title}`,due:date,done:false,order:count+index,createdAt}));
    await db.tasks.bulkPut(tasks); const plan={date,items,createdAt}; await db.englishDailyPlans.add(plan); return plan;
  });
}
export async function toggleEnglishDailyTask(taskId:string,done:boolean){await db.tasks.update(taskId,{done})}
export async function setWorkoutCheckin(date=today(),completed=true){const row:WorkoutCheckin={date,completed,completedAt:new Date().toISOString()};await db.workoutCheckins.put(row);return row}
const day=(s:string)=>new Date(`${s}T00:00:00`);
export function workoutStats(rows:WorkoutCheckin[],anchor=today()){
  const done=new Set(rows.filter(x=>x.completed).map(x=>x.date)); let streak=0; const cursor=day(anchor);
  while(done.has(cursor.toLocaleDateString("en-CA"))){streak++;cursor.setDate(cursor.getDate()-1)}
  const now=day(anchor),weekday=(now.getDay()+6)%7,weekStart=new Date(now);weekStart.setDate(now.getDate()-weekday);
  const monthPrefix=anchor.slice(0,7); const week=[...done].filter(x=>day(x)>=weekStart&&day(x)<=now).length; const month=[...done].filter(x=>x.startsWith(monthPrefix)).length;
  return {todayDone:done.has(anchor),streak,week,month};
}
