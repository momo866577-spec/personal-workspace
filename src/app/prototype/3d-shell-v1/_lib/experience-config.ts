import type { LucideIcon } from "lucide-react";
import {
  Activity, Bell, BookOpen, CalendarDays, ClipboardList, Compass, Dumbbell,
  Languages, NotebookPen, Salad, Settings, Sparkles, UsersRound,
} from "lucide-react";

export type PrimarySpaceId = "planning" | "learning" | "exercise" | "food" | "travel" | "notes";
export type SpaceId = "home" | PrimarySpaceId;
export type FeatureId = "today-overview" | "daily-plan" | "english" | "exercise-record" |
  "smart-food" | "travel-plan" | "cycle" | "memo" | "live-review" | "crm" |
  "calendar" | "notifications" | "settings";
export type Point3 = readonly [number, number, number];

export interface SpaceDefinition {
  id: PrimarySpaceId;
  index: number;
  eyebrow: string;
  title: string;
  zhTitle: string;
  description: string;
  icon: LucideIcon;
  worldPosition: Point3;
  cameraPosition: Point3;
  cameraTarget: Point3;
  accent: string;
  accentSecondary: string;
  detailFeature: FeatureId;
  detailLabel: string;
  metric: string;
  metricLabel: string;
  summary: readonly string[];
}

export interface HomeFeatureDefinition {
  id: FeatureId;
  title: string;
  shortTitle: string;
  icon: LucideIcon;
  target: PrimarySpaceId;
  tone: string;
}

export const SPACE_ORDER: PrimarySpaceId[] = ["planning", "learning", "exercise", "food", "travel", "notes"];

export const SPACES: SpaceDefinition[] = [
  {
    id: "planning", index: 0, eyebrow: "01 · INTENTION", title: "Planning", zhTitle: "每日計畫",
    description: "把今天拆成可完成的節奏。", icon: CalendarDays,
    worldPosition: [0, 0, 0], cameraPosition: [0, 1.7, 6.6], cameraTarget: [0, 0.55, 0],
    accent: "#a95d86", accentSecondary: "#f0a8c2", detailFeature: "daily-plan",
    detailLabel: "打開今日計畫", metric: "4 / 7", metricLabel: "今日完成",
    summary: ["09:30 回覆合作信件", "14:00 專案校對", "17:30 整理明日事項"],
  },
  {
    id: "learning", index: 1, eyebrow: "02 · GROWTH", title: "Learning", zhTitle: "英語學習",
    description: "讓每天十五分鐘累積成真正的進步。", icon: Languages,
    worldPosition: [6.7, 0, -0.35], cameraPosition: [6.7, 1.65, 6.25], cameraTarget: [6.7, 0.55, -0.35],
    accent: "#7657c8", accentSecondary: "#c7a9ff", detailFeature: "english",
    detailLabel: "查看學習紀錄", metric: "12 天", metricLabel: "連續學習",
    summary: ["今日單字 18 / 20", "聽力練習 12 分鐘", "下一課：旅行會話"],
  },
  {
    id: "exercise", index: 2, eyebrow: "03 · ENERGY", title: "Exercise", zhTitle: "運動",
    description: "看見身體正在累積的能量。", icon: Dumbbell,
    worldPosition: [13.4, 0, 0.05], cameraPosition: [13.4, 1.6, 6.45], cameraTarget: [13.4, 0.45, 0.05],
    accent: "#e4513d", accentSecondary: "#ff9a71", detailFeature: "exercise-record",
    detailLabel: "查看運動紀錄", metric: "4,820", metricLabel: "今日步數",
    summary: ["晨間伸展 已完成", "快走 26 分鐘", "本週活動 3 / 5 次"],
  },
  {
    id: "food", index: 3, eyebrow: "04 · NOURISH", title: "Health", zhTitle: "智慧飲食",
    description: "用簡單紀錄照顧每天的選擇。", icon: Salad,
    worldPosition: [20.1, 0, -0.4], cameraPosition: [20.1, 1.72, 6.1], cameraTarget: [20.1, 0.5, -0.4],
    accent: "#2e9b6d", accentSecondary: "#ffab86", detailFeature: "smart-food",
    detailLabel: "查看今日飲食", metric: "6 杯", metricLabel: "今日飲水",
    summary: ["早餐 已記錄", "午餐蔬菜達標", "晚餐建議：清爽高蛋白"],
  },
  {
    id: "travel", index: 4, eyebrow: "05 · HORIZON", title: "Travel", zhTitle: "旅行規劃",
    description: "把期待變成下一段可抵達的風景。", icon: Compass,
    worldPosition: [26.8, 0, 0], cameraPosition: [26.8, 1.62, 6.45], cameraTarget: [26.8, 0.52, 0],
    accent: "#168fb5", accentSecondary: "#72d9d0", detailFeature: "travel-plan",
    detailLabel: "打開台南行程", metric: "18 天", metricLabel: "距離出發",
    summary: ["台南三日慢旅", "住宿與車票 已完成", "待安排：第二日晚餐"],
  },
  {
    id: "notes", index: 5, eyebrow: "06 · MEMORY", title: "Notes", zhTitle: "備忘錄",
    description: "把零散想法收進一個安靜的地方。", icon: NotebookPen,
    worldPosition: [33.5, 0, -0.3], cameraPosition: [33.5, 1.65, 6.2], cameraTarget: [33.5, 0.5, -0.3],
    accent: "#d39a22", accentSecondary: "#ee7f91", detailFeature: "memo",
    detailLabel: "打開最近筆記", metric: "8 則", metricLabel: "本週新增",
    summary: ["直播復盤：三個重點", "週五採買清單", "下一次旅行靈感"],
  },
];

