"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Apple,
  BedDouble,
  Camera,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleDollarSign,
  FileText,
  Heart,
  Hotel,
  Map,
  MapPin,
  Plane,
  Plus,
  Sparkles,
  Trash2,
  Utensils,
} from "lucide-react";
import { db } from "@/lib/db";
import { travelProvider, type TravelRequest } from "@/lib/travel-provider";
import { today, uid, type TravelItem, type TravelPlan } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import styles from "./travel-page-v2.module.css";

const expenseLabels: Record<keyof TravelPlan["expenses"], string> = {
  accommodation: "住宿",
  transport: "交通",
  food: "餐饮",
  tickets: "门票",
  other: "其他",
};

const expenseIcons = {
  accommodation: BedDouble,
  transport: Plane,
  food: Utensils,
  tickets: FileText,
  other: CircleDollarSign,
};

function sortedDays(plan: TravelPlan) {
  const existing = Object.keys(plan.items).sort((a, b) => Number(a) - Number(b));
  if (existing.length) return existing;
  return Array.from({ length: Math.max(1, plan.days) }, (_, index) => String(index + 1));
}

function routeLabel(item: TravelItem) {
  return item.address || item.name;
}

function googleRouteUrl(items: TravelItem[]) {
  if (!items.length) return "https://www.google.com/maps";
  if (items.length === 1) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(routeLabel(items[0]))}`;
  }
  const visible = items.slice(0, 10);
  const origin = encodeURIComponent(routeLabel(visible[0]));
  const destination = encodeURIComponent(routeLabel(visible[visible.length - 1]));
  const waypoints = visible.slice(1, -1).map(routeLabel).join("|");
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : ""}`;
}

function appleRouteUrl(items: TravelItem[]) {
  const destination = items.at(-1);
  return destination
    ? `https://maps.apple.com/?q=${encodeURIComponent(routeLabel(destination))}`
    : "https://maps.apple.com";
}

function formatTripRange(plan: TravelPlan) {
  const start = new Date(`${plan.startDate}T12:00:00`);
  if (Number.isNaN(start.getTime())) return plan.startDate;
  const end = new Date(start);
  end.setDate(start.getDate() + Math.max(0, plan.days - 1));
  const startText = `${start.getMonth() + 1}月${start.getDate()}日`;
  const endText = `${end.getMonth() + 1}月${end.getDate()}日`;
  return `${startText}—${endText}`;
}

