"use client";

import { Check, ChevronLeft, Clock3, Edit3, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import styles from "../experience.module.css";

interface Task {
  id: number;
  time: string;
  title: string;
  complete: boolean;
}

const STARTER_TASKS: Task[] = [
  { id: 1, time: "09:00", title: "英語學習", complete: true },
  { id: 2, time: "11:00", title: "工作事項", complete: false },
  { id: 3, time: "15:00", title: "運動", complete: false },
  { id: 4, time: "20:00", title: "直播復盤", complete: false },
];

export function DailyPlanPanel({ onBack }: { onBack: () => void }) {
  const [tasks, setTasks] = useState<Task[]>(STARTER_TASKS);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("18:00");
  const [editingId, setEditingId] = useState<number | null>(null);
  const completed = tasks.filter((task) => task.complete).length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("zh-TW", {
        month: "long",
        day: "numeric",
        weekday: "long",
      }).format(new Date()),
    [],
  );

  function addTask() {
    const title = newTitle.trim();
    if (!title) return;
    setTasks((current) => [
      ...current,
      { id: Date.now(), time: newTime, title, complete: false },
    ]);
    setNewTitle("");
    setAdding(false);
  }

  return (
    <section className={styles.workLayer} aria-label="今日計畫工作模式" data-testid="daily-plan-panel">
      <div className={styles.workBackdrop} />
      <article className={styles.planPanel}>
        <header className={styles.planHeader}>
          <button className={styles.iconButton} onClick={onBack} aria-label="返回 Planning 空間">
            <ChevronLeft />
          </button>
          <div>
            <span className={styles.kicker}>PLANNING SPACE · WORK MODE</span>
            <h1>今日計畫</h1>
            <p>{dateLabel}</p>
          </div>
          <div className={styles.progressSeal} aria-label={`今日進度 ${progress}%`}>
            <strong>{progress}%</strong>
            <span>{completed}/{tasks.length}</span>
          </div>
        </header>

        <div className={styles.progressTrack} aria-hidden="true">
          <i style={{ width: `${progress}%` }} />
        </div>

        <div className={styles.planIntro}>
          <p>今天不需要一次完成所有事。</p>
          <span>先把下一件做好。</span>
        </div>

        <div className={styles.taskList}>
          {tasks.map((task) => {
            const editing = editingId === task.id;
            return (
              <div
                className={`${styles.taskRow} ${task.complete ? styles.taskComplete : ""}`}
                key={task.id}
              >
                <button
                  className={styles.checkButton}
                  aria-label={task.complete ? `取消完成 ${task.title}` : `完成 ${task.title}`}
                  aria-pressed={task.complete}
                  onClick={() =>
                    setTasks((current) =>
                      current.map((item) =>
                        item.id === task.id ? { ...item, complete: !item.complete } : item,
                      ),
                    )
                  }
                >
                  {task.complete && <Check />}
                </button>
                <time>{task.time}</time>
                {editing ? (
                  <input
                    autoFocus
                    className={styles.inlineEdit}
                    value={task.title}
                    onChange={(event) =>
                      setTasks((current) =>
                        current.map((item) =>
                          item.id === task.id ? { ...item, title: event.target.value } : item,
                        ),
                      )
                    }
                    onBlur={() => setEditingId(null)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") setEditingId(null);
                    }}
                    aria-label="編輯任務名稱"
                  />
                ) : (
                  <button className={styles.taskTitle} onClick={() => setEditingId(task.id)}>
                    {task.title}
                  </button>
                )}
                <button
                  className={styles.editButton}
                  onClick={() => setEditingId(editing ? null : task.id)}
                  aria-label={`編輯 ${task.title}`}
                >
                  <Edit3 />
                </button>
              </div>
            );
          })}
        </div>

        {adding ? (
          <form
            className={styles.addForm}
            onSubmit={(event) => {
              event.preventDefault();
              addTask();
            }}
          >
            <label>
              <span>時間</span>
              <input type="time" value={newTime} onChange={(event) => setNewTime(event.target.value)} />
            </label>
            <label className={styles.addTitleField}>
              <span>要做什麼？</span>
              <input
                autoFocus
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder="輸入一件清楚的小事"
              />
            </label>
            <button type="button" className={styles.formCancel} onClick={() => setAdding(false)}>
              <X />
              取消
            </button>
            <button type="submit" className={styles.formSubmit} disabled={!newTitle.trim()}>
              <Check />
              加入
            </button>
          </form>
        ) : (
          <button className={styles.addTaskButton} onClick={() => setAdding(true)}>
            <Plus />
            新增今天的任務
          </button>
        )}

        <footer className={styles.planFooter}>
          <Clock3 />
          <span>此頁為 Demo，變更只保留在本次瀏覽。</span>
        </footer>
      </article>
    </section>
  );
}
