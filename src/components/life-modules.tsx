"use client";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Apple,
  Camera,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Heart,
  MapPin,
  Plane,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { db } from "@/lib/db";
import {
  recognizeFoodCandidates,
  scaleFood,
  searchFoods,
} from "@/lib/nutrition-provider";
import { travelProvider } from "@/lib/travel-provider";
import { today, uid, type NutritionFood, type TravelPlan } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { NutritionPageV2 } from "@/components/nutrition-page-v2";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
const n = (x: number) => Math.round(x * 10) / 10;
export function NutritionPageLegacy() {
  const rows =
      useLiveQuery(
        () => db.nutritionRecords.where("date").equals(today()).toArray(),
        [],
      ) || [],
    workouts =
      useLiveQuery(
        () => db.workouts.where("date").equals(today()).toArray(),
        [],
      ) || [];
  const [q, setQ] = useState(""),
    [foods, setFoods] = useState<NutritionFood[]>([]),
    [selected, setSelected] = useState<NutritionFood | null>(null),
    [grams, setGrams] = useState(100),
    [meal, setMeal] = useState<"早餐" | "午餐" | "晚餐" | "加餐">("午餐"),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const total = rows.reduce(
      (a, x) => ({
        kcal: a.kcal + x.kcal,
        protein: a.protein + x.protein,
        carbs: a.carbs + x.carbs,
        fat: a.fat + x.fat,
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    ),
    burn = workouts.reduce((a, x) => a + Math.max(0, x.minutes * 6), 0),
    scaled = selected ? scaleFood(selected, grams) : null;
  const search = async () => {
    setBusy(true);
    setFoods(await searchFoods(q));
    setBusy(false);
  };
  const recognize = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setNotice("AI 正在辨识可能的食物……");
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const names = await recognizeFoodCandidates(dataUrl);
      if (!names.length) throw new Error("没有辨识到食物");
      setQ(names.join("、"));
      const found = (await Promise.all(names.map(searchFoods))).flat();
      setFoods(Array.from(new Map(found.map((x) => [x.id, x])).values()));
      setNotice(`AI 可能辨识为：${names.join("、")}。请选择正确食物后再计算。`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "图片辨识失败");
    } finally {
      setBusy(false);
    }
  };
  const add = async () => {
    if (!selected || !scaled) return;
    await db.nutritionRecords.add({
      id: uid(),
      date: today(),
      meal,
      foodId: selected.id,
      foodName: selected.name,
      grams,
      kcal: n(scaled.kcal),
      protein: n(scaled.protein),
      carbs: n(scaled.carbs),
      fat: n(scaled.fat),
      source: selected.source,
      notes: "",
      createdAt: new Date().toISOString(),
    });
    setSelected(null);
  };
  return (
    <div className="life-page nutrition-page">
      <header className="life-hero">
        <Apple />
        <div>
          <h2>智慧饮食</h2>
          <p>数据库优先计算，不把每一餐交给 AI 猜测。</p>
        </div>
      </header>
      <section className="macro-grid">
        {[
          ["热量", total.kcal, "kcal", 2100],
          ["蛋白质", total.protein, "g", 100],
          ["碳水", total.carbs, "g", 260],
          ["脂肪", total.fat, "g", 70],
        ].map((x) => (
          <article key={String(x[0])}>
            <small>{x[0]}</small>
            <b>
              {n(Number(x[1]))} <em>{x[2]}</em>
            </b>
            <i>
              <span
                style={{
                  width: `${Math.min(100, (Number(x[1]) / Number(x[3])) * 100)}%`,
                }}
              />
            </i>
          </article>
        ))}
      </section>
      <section className="net-card">
        <span>
          今日摄取 <b>{n(total.kcal)} kcal</b>
        </span>
        <span>
          运动估算消耗 <b>{n(burn)} kcal</b>
        </span>
        <strong>净摄取 {n(total.kcal - burn)} kcal</strong>
      </section>
      <section className="life-card">
        <h3>
          <Search /> 搜索食物
        </h3>
        <div className="food-search">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="鸡胸肉、白饭、牛奶……"
          />
          <Button onClick={search} disabled={busy}>
            {busy ? "搜索中" : "搜索"}
          </Button>
          <label className="camera-button">
            <Camera />
            拍照辨识
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(event) => void recognize(event.target.files?.[0])}
            />
          </label>
        </div>
        {notice && <p className="soft-note">{notice}</p>}
        <div className="food-results">
          {foods.map((food) => (
            <button
              key={food.id}
              className={selected?.id === food.id ? "active" : ""}
              onClick={() => setSelected(food)}
            >
              <b>{food.name}</b>
              <small>{food.brand || food.source}</small>
              <span>{n(food.kcal)} kcal / 100g</span>
            </button>
          ))}
        </div>
        {selected && (
          <div className="food-confirm">
            <b>{selected.name}</b>
            <Select
              value={meal}
              onValueChange={(x) => setMeal(x as typeof meal)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["早餐", "午餐", "晚餐", "加餐"].map((x) => (
                  <SelectItem key={x} value={x}>
                    {x}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="weight-buttons">
              {[50, 100, 150, 200].map((x) => (
                <button
                  key={x}
                  className={grams === x ? "active" : ""}
                  onClick={() => setGrams(x)}
                >
                  {x}g
                </button>
              ))}
              <Input
                type="number"
                min="1"
                value={grams}
                onChange={(e) => setGrams(Number(e.target.value))}
              />
            </div>
            <p>
              {n(scaled!.kcal)} kcal · 蛋白质 {n(scaled!.protein)}g · 碳水{" "}
              {n(scaled!.carbs)}g · 脂肪 {n(scaled!.fat)}g
            </p>
            <Button onClick={add}>
              <Plus />
              加入今日饮食
            </Button>
          </div>
        )}
      </section>
      <section className="life-card">
        <h3>今日记录</h3>
        {rows.length ? (
          rows.map((x) => (
            <article className="food-row" key={x.id}>
              <div>
                <b>{x.foodName}</b>
                <small>
                  {x.meal} · {x.grams}g · {x.source}
                </small>
              </div>
              <span>{x.kcal} kcal</span>
              <button onClick={() => db.nutritionRecords.delete(x.id)}>
                <Trash2 />
              </button>
            </article>
          ))
        ) : (
          <p className="soft-empty">今天还没有饮食记录。</p>
        )}
      </section>
    </div>
  );
}

export function NutritionPage() {
  return <NutritionPageV2 />;
}

export function TravelPage() {
  const plans =
    useLiveQuery(
      () => db.travelPlans.orderBy("updatedAt").reverse().toArray(),
      [],
    ) || [];
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [form, setForm] = useState({
    destination: "",
    startDate: today(),
    days: 3,
    budget: 5000,
    people: 1,
    transport: "公共交通",
  });
  const [dragging, setDragging] = useState<{
    planId: string;
    day: string;
    index: number;
  } | null>(null);
  const create = async () => {
    if (!form.destination) return;
    setBusy(true);
    setError("");
    try {
      const generated = await travelProvider.plan(form);
      const now = new Date().toISOString();
      await db.travelPlans.add({
        id: uid(),
        title: `${form.destination}之旅`,
        ...form,
        status: "planned",
        items: generated.items,
        expenses: {
          accommodation: 0,
          transport: 0,
          food: 0,
          tickets: 0,
          other: 0,
        },
        tips: generated.tips,
        documents: [],
        photos: [],
        createdAt: now,
        updatedAt: now,
      });
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "规划失败");
    } finally {
      setBusy(false);
    }
  };
  const move = async (
    plan: TravelPlan,
    day: string,
    index: number,
    dir: -1 | 1,
  ) => {
    const list = [...(plan.items[day] || [])],
      to = index + dir;
    if (to < 0 || to >= list.length) return;
    [list[index], list[to]] = [list[to], list[index]];
    await db.travelPlans.update(plan.id, {
      items: { ...plan.items, [day]: list },
      updatedAt: new Date().toISOString(),
    });
  };
  const moveTo = async (
    plan: TravelPlan,
    day: string,
    from: number,
    to: number,
  ) => {
    if (from === to) return;
    const list = [...(plan.items[day] || [])];
    const [item] = list.splice(from, 1);
    list.splice(to, 0, item);
    await db.travelPlans.update(plan.id, {
      items: {
        ...plan.items,
        [day]: list.map((entry, order) => ({ ...entry, order })),
      },
      updatedAt: new Date().toISOString(),
    });
  };
  const removeItem = async (plan: TravelPlan, day: string, id: string) => {
    await db.travelPlans.update(plan.id, {
      items: {
        ...plan.items,
        [day]: (plan.items[day] || []).filter((item) => item.id !== id),
      },
      updatedAt: new Date().toISOString(),
    });
  };
  const updateExpense = async (
    plan: TravelPlan,
    key: keyof TravelPlan["expenses"],
    value: number,
  ) => {
    await db.travelPlans.update(plan.id, {
      expenses: { ...plan.expenses, [key]: Math.max(0, value || 0) },
      updatedAt: new Date().toISOString(),
    });
  };
  const addDocument = async (plan: TravelPlan, type: string) => {
    const name = window.prompt(`请输入${type}名称`);
    if (!name?.trim()) return;
    const note = window.prompt("可选：补充编号、地址或备注") || "";
    await db.travelPlans.update(plan.id, {
      documents: [...plan.documents, { type, name: name.trim(), note }],
      updatedAt: new Date().toISOString(),
    });
  };
  const addPhoto = (plan: TravelPlan, file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      await db.travelPlans.update(plan.id, {
        photos: [
          ...plan.photos,
          { name: file.name, data: String(reader.result) },
        ],
        updatedAt: new Date().toISOString(),
      });
    };
    reader.readAsDataURL(file);
  };
  return (
    <div className="life-page travel-page">
      <header className="life-hero">
        <Plane />
        <div>
          <h2>AI 旅行助手</h2>
          <p>每趟旅行都是一个资料夹：行程、预算、文件、备忘与照片集中保存。</p>
        </div>
        <Button onClick={() => setOpen(!open)}>
          <Plus />
          建立旅行
        </Button>
      </header>
      {open && (
        <section className="life-card travel-form">
          <div className="travel-fields">
            <Input
              placeholder="目的地"
              value={form.destination}
              onChange={(e) =>
                setForm({ ...form, destination: e.target.value })
              }
            />
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
            <Input
              type="number"
              min="1"
              value={form.days}
              onChange={(e) =>
                setForm({ ...form, days: Number(e.target.value) })
              }
            />
            <Input
              type="number"
              min="0"
              placeholder="预算"
              value={form.budget}
              onChange={(e) =>
                setForm({ ...form, budget: Number(e.target.value) })
              }
            />
            <Input
              type="number"
              min="1"
              placeholder="人数"
              value={form.people}
              onChange={(e) =>
                setForm({ ...form, people: Number(e.target.value) })
              }
            />
            <Input
              placeholder="交通方式"
              value={form.transport}
              onChange={(e) => setForm({ ...form, transport: e.target.value })}
            />
          </div>
          <Button onClick={create} disabled={busy}>
            {busy ? "AI 正在规划" : "生成完整行程"}
          </Button>
          {error && <p className="phase-status">{error}</p>}
        </section>
      )}
      {plans.map((plan) => (
        <section className="trip-folder" key={plan.id}>
          <header>
            <div>
              <small>
                {plan.startDate} · {plan.days} 天 · {plan.people} 人
              </small>
              <h3>{plan.title}</h3>
              <p>
                预算 ¥{plan.budget} · {plan.transport}
              </p>
            </div>
            <button onClick={() => db.travelPlans.delete(plan.id)}>
              <Trash2 />
            </button>
          </header>
          <div className="budget-strip">
            {Object.entries(plan.expenses).map(([k, v]) => (
              <label key={k}>
                <small>
                  {
                    {
                      accommodation: "住宿",
                      transport: "交通",
                      food: "餐饮",
                      tickets: "门票",
                      other: "其他",
                    }[k]
                  }
                </small>
                <Input
                  aria-label={`${k}预算`}
                  type="number"
                  min="0"
                  value={v}
                  onChange={(event) =>
                    updateExpense(
                      plan,
                      k as keyof TravelPlan["expenses"],
                      Number(event.target.value),
                    )
                  }
                />
              </label>
            ))}
            <strong>
              总计 ¥{Object.values(plan.expenses).reduce((a, b) => a + b, 0)}
            </strong>
          </div>
          {Object.entries(plan.items).map(([day, items]) => (
            <div className="trip-day" key={day}>
              <h4>Day {day}</h4>
              <div className="timeline">
                {items.map((item, index) => (
                  <article
                    key={item.id}
                    draggable
                    onDragStart={() =>
                      setDragging({ planId: plan.id, day, index })
                    }
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (dragging?.planId === plan.id && dragging.day === day)
                        void moveTo(plan, day, dragging.index, index);
                      setDragging(null);
                    }}
                  >
                    <i />
                    <time>
                      {item.time}
                      <small>{item.period}</small>
                    </time>
                    <div>
                      <b>{item.name}</b>
                      <p>
                        {item.category} · 建议停留 {item.duration} 分钟
                      </p>
                      <small>{item.address}</small>
                      <nav>
                        <a
                          target="_blank"
                          rel="noreferrer"
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address || item.name)}`}
                        >
                          <MapPin />
                          Google Maps
                        </a>
                        <a
                          target="_blank"
                          rel="noreferrer"
                          href={`https://maps.apple.com/?q=${encodeURIComponent(item.address || item.name)}`}
                        >
                          Apple Maps
                          <ExternalLink />
                        </a>
                      </nav>
                    </div>
                    <button
                      onClick={() =>
                        db.travelPlans.update(plan.id, {
                          items: {
                            ...plan.items,
                            [day]: items.map((x) =>
                              x.id === item.id
                                ? { ...x, favorite: !x.favorite }
                                : x,
                            ),
                          },
                        })
                      }
                    >
                      <Heart fill={item.favorite ? "currentColor" : "none"} />
                    </button>
                    <span className="order-buttons">
                      <button onClick={() => move(plan, day, index, -1)}>
                        <ChevronUp />
                      </button>
                      <button onClick={() => move(plan, day, index, 1)}>
                        <ChevronDown />
                      </button>
                      <button
                        aria-label="删除景点"
                        onClick={() => removeItem(plan, day, item.id)}
                      >
                        <Trash2 />
                      </button>
                    </span>
                  </article>
                ))}
              </div>
            </div>
          ))}
          <footer>
            <b>AI 建议</b>
            {plan.tips.map((x) => (
              <span key={x}>{x}</span>
            ))}
          </footer>
          <section className="travel-assets">
            <header>
              <div>
                <b>旅行资料夹</b>
                <small>行程、机票、饭店、备忘录与打卡照片集中保存</small>
              </div>
              <nav>
                {["机票", "饭店", "备忘录"].map((type) => (
                  <button key={type} onClick={() => addDocument(plan, type)}>
                    <Plus /> {type}
                  </button>
                ))}
                <label>
                  <Camera /> 打卡照片
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      addPhoto(plan, event.target.files?.[0])
                    }
                  />
                </label>
              </nav>
            </header>
            <div className="travel-asset-grid">
              {plan.documents.map((document, index) => (
                <article key={`${document.type}-${document.name}-${index}`}>
                  <small>{document.type}</small>
                  <b>{document.name}</b>
                  <p>{document.note}</p>
                </article>
              ))}
              {plan.photos.map((photo, index) => (
                <figure key={`${photo.name}-${index}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.data} alt={photo.name} />
                  <figcaption>{photo.name}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        </section>
      ))}
    </div>
  );
}

export function NutritionDashboardCard({ open }: { open: () => void }) {
  const rows =
    useLiveQuery(
      () => db.nutritionRecords.where("date").equals(today()).toArray(),
      [],
    ) || [];
  const workouts =
    useLiveQuery(
      () => db.workouts.where("date").equals(today()).toArray(),
      [],
    ) || [];
  const kcal = rows.reduce((a, x) => a + x.kcal, 0),
    protein = rows.reduce((a, x) => a + x.protein, 0),
    carbs = rows.reduce((a, x) => a + x.carbs, 0),
    fat = rows.reduce((a, x) => a + x.fat, 0),
    burn = workouts.reduce((a, x) => a + x.minutes * 6, 0);
  return (
    <section className="glass-panel nutrition-home-card">
      <header>
        <Apple />
        <h2>今日饮食</h2>
        <button onClick={open}>记录</button>
      </header>
      <strong>
        {n(kcal - burn)} <small>kcal 净摄取</small>
      </strong>
      <div>
        <span>蛋白质 {n(protein)}g</span>
        <span>碳水 {n(carbs)}g</span>
        <span>脂肪 {n(fat)}g</span>
      </div>
    </section>
  );
}
