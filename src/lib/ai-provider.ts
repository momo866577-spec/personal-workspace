import type { AiToolMode } from "./types";

export type AiRequest = { mode: AiToolMode; input: string };
export interface AiProvider { readonly id:string; readonly name:string; generate(request:AiRequest):Promise<string> }

const clean=(value:string)=>value.trim().replace(/\s+/g," ");
export class LocalRuleProvider implements AiProvider {
  readonly id="local-rules"; readonly name="本地规则模板";
  async generate({mode,input}:AiRequest){
    const text=clean(input); if(!text)throw new Error("请输入内容");
    if(mode==="reply")return [
      `高情商版：谢谢你认真告诉我“${text}”，你的感受我收到了，我们一起把问题说清楚。`,
      `幽默版：这个问题很会挑时间出现呀！关于“${text}”，我马上认真接住。`,
      `亲切版：看到你的留言啦，谢谢你愿意和我聊“${text}”，我来慢慢回答。`,
      `高互动版：大家对“${text}”怎么看？先在评论区告诉我，我边看边回应。`,
      `主播风格版：这条留言我必须认真回！“${text}”确实很关键，接下来给大家讲清楚。`,
    ].join("\n\n");
    if(mode==="review")return ["做得好的地方：内容真实，有可继续延伸的互动点。","可以改善：开场更快抛出主题，每 3–5 分钟主动邀请一次评论。",`可以换说法：把“${text}”拆成更短的问题，让观众容易回答。`,"提高互动率：使用二选一问题并点名感谢有效留言。","提高停留率：每段先预告结果，再逐步解释。","复盘结论：保留真实表达，缩短铺垫并增加明确互动节点。"].join("\n\n");
    return [
      `最佳回复：我理解你说的“${text}”，我先把最关键的部分讲清楚。`,
      "第二种回复：这个问题很多人都会遇到，我们一起看最合适的解决方式。",
      "高情商版本：谢谢你直接说出顾虑，你的考虑很合理。",
      "幽默版本：问题很犀利，但主播已经稳稳接住啦。",
      "带货版本：先看它真正解决什么问题，再判断是否适合你。",
      "引导成交版本：如果需求和预算都合适，可以先从最实用的组合开始。",
      "为什么有效：先认可情绪，再回答问题，最后给出低压力的下一步，能降低对抗并提高回应意愿。",
    ].join("\n\n");
  }
}
export const aiProvider:AiProvider=new LocalRuleProvider();
