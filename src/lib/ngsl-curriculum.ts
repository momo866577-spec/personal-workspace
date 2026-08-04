import wordsJson from "@/data/ngsl-1.2.json";
import type { CefrLevel, EnglishPrompt, Task } from "./types";

export const NGSL_VERSION="NGSL 1.2";
export const NGSL_TOTAL=wordsJson.length;
const boundaries:{level:CefrLevel;end:number}[]=[{level:"A1",end:600},{level:"A2",end:1200},{level:"B1",end:1900},{level:"B2",end:2500},{level:"C1",end:2750},{level:"C2",end:NGSL_TOTAL}];
type WordRow={word:string;rank:number;phonetic:string;pos:string;translation:string;example:string;exampleTranslation:string};
const words=wordsJson as WordRow[];

export function levelForIndex(index:number){return boundaries.find(x=>index<x.end)?.level||"C2"}
export function nextLevel(level:CefrLevel){const index=boundaries.findIndex(x=>x.level===level);return boundaries[Math.min(index+1,boundaries.length-1)].level}
export function levelNumber(index:number){const levelIndex=Math.max(0,boundaries.findIndex(x=>index<x.end)),previous=levelIndex===0?0:boundaries[levelIndex-1].end;return Math.floor((index-previous)/5)+1}

const prompt=(text:string,translation:string):EnglishPrompt=>({text,translation});
export function lessonForGroup(group:number){
 const start=Math.min(group*5,Math.max(0,NGSL_TOTAL-5)),rows=words.slice(start,start+5),level=levelForIndex(start);
 const wordPrompts=rows.map(row=>({text:row.word,phonetic:row.phonetic,translation:`${row.pos}｜${row.translation}`,example:row.example,exampleTranslation:row.exampleTranslation}));
 const sentences=rows.slice(0,3).map(row=>prompt(row.example,row.exampleTranslation));
 const names=rows.map(x=>x.word).join(", ");
 return {start,level,words:wordPrompts,sentences,shadowing:prompt(`Today I am learning five useful NGSL words: ${names}. I will read them clearly, notice their meanings, and use each one in a complete sentence.`,`今天我要学习五个实用的 NGSL 词汇：${rows.map(x=>x.word).join("、")}。我会清楚朗读、理解含义，并用完整句子练习。`),speaking:prompt(`Use at least two of today's words (${names}) to describe a real situation in your life.`,`使用今天至少两个单词，描述你生活中的真实情境。`),listening:prompt(`Listen carefully as the five words are read in order: ${names}. After listening, repeat each word and recall its meaning.`,`仔细听这五个单词依次朗读。听完后逐个复述，并回想它们的含义。`)};
}

export function completedCurriculumDates(tasks:Task[],validDates:Set<string>){const dates=new Map<string,Task[]>();for(const task of tasks)if(task.id.startsWith("english-daily:")&&validDates.has(task.due)){const list=dates.get(task.due)||[];list.push(task);dates.set(task.due,list)}return [...dates].filter(([,rows])=>rows.length>=5&&rows.every(x=>x.done)).map(([date])=>date).sort()}
export function curriculumStats(tasks:Task[],validDates:Set<string>,anchor:string){
 const completedDates=completedCurriculumDates(tasks,validDates),completedWords=Math.min(completedDates.length*5,NGSL_TOTAL),index=Math.min(completedWords,NGSL_TOTAL-1),level=levelForIndex(index),todayRows=tasks.filter(x=>x.due===anchor&&x.id.startsWith(`english-daily:${anchor}:`)),todayDone=todayRows.filter(x=>x.done).length;
 const now=new Date(`${anchor}T00:00:00`),weekday=(now.getDay()+6)%7,weekStart=new Date(now);weekStart.setDate(now.getDate()-weekday);const week=completedDates.filter(x=>new Date(`${x}T00:00:00`)>=weekStart&&x<=anchor).length;
 const done=new Set(completedDates);let streak=0;const cursor=new Date(now);if(!done.has(anchor))cursor.setDate(cursor.getDate()-1);while(done.has(cursor.toLocaleDateString("en-CA"))){streak++;cursor.setDate(cursor.getDate()-1)}
 return {completedWords,total:NGSL_TOTAL,percent:Math.round(completedWords/NGSL_TOTAL*100),level,nextLevel:nextLevel(level),chapter:levelNumber(index),todayDone,week,streak,finished:completedWords>=NGSL_TOTAL};
}