export const HOME_FEATURES: HomeFeatureDefinition[] = [
  { id: "today-overview", title: "今日總覽", shortTitle: "總覽", icon: Sparkles, target: "planning", tone: "#d77c9f" },
  { id: "daily-plan", title: "每日計畫", shortTitle: "計畫", icon: ClipboardList, target: "planning", tone: "#a95d86" },
  { id: "english", title: "英語學習", shortTitle: "英語", icon: Languages, target: "learning", tone: "#7657c8" },
  { id: "exercise-record", title: "運動", shortTitle: "運動", icon: Dumbbell, target: "exercise", tone: "#e4513d" },
  { id: "smart-food", title: "智慧飲食", shortTitle: "飲食", icon: Salad, target: "food", tone: "#2e9b6d" },
  { id: "travel-plan", title: "旅行規劃", shortTitle: "旅行", icon: Compass, target: "travel", tone: "#168fb5" },
  { id: "cycle", title: "經期記錄", shortTitle: "經期", icon: Activity, target: "food", tone: "#e27f77" },
  { id: "memo", title: "備忘錄", shortTitle: "備忘", icon: NotebookPen, target: "notes", tone: "#d39a22" },
  { id: "live-review", title: "直播復盤", shortTitle: "復盤", icon: BookOpen, target: "notes", tone: "#d37358" },
  { id: "crm", title: "CRM／直播用戶", shortTitle: "用戶", icon: UsersRound, target: "notes", tone: "#7b6ea8" },
  { id: "calendar", title: "日曆", shortTitle: "日曆", icon: CalendarDays, target: "planning", tone: "#6f7db5" },
  { id: "notifications", title: "通知", shortTitle: "通知", icon: Bell, target: "planning", tone: "#d36b55" },
  { id: "settings", title: "設定", shortTitle: "設定", icon: Settings, target: "notes", tone: "#696b78" },
];

export const HOME_CAMERA = { position: [-7.8, 3.15, 10.6] as Point3, target: [-7.8, 0.45, -0.45] as Point3 };
export const HOME_WORLD_POSITION = [-7.8, 0, -0.45] as Point3;
export const MOTION = { cameraDamping: 4.2, gestureLockMs: 690, wheelThreshold: 18, swipeThreshold: 46, swipeVelocity: 0.32 } as const;
export const THEME = { background: "#181820", fog: "#24222b", ivory: "#f5eadd", graphite: "#232129", deep: "#16151b", metal: "#8d8290" } as const;
