"use client";

import {
  ArrowLeft, BookOpen, Check, Clock3, Dumbbell, MapPin, NotebookPen, Salad, Sparkles,
} from "lucide-react";
import type { FeatureId, PrimarySpaceId } from "../_lib/experience-config";
import { SPACES } from "../_lib/experience-config";
import styles from "../experience.module.css";

const DETAILS: Record<Exclude<PrimarySpaceId, "planning">, {
  title: string;
  kicker: string;
  note: string;
  icon: typeof BookOpen;
  facts: readonly { label: string; value: string }[];
  rows: readonly { title: string; meta: string; done?: boolean }[];
}> = {
  learning: {
    title: "英語學習", kicker: "LEARNING DETAIL", note: "今天再走十五分鐘就很好。", icon: BookOpen,
    facts: [{ label: "連續", value: "12 天" }, { label: "本週", value: "4 課" }, { label: "熟練度", value: "78%" }],
    rows: [{ title: "生活會話 · Morning routine", meta: "已完成 · 8 分鐘", done: true }, { title: "聽力練習 · At the station", meta: "進行中 · 12 / 15 分鐘" }, { title: "今日單字複習", meta: "18 / 20 個" }],
  },
  exercise: {
    title: "運動紀錄", kicker: "EXERCISE RECORD", note: "不用追數字，只要保持身體有回應。", icon: Dumbbell,
    facts: [{ label: "步數", value: "4,820" }, { label: "活動", value: "34 分" }, { label: "本週", value: "3 / 5" }],
    rows: [{ title: "晨間伸展", meta: "07:20 · 8 分鐘", done: true }, { title: "河濱快走", meta: "16:10 · 26 分鐘", done: true }, { title: "晚間肩頸放鬆", meta: "預計 21:00" }],
  },
  food: {
    title: "智慧飲食", kicker: "DAILY NOURISH", note: "今天的方向：清爽、足量、不要太晚。", icon: Salad,
    facts: [{ label: "飲水", value: "6 杯" }, { label: "蔬菜", value: "2.5 份" }, { label: "晚餐", value: "18:30" }],
    rows: [{ title: "早餐 · 無糖豆漿與蛋", meta: "蛋白質充足", done: true }, { title: "午餐 · 雞肉蔬菜餐", meta: "蔬菜達標", done: true }, { title: "晚餐建議 · 魚與菇類", meta: "清爽高蛋白" }],
  },
  travel: {
    title: "台南三日慢旅", kicker: "TRIP PANEL", note: "距離出發還有 18 天。", icon: MapPin,
    facts: [{ label: "日期", value: "9/05–9/07" }, { label: "住宿", value: "已確認" }, { label: "完成", value: "72%" }],
    rows: [{ title: "第一天 · 美術館與老街", meta: "高鐵 09:11 抵達", done: true }, { title: "第二天 · 安平慢行", meta: "晚餐尚未安排" }, { title: "第三天 · 市場早餐", meta: "14:35 回程" }],
  },
  notes: {
    title: "最近筆記", kicker: "NOTES & MEMORY", note: "把想法先收好，稍後再整理。", icon: NotebookPen,
    facts: [{ label: "本週", value: "8 則" }, { label: "待整理", value: "3 則" }, { label: "收藏", value: "12 則" }],
    rows: [{ title: "直播復盤：三個重點", meta: "今天 15:42" }, { title: "週五採買清單", meta: "昨天 20:18", done: true }, { title: "下一次旅行靈感", meta: "8 月 25 日" }],
  },
};

export function FeatureDetailPanel({
  space,
  feature: _feature,
  onBack,
}: {
  space: Exclude<PrimarySpaceId, "planning">;
  feature: FeatureId;
  onBack: () => void;
}) {
  const detail = DETAILS[space];
  const definition = SPACES.find((item) => item.id === space)!;
  const Icon = detail.icon;
  return (
    <section className={styles.workLayer} data-testid={`${space}-detail`} data-feature={_feature}>
      <div className={styles.workBackdrop} />
      <article className={styles.detailPanel} style={{ "--space-accent": definition.accent } as React.CSSProperties}>
        <header className={styles.detailHeader}>
          <button className={styles.iconButton} onClick={onBack} aria-label="返回功能空間"><ArrowLeft /></button>
          <div><span className={styles.kicker}>{detail.kicker}</span><h1>{detail.title}</h1><p>{detail.note}</p></div>
          <span className={styles.detailIcon}><Icon /></span>
        </header>
        <div className={styles.factStrip}>
          {detail.facts.map((fact) => <div key={fact.label}><span>{fact.label}</span><strong>{fact.value}</strong></div>)}
        </div>
        <div className={styles.detailRows}>
          <div className={styles.detailRowsHeading}><strong>今日內容</strong><span><Clock3 /> 僅示範資料</span></div>
          {detail.rows.map((row) => (
            <div className={styles.detailRow} key={row.title}>
              <span className={row.done ? styles.rowDone : ""}>{row.done ? <Check /> : <Sparkles />}</span>
              <div><strong>{row.title}</strong><small>{row.meta}</small></div>
              <button aria-label={`查看 ${row.title}`}>查看</button>
            </div>
          ))}
        </div>
        <footer className={styles.detailFooter}><Sparkles /> V2 Prototype · 樣本資料不會儲存</footer>
      </article>
    </section>
  );
}
