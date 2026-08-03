export const zhCN={appName:"个人工作台",dashboard:"总览",tasks:"每日计划",english:"英语",workouts:"运动",notes:"备忘录",streams:"直播复盘",contacts:"用户管理",settings:"设置",add:"新增",save:"保存",cancel:"取消",delete:"删除",edit:"编辑",search:"搜索",noData:"还没有数据"} as const;
export type MessageKey=keyof typeof zhCN;
export const t=(key:MessageKey)=>zhCN[key];