export function TravelPageV2() {
  const plans = useLiveQuery(() => db.travelPlans.orderBy("updatedAt").reverse().toArray(), []) || [];
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedDay, setSelectedDay] = useState("1");
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState<{ planId: string; day: string; index: number } | null>(null);
  const [form, setForm] = useState<TravelRequest>({
    destination: "",
    startDate: today(),
    days: 3,
    budget: 5000,
    people: 1,
    transport: "高铁",
  });

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) || plans[0];
  const days = useMemo(() => selectedPlan ? sortedDays(selectedPlan) : [], [selectedPlan]);
  const activeDay = days.includes(selectedDay) ? selectedDay : days[0] || "1";
  const activeItems = useMemo(
    () => selectedPlan ? [...(selectedPlan.items[activeDay] || [])].sort((a, b) => a.order - b.order) : [],
    [selectedPlan, activeDay],
  );

  const createPlan = async () => {
    if (!form.destination.trim()) {
      setError("请先填写目的地。");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const generated = await travelProvider.plan(form);
      const now = new Date().toISOString();
      const id = uid();
      await db.travelPlans.add({
        id,
        title: `${form.destination.trim()}旅行`,
        ...form,
        destination: form.destination.trim(),
        status: "planned",
        items: generated.items,
        expenses: { accommodation: 0, transport: 0, food: 0, tickets: 0, other: 0 },
        tips: generated.tips,
        documents: [],
        photos: [],
        createdAt: now,
        updatedAt: now,
      });
      setSelectedPlanId(id);
      setSelectedDay("1");
      setFormOpen(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "旅行规划生成失败，请稍后再试。");
    } finally {
      setBusy(false);
    }
  };

  const updatePlan = async (plan: TravelPlan, changes: Partial<TravelPlan>) => {
    await db.travelPlans.update(plan.id, { ...changes, updatedAt: new Date().toISOString() });
  };

  const moveItem = async (plan: TravelPlan, day: string, from: number, to: number) => {
    const list = [...(plan.items[day] || [])];
    if (to < 0 || to >= list.length || from === to) return;
    const [item] = list.splice(from, 1);
    list.splice(to, 0, item);
    await updatePlan(plan, {
      items: { ...plan.items, [day]: list.map((entry, order) => ({ ...entry, order })) },
    });
  };

  const removeItem = async (plan: TravelPlan, day: string, id: string) => {
    await updatePlan(plan, {
      items: { ...plan.items, [day]: (plan.items[day] || []).filter((item) => item.id !== id) },
    });
  };

  const toggleFavorite = async (plan: TravelPlan, day: string, id: string) => {
    await updatePlan(plan, {
      items: {
        ...plan.items,
        [day]: (plan.items[day] || []).map((item) => item.id === id ? { ...item, favorite: !item.favorite } : item),
      },
    });
  };

  const addDocument = async (plan: TravelPlan, type: string) => {
    const name = window.prompt(`请输入${type}名称`);
    if (!name?.trim()) return;
    const note = window.prompt("补充说明（可选）") || "";
    await updatePlan(plan, { documents: [...plan.documents, { type, name: name.trim(), note }] });
  };

  const addPhoto = (plan: TravelPlan, file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => void updatePlan(plan, {
      photos: [...plan.photos, { name: file.name, data: String(reader.result) }],
    });
    reader.readAsDataURL(file);
  };

  const totalSpent = selectedPlan ? Object.values(selectedPlan.expenses).reduce((sum, value) => sum + value, 0) : 0;
  const budgetProgress = selectedPlan?.budget ? Math.min(100, Math.round(totalSpent / selectedPlan.budget * 100)) : 0;

  return (
    <div className={`${styles.page} travel-page`}>
      <section className={styles.toolbar}>
        <div className={styles.tripPicker}>
          <Plane aria-hidden="true" />
          {plans.length ? (
            <div className={styles.pickerCopy}>
              <select
                aria-label="选择旅行"
                value={selectedPlan?.id || ""}
                onChange={(event) => {
                  setSelectedPlanId(event.target.value);
                  setSelectedDay("1");
                }}
              >
                {plans.map((plan) => <option value={plan.id} key={plan.id}>{plan.title}</option>)}
              </select>
              {selectedPlan && <small>{formatTripRange(selectedPlan)} · {selectedPlan.people}人 · {selectedPlan.transport}</small>}
            </div>
          ) : <strong>还没有旅行计划</strong>}
        </div>
        <Button onClick={() => setFormOpen((value) => !value)}><Plus />建立旅行</Button>
      </section>

      {formOpen && (
        <section className={styles.createPanel} aria-label="建立旅行">
          <header><div><small>AI 旅行助手</small><h2>建立新旅行</h2></div><Plane /></header>
          <div className={styles.formGrid}>
            <label>目的地<Input value={form.destination} onChange={(event) => setForm({ ...form, destination: event.target.value })} placeholder="例如：杭州" /></label>
            <label>出发日期<Input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} /></label>
            <label>天数<Input type="number" min="1" max="30" value={form.days} onChange={(event) => setForm({ ...form, days: Number(event.target.value) })} /></label>
            <label>预算<Input type="number" min="0" value={form.budget} onChange={(event) => setForm({ ...form, budget: Number(event.target.value) })} /></label>
            <label>人数<Input type="number" min="1" value={form.people} onChange={(event) => setForm({ ...form, people: Number(event.target.value) })} /></label>
            <label>交通方式<Input value={form.transport} onChange={(event) => setForm({ ...form, transport: event.target.value })} /></label>
          </div>
          <Button onClick={createPlan} disabled={busy}>{busy ? "正在生成…" : "生成完整行程"}</Button>
          {error && <p className={styles.error}>{error}</p>}
        </section>
      )}

      {!selectedPlan ? (
        <section className={styles.empty}>
          <Map aria-hidden="true" />
          <h2>从第一趟旅行开始</h2>
          <p>输入地点、日期和预算，AI 会生成可编辑的每日行程。</p>
          <Button onClick={() => setFormOpen(true)}><Plus />建立旅行</Button>
        </section>
      ) : (
        <>
          <section className={styles.routePanel}>
            <header>
              <div><span><Plane />今日路线</span><small>{activeItems.length} 个地点 · Day {activeDay}</small></div>
              <nav>
                <a href={googleRouteUrl(activeItems)} target="_blank" rel="noreferrer"><MapPin />Google Maps</a>
                <a href={appleRouteUrl(activeItems)} target="_blank" rel="noreferrer"><Apple />Apple Maps</a>
              </nav>
            </header>
            {activeItems.length ? (
              <div className={styles.routeScroller} tabIndex={0} aria-label={`Day ${activeDay} 路线，共 ${activeItems.length} 个地点`}>
                <ol className={styles.routeTrack}>
                  {activeItems.map((item, index) => (
                    <li key={item.id}>
                      <span>{index + 1}</span>
                      <b>{item.name}</b>
                      <time>{item.time}</time>
                    </li>
                  ))}
                </ol>
              </div>
            ) : <p className={styles.routeEmpty}>这一天还没有路线地点。</p>}
            {activeItems.length > 4 && <small className={styles.scrollHint}>左右滑动查看全部 {activeItems.length} 个地点</small>}
          </section>

          <nav className={styles.dayTabs} aria-label="选择旅行日期">
            {days.map((day) => (
              <button key={day} className={day === activeDay ? styles.activeDay : ""} onClick={() => setSelectedDay(day)}>
                Day {day}<small>{(selectedPlan.items[day] || []).length} 项</small>
              </button>
            ))}
          </nav>

          <section className={styles.schedulePanel}>
            <header><h2>Day {activeDay} 行程</h2><span>{activeItems.length} 项安排</span></header>
            {activeItems.length ? (
              <div className={styles.scheduleList}>
                {activeItems.map((item, index) => (
                  <article
                    className={styles.scheduleRow}
                    key={item.id}
                    draggable
                    onDragStart={() => setDragging({ planId: selectedPlan.id, day: activeDay, index })}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (dragging?.planId === selectedPlan.id && dragging.day === activeDay) void moveItem(selectedPlan, activeDay, dragging.index, index);
                      setDragging(null);
                    }}
                  >
                    <time>{item.time}<small>{item.period}</small></time>
                    <span className={styles.stopNumber}>{index + 1}</span>
                    <div className={styles.stopContent}>
                      <b>{item.name}</b>
                      <p>{item.notes || item.address || item.category}</p>
                      <small>{item.duration ? `${item.duration} 分钟` : "时长待定"}{item.cost ? ` · ¥${item.cost}` : ""}</small>
                    </div>
                    <button aria-label={item.favorite ? `取消收藏 ${item.name}` : `收藏 ${item.name}`} onClick={() => toggleFavorite(selectedPlan, activeDay, item.id)}><Heart fill={item.favorite ? "currentColor" : "none"} /></button>
                    <div className={styles.rowActions}>
                      <button aria-label="上移" onClick={() => moveItem(selectedPlan, activeDay, index, index - 1)} disabled={index === 0}><ChevronUp /></button>
                      <button aria-label="下移" onClick={() => moveItem(selectedPlan, activeDay, index, index + 1)} disabled={index === activeItems.length - 1}><ChevronDown /></button>
                      <button aria-label={`删除 ${item.name}`} onClick={() => removeItem(selectedPlan, activeDay, item.id)}><Trash2 /></button>
                    </div>
                  </article>
                ))}
              </div>
            ) : <p className={styles.softEmpty}>这一天暂时没有安排。</p>}
          </section>

          <section className={styles.budgetPanel}>
            <header><div><span><CircleDollarSign />预算总览</span><strong>¥{totalSpent.toLocaleString()}</strong></div><p>总预算 ¥{selectedPlan.budget.toLocaleString()}</p></header>
            <div className={styles.progressTrack} role="progressbar" aria-label="旅行预算使用进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={budgetProgress}><i style={{ width: `${budgetProgress}%` }}>{budgetProgress > 12 ? `${budgetProgress}%` : ""}</i></div>
            <div className={styles.expenseGrid}>
              {(Object.keys(selectedPlan.expenses) as Array<keyof TravelPlan["expenses"]>).map((key) => {
                const Icon = expenseIcons[key];
                return <label key={key}><Icon /><span>{expenseLabels[key]}</span><Input aria-label={`${expenseLabels[key]}预算`} type="number" min="0" value={selectedPlan.expenses[key]} onChange={(event) => updatePlan(selectedPlan, { expenses: { ...selectedPlan.expenses, [key]: Math.max(0, Number(event.target.value) || 0) } })} /></label>;
              })}
            </div>
          </section>

          <section className={styles.quickPanel}>
            <button onClick={() => addDocument(selectedPlan, "机票酒店")}><Hotel />机票酒店<ChevronRight /></button>
            <button onClick={() => addDocument(selectedPlan, "备忘")}><FileText />备忘<ChevronRight /></button>
            <details><summary><Sparkles />AI 建议<ChevronRight /></summary><div>{selectedPlan.tips.length ? selectedPlan.tips.map((tip) => <p key={tip}>{tip}</p>) : <p>暂无建议。</p>}</div></details>
            <label><Camera />照片<ChevronRight /><input hidden type="file" accept="image/*" onChange={(event) => addPhoto(selectedPlan, event.target.files?.[0])} /></label>
          </section>

          {(selectedPlan.documents.length > 0 || selectedPlan.photos.length > 0) && (
            <section className={styles.assetPanel}>
              <h2>旅行资料夹</h2>
              <div>
                {selectedPlan.documents.map((document, index) => <article key={`${document.type}-${document.name}-${index}`}><small>{document.type}</small><b>{document.name}</b><p>{document.note}</p></article>)}
                {selectedPlan.photos.map((photo, index) => <figure key={`${photo.name}-${index}`}><Image src={photo.data} alt={photo.name} width={320} height={180} unoptimized /><figcaption>{photo.name}</figcaption></figure>)}
              </div>
            </section>
          )}

          <button className={styles.deleteTrip} onClick={() => {
            if (window.confirm(`确定删除“${selectedPlan.title}”吗？`)) void db.travelPlans.delete(selectedPlan.id);
          }}><Trash2 />删除这趟旅行</button>
        </>
      )}
    </div>
  );
}
