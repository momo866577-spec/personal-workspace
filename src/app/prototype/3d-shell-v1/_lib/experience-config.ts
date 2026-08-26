import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BookOpen,
  CalendarDays,
  Compass,
  HeartPulse,
  ListTodo,
  Sparkles,
} from "lucide-react";

export type AnchorId = "today" | "planning" | "learning" | "health" | "travel";
export type SpaceId = "main" | "planning";
export type FeatureId = "daily-plan" | "tasks" | "week";

export type Point3 = readonly [number, number, number];

export interface AnchorDefinition {
  id: AnchorId;
  index: number;
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  worldPosition: Point3;
  cameraPosition: Point3;
  cameraTarget: Point3;
  accent: string;
  accentSecondary: string;
}

export interface FeatureDefinition {
  id: FeatureId;
  title: string;
  label: string;
  description: string;
  icon: LucideIcon;
  position: Point3;
}

export const ANCHORS: AnchorDefinition[] = [
  {
    id: "today",
    index: 0,
    eyebrow: "01 · ARRIVAL",
    title: "Today",
    description: "先看見今天，再決定往哪裡走。",
    icon: Sparkles,
    worldPosition: [0, 0, 0],
    cameraPosition: [0.2, 1.65, 7.4],
    cameraTarget: [0, 0.55, 0],
    accent: "#e9b9c8",
    accentSecondary: "#f4ddd7",
  },
  {
    id: "planning",
    index: 1,
    eyebrow: "02 · INTENTION",
    title: "Planning",
    description: "把想做的事，整理成清楚的節奏。",
    icon: CalendarDays,
    worldPosition: [4.8, 0, -0.6],
    cameraPosition: [4.3, 1.85, 6.1],
    cameraTarget: [4.8, 0.62, -0.6],
    accent: "#c9a7bb",
    accentSecondary: "#ead8df",
  },
  {
    id: "learning",
    index: 2,
    eyebrow: "03 · GROWTH",
    title: "Learning",
    description: "收藏正在形成的知識與靈感。",
    icon: BookOpen,
    worldPosition: [9.1, 0, -1.5],
    cameraPosition: [8.65, 1.45, 4.85],
    cameraTarget: [9.1, 0.6, -1.5],
    accent: "#a9b7ba",
    accentSecondary: "#d8e2df",
  },
  {
    id: "health",
    index: 3,
    eyebrow: "04 · BALANCE",
    title: "Health",
    description: "用不打擾的方式，看見身體狀態。",
    icon: HeartPulse,
    worldPosition: [13.3, 0, -0.2],
    cameraPosition: [12.85, 1.95, 6.1],
    cameraTarget: [13.3, 0.62, -0.2],
    accent: "#bac6b5",
    accentSecondary: "#e1e6d8",
  },
  {
    id: "travel",
    index: 4,
    eyebrow: "05 · HORIZON",
    title: "Travel",
    description: "把下一段風景，留在可抵達的位置。",
    icon: Compass,
    worldPosition: [17.8, 0, -1.1],
    cameraPosition: [17.35, 1.55, 5.45],
    cameraTarget: [17.8, 0.55, -1.1],
    accent: "#c3b3a7",
    accentSecondary: "#e7ddd2",
  },
];

export const PLANNING_FEATURES: FeatureDefinition[] = [
  {
    id: "daily-plan",
    title: "今日計畫",
    label: "TODAY PLAN",
    description: "用一個清楚的頁面安排今天",
    icon: CalendarDays,
    position: [4.8, 0.65, -1.55],
  },
  {
    id: "tasks",
    title: "任務",
    label: "TASKS",
    description: "整理正在進行與等待開始的事",
    icon: ListTodo,
    position: [3.05, 0.35, -0.35],
  },
  {
    id: "week",
    title: "本週",
    label: "THIS WEEK",
    description: "從更遠一點的尺度看時間",
    icon: Activity,
    position: [6.55, 0.35, -0.35],
  },
];

export const THEME = {
  background: "#e7e2dc",
  fog: "#e9e4de",
  ivory: "#f2eee8",
  warmIvory: "#e2d8cd",
  silver: "#aeb5b4",
  graphite: "#292b2b",
  mauve: "#b78fa4",
  blush: "#e8b7c6",
  moss: "#aebaa8",
  shadow: "#514b49",
} as const;

export const MOTION = {
  cameraDamping: 3.6,
  cameraDampingReduced: 14,
  gestureLockMs: 760,
  wheelThreshold: 14,
  swipeThreshold: 42,
} as const;

export const PLANNING_CAMERA = {
  position: [4.8, 1.45, 3.15] as Point3,
  target: [4.8, 0.55, -0.85] as Point3,
};

export const WORK_CAMERA = {
  position: [4.8, 1.3, 2.55] as Point3,
  target: [4.8, 0.62, -1.25] as Point3,
};
