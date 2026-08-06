"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Activity, ArrowRight, Camera, CheckCircle2, Flame, Info, Plus, Search, Trash2, Upload, Utensils } from "lucide-react";
import { db } from "@/lib/db";
import { recognizeFoodCandidates, rememberNutritionFood, scaleFood, searchFoodsWithStatus } from "@/lib/nutrition-provider";
import { today, uid, type NutritionFood, type NutritionRecord } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const round = (value: number) => Math.round(value * 10) / 10;
const targets = { kcal: 1800, protein: 90, carbs: 200, fat: 60 };
const meals = ["早餐", "午餐", "晚餐", "加餐"] as const;
const mealTimes = { 早餐: "07:30", 午餐: "12:30", 晚餐: "18:30", 加餐: "21:00" };
const sumRows = (rows: NutritionRecord[]) => rows.reduce((sum, row) => ({
  kcal: sum.kcal + row.kcal, protein: sum.protein + row.protein,
  carbs: sum.carbs + row.carbs, fat: sum.fat + row.fat,
}), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
const dateOffset = (offset: number) => { const date = new Date(); date.setDate(date.getDate() + offset); return date.toLocaleDateString("en-CA"); };

function JellyBar({ value, max, label }: { value: number; max: number; label: string }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  return <div className="nutrition-jelly-bar" aria-label={`${label} ${Math.round(percentage)}%`}>
    <span style={{ width: `${percentage}%` }} data-complete={percentage >= 100} />
  </div>;
}

function JellyRing({ value, max }: { value: number; max: number }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  return <div className="nutrition-jelly-ring" style={{ "--nutrition-progress": `${percentage * 3.6}deg` } as React.CSSProperties} data-complete={percentage >= 100}>
    <div><strong>{Math.round(value).toLocaleString()}</strong><small>kcal</small></div>
  </div>;
}

export function NutritionPageV2() {
  const rows = useLiveQuery(() => db.nutritionRecords.where("date").equals(today()).toArray(), []) || [];
  const weekRows = useLiveQuery(() => db.nutritionRecords.where("date").between(dateOffset(-6), today(), true, true).toArray(), []) || [];
  const workouts = useLiveQuery(() => db.workouts.where("date").equals(today()).toArray(), []) || [];
  const [query, setQuery] = useState("");
  const [foods, setFoods] = useState<NutritionFood[]>([]);
  const [selected, setSelected] = useState<NutritionFood | null>(null);
  const [grams, setGrams] = useState(100);
  const [meal, setMeal] = useState<(typeof meals)[number]>("午餐");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const total = sumRows(rows);
  const burn = workouts.reduce((sum, row) => sum + Math.max(0, row.minutes * 6), 0);
  const net = total.kcal - burn;
  const scaled = selected ? scaleFood(selected, grams) : null;
  const grouped = meals.map((name) => ({ name, rows: rows.filter((row) => row.meal === name) }));
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = dateOffset(index - 6), value = sumRows(weekRows.filter((row) => row.date === date)).kcal;
    return { date, value, label: index === 6 ? "今天" : new Intl.DateTimeFormat("zh-CN", { weekday: "short" }).format(new Date(`${date}T12:00:00`)) };
  });
  const maxWeek = Math.max(targets.kcal, ...week.map((item) => item.value));

  const search = async (nextQuery = query) => {
    if (!nextQuery.trim()) return;
    setBusy(true); setNotice("");
    const result = await searchFoodsWithStatus(nextQuery);
    setFoods(result.foods);
    setNotice(result.foods.length ? (result.warnings.length ? result.warnings.join("；") : `找到 ${result.foods.length} 项，优先显示本机 USDA 食物库。`) : `没有找到“${nextQuery}”。${result.warnings.join("；")}`);
    setBusy(false);
  };
  const recognize = async (file?: File) => {
    if (!file) return;
    setBusy(true); setNotice("正在辨识可能的食物，只辨识名称，不猜营养。");
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
      const candidates = await recognizeFoodCandidates(dataUrl);
      const results = await Promise.all(candidates.map((candidate) => searchFoodsWithStatus(candidate)));
      setFoods(Array.from(new Map(results.flatMap((result) => result.foods).map((food) => [food.id, food])).values()));
      setQuery(candidates.join("、")); setNotice(`可能是：${candidates.join("、")}。请确认食物与重量后再保存。`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "辨识失败"); }
    finally { setBusy(false); }
  };
  const chooseImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    void recognize(file);
  };
  const add = async () => {
    if (!selected || !scaled || grams <= 0) return;
    await rememberNutritionFood(selected);
    await db.nutritionRecords.add({ id: uid(), date: today(), meal, foodId: selected.id, foodName: selected.name, grams,
      kcal: round(scaled.kcal), protein: round(scaled.protein), carbs: round(scaled.carbs), fat: round(scaled.fat), source: selected.source, notes: "", createdAt: new Date().toISOString() });
    setSelected(null); setFoods([]); setQuery(""); setNotice("已加入今日饮食。");
  };

  const suggestions = [
    total.protein < targets.protein ? `蛋白质还可以增加 ${Math.ceil(targets.protein - total.protein)} g` : "蛋白质目标已达成",
    total.carbs < targets.carbs * .8 ? "碳水化合物偏低，可搭配全谷物或地瓜" : "碳水化合物摄取适中",
    total.fat > targets.fat ? "脂肪已超过目标，下一餐优先清淡烹调" : "脂肪摄入仍在目标范围",
  ];

  return <div className="nutrition-v2">
    <section className="nutrition-overview-card">
      <h3>今日热量</h3>
      <div className="nutrition-overview-grid">
        <JellyRing value={total.kcal} max={targets.kcal} />
        <div className="nutrition-energy-list">
          <p><Flame /><span>摄入热量</span><b>{Math.round(total.kcal).toLocaleString()} <small>kcal</small></b></p>
          <p><Activity /><span>运动消耗</span><b>{Math.round(burn).toLocaleString()} <small>kcal</small></b></p>
          <p><Utensils /><span>净摄入</span><b>{Math.round(net).toLocaleString()} <small>kcal</small></b></p>
        </div>
      </div>
      <p className="nutrition-summary">今日净摄入{net > targets.kcal ? "高于" : "低于"}建议，保持均衡饮食能量更充足。</p>
    </section>

    <section className="nutrition-target-card">
      <h3>营养目标 <Info /></h3>
      {([["蛋白质", total.protein, targets.protein], ["碳水化合物", total.carbs, targets.carbs], ["脂肪", total.fat, targets.fat]] as const).map(([label, value, max]) => <div className="nutrition-target-row" key={label}>
        <span>{label}</span><b>{round(value)} / {max} g</b><strong>{Math.round(Math.min(100, value / max * 100))}%</strong>
        <JellyBar value={value} max={max} label={label} />
      </div>)}
    </section>

    <section className="nutrition-meals-card">
      <h3>今日餐次</h3>
      <div className="nutrition-timeline">
        {grouped.map(({ name, rows: mealRows }) => <article key={name}>
          <i /><div><b>{name}</b><time>{mealTimes[name]}</time><small>{mealRows.length ? `已记录 ${mealRows.length} 项` : "尚未记录"}</small></div>
          <strong>{Math.round(sumRows(mealRows).kcal)} <small>kcal</small></strong>
          <button onClick={() => { setMeal(name); document.querySelector<HTMLInputElement>("#nutrition-search")?.focus(); }}>{mealRows.length ? "查看详情" : "添加食物"}<ArrowRight /></button>
          {mealRows.length > 0 && <ul>{mealRows.map((row) => <li key={row.id}><span>{row.foodName} · {row.grams}g</span><button aria-label={`删除${row.foodName}`} onClick={() => db.nutritionRecords.delete(row.id)}><Trash2 /></button></li>)}</ul>}
        </article>)}
      </div>
    </section>

    <section className="nutrition-actions">
      <div className="nutrition-search-card"><h3><Search /> 搜索食物</h3><div><Input id="nutrition-search" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void search()} placeholder="鸡胸肉、白饭、牛奶……" /><Button onClick={() => void search()} disabled={busy}><ArrowRight /></Button></div></div>
      <div className="nutrition-photo-card"><Camera /><span><b>照片辨识</b><small>辨识名称后由数据库计算营养</small></span><div className="nutrition-photo-actions"><label><Camera />拍照<input type="file" accept="image/*" capture="environment" onChange={chooseImage} /></label><label><Upload />上传照片<input type="file" accept="image/*" onChange={chooseImage} /></label></div></div>
    </section>
    {notice && <p className="nutrition-notice" role="status">{notice}</p>}
    {foods.length > 0 && <section className="nutrition-results"><h3>选择食物</h3>{foods.map((food) => <button className={selected?.id === food.id ? "active" : ""} key={food.id} onClick={() => setSelected(food)}><b>{food.name}</b><small>{food.brand || food.source}</small><span>{round(food.kcal)} kcal / 100g</span></button>)}</section>}
    {selected && scaled && <section className="nutrition-confirm"><div><b>{selected.name}</b><small>{selected.source}</small></div><select value={meal} onChange={(event) => setMeal(event.target.value as typeof meal)}>{meals.map((item) => <option key={item}>{item}</option>)}</select><div className="nutrition-grams">{[50,100,150,200].map((value) => <button className={grams === value ? "active" : ""} key={value} onClick={() => setGrams(value)}>{value}g</button>)}<Input type="number" min="1" value={grams} onChange={(event) => setGrams(Number(event.target.value))} /></div><p>{round(scaled.kcal)} kcal · 蛋白质 {round(scaled.protein)}g · 碳水 {round(scaled.carbs)}g · 脂肪 {round(scaled.fat)}g</p><Button onClick={() => void add()}><Plus />加入今日饮食</Button></section>}

    <section className="nutrition-week-card"><h3>本周趋势</h3><div className="nutrition-bars">{week.map((item) => <div key={item.date}><b>{Math.round(item.value).toLocaleString()}</b><div className="nutrition-bar-track"><span style={{ height: `${Math.max(4, item.value / maxWeek * 100)}%` }} data-today={item.date === today()} /></div><small>{item.label}</small></div>)}</div></section>
    <section className="nutrition-advice-card"><h3>今日建议</h3><strong>净摄入 {Math.round(net).toLocaleString()} kcal，目标范围约 {targets.kcal.toLocaleString()} kcal</strong>{suggestions.map((suggestion) => <p key={suggestion}><CheckCircle2 />{suggestion}</p>)}</section>
  </div>;
}
