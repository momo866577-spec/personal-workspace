import type { PeriodRecord } from "./types";

const day=(value:string)=>new Date(`${value}T00:00:00`).getTime();
const daysBetween=(a:string,b:string)=>Math.round((day(b)-day(a))/86400000);
export const periodDuration=(record:PeriodRecord)=>record.endDate?daysBetween(record.startDate,record.endDate)+1:1;

export type PeriodSummary={cycleCount:number;averageCycle:number|null;averageDuration:number|null;variation:number|null;regularity:"数据不足"|"较规律"|"建议关注";nextEstimate:string|null;alerts:string[]};

export function analyzePeriods(records:PeriodRecord[]):PeriodSummary{
 const rows=[...records].sort((a,b)=>a.startDate.localeCompare(b.startDate));
 const intervals=rows.slice(1).map((row,index)=>daysBetween(rows[index].startDate,row.startDate)).filter(value=>value>0);
 const durations=rows.filter(row=>row.endDate).map(periodDuration);
 const averageCycle=intervals.length?Math.round(intervals.reduce((sum,value)=>sum+value,0)/intervals.length):null;
 const averageDuration=durations.length?Math.round(durations.reduce((sum,value)=>sum+value,0)/durations.length*10)/10:null;
 const variation=intervals.length>1?Math.max(...intervals)-Math.min(...intervals):null;
 const regularity=intervals.length<2?"数据不足":intervals.every(value=>value>=21&&value<=35)&&(variation??0)<=9?"较规律":"建议关注";
 const last=rows.at(-1);
 const nextEstimate=last&&averageCycle?new Date(day(last.startDate)+averageCycle*86400000).toLocaleDateString("en-CA"):null;
 const alerts:string[]=[];
 if(intervals.some(value=>value<21||value>35))alerts.push("记录中出现短于 21 天或长于 35 天的周期");
 if((variation??0)>9)alerts.push("不同周期长度相差超过 9 天");
 if(rows.some(record=>periodDuration(record)>7))alerts.push("有一次经期持续超过 7 天");
 if(rows.some(record=>record.flow==="heavy"&&record.padChanges>=8))alerts.push("有重度流量且一天更换经期用品次数较多的记录");
 if(rows.some(record=>record.pain>=7))alerts.push("有疼痛评分达到 7 分或以上的记录");
 return {cycleCount:rows.length,averageCycle,averageDuration,variation,regularity,nextEstimate,alerts};
}

export const periodAdvice={
 comfort:["热水袋或热敷腹部","温水淋浴或泡澡","散步、瑜伽等轻柔活动","保证休息并记录症状变化"],
 food:["日常均衡饮食和充足饮水","深绿色叶菜、豆类、肉类等含铁食物","搭配富含维生素 C 的蔬果帮助膳食铁吸收","若怀疑贫血或需要补铁，请先咨询医生"],
 urgent:["连续 2 小时以上每小时浸透一片卫生巾或棉条，并伴胸痛、气短、头晕时，应立即就医","疼痛严重或明显比平时加重且止痛措施无效时，应尽快就医","经期超过 7 天、经间出血、周期长期短于 21 天或长于 35 天时，建议预约妇科评估"],
};

export function periodAiSystemPrompt(){return `你是经期健康记录分析助手。只分析用户提供的周期记录，不做疾病诊断，不推测未提供的信息。输出必须严格只有以下四个标题：\n【周期概况】\n【需要注意】\n【生活提醒】\n【何时就医】\n每部分使用 1 至 3 条短句。禁止前言、结语、免责声明、寒暄，禁止出现“作为AI”“根据你的描述”“仅供参考”“建议咨询专业人士”等套话。需要就医时直接写触发条件。`}

export function periodAiPrompt(records:PeriodRecord[],summary:PeriodSummary){
 const compact=records.slice().sort((a,b)=>b.startDate.localeCompare(a.startDate)).slice(0,12).map(record=>({startDate:record.startDate,endDate:record.endDate||null,flow:record.flow,padChanges:record.padChanges,pain:record.pain,symptoms:record.symptoms}));
 return `周期统计：${JSON.stringify(summary)}\n最近记录：${JSON.stringify(compact)}\n请严格按系统指定的四段格式输出，不要添加其它内容。`;
}

export function cleanPeriodAiOutput(text:string){
 return text.split("\n").filter(line=>!/^\s*(作为\s*AI|根据你(?:的|提供)|以下(?:是|为)|仅供参考|希望以上|请注意)/i.test(line)).join("\n").trim();
}
