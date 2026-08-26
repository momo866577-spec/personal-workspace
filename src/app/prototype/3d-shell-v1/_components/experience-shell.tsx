"use client";

import dynamic from "next/dynamic";
import {
  ArrowDown, ArrowLeft, ArrowRight, Bell, CalendarDays, Check, ChevronRight,
  Clock3, Home, Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "../experience.module.css";
import {
  HOME_FEATURES, MOTION, SPACES, SPACE_ORDER,
} from "../_lib/experience-config";
import { useExperience } from "../_lib/use-experience";
import { DailyPlanPanel } from "./daily-plan-panel";
import { FeatureDetailPanel } from "./feature-detail-panel";

const WorldCanvas = dynamic(() => import("./world-canvas").then((module) => module.WorldCanvas), { ssr: false });

const TODAY_TASKS = [
  { time: "09:30", title: "回覆合作信件", done: true },
  { time: "11:00", title: "英語聽力 15 分鐘", done: true },
  { time: "14:00", title: "專案頁面校對", done: false },
  { time: "17:30", title: "河濱快走", done: false },
] as const;

export function ExperienceShell() {
  const { state, ready, enter, goHome, enterSpace, enterFeature, back } = useExperience();
  const [now, setNow] = useState<Date | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [documentVisible, setDocumentVisible] = useState(true);
  const gestureLockedUntil = useRef(0);
  const pointerStart = useRef<{ x: number; time: number } | null>(null);
  const activeDefinition = SPACES.find((space) => space.id === state.activeSpace) ?? null;
  const activeIndex = activeDefinition?.index ?? -1;

  useEffect(() => {
    const readyTimer = window.setTimeout(ready, 580);
    const initialClockTimer = window.setTimeout(() => setNow(new Date()), 0);
    const clockTimer = window.setInterval(() => setNow(new Date()), 1000);
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileQuery = window.matchMedia("(max-width: 720px)");
    const updateMotion = () => setReducedMotion(motionQuery.matches);
    const updateMobile = () => setMobile(mobileQuery.matches);
    const updateVisibility = () => setDocumentVisible(document.visibilityState === "visible");
    updateMotion(); updateMobile(); updateVisibility();
    motionQuery.addEventListener("change", updateMotion);
    mobileQuery.addEventListener("change", updateMobile);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      window.clearTimeout(readyTimer); window.clearTimeout(initialClockTimer); window.clearInterval(clockTimer);
      motionQuery.removeEventListener("change", updateMotion);
      mobileQuery.removeEventListener("change", updateMobile);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, [ready]);

  const moveBy = useCallback((direction: 1 | -1) => {
    if (state.activeSpace === "home" || state.workMode || state.entrance !== "entered") return;
    const moment = Date.now();
    if (moment < gestureLockedUntil.current) return;
    const nextIndex = Math.max(0, Math.min(SPACE_ORDER.length - 1, activeIndex + direction));
    if (nextIndex === activeIndex) return;
    gestureLockedUntil.current = moment + (reducedMotion ? 300 : MOTION.gestureLockMs);
    enterSpace(SPACE_ORDER[nextIndex]);
  }, [activeIndex, enterSpace, reducedMotion, state.activeSpace, state.entrance, state.workMode]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { back(); return; }
      if (state.entrance !== "entered" || state.workMode) return;
      if (event.key === "Home") { event.preventDefault(); goHome(); return; }
      if (event.key === "ArrowRight") { event.preventDefault(); moveBy(1); }
      if (event.key === "ArrowLeft") { event.preventDefault(); moveBy(-1); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [back, goHome, moveBy, state.entrance, state.workMode]);

  const dateText = useMemo(() => now?.toLocaleDateString("zh-TW", { month: "long", day: "numeric", weekday: "long" }) ?? "載入今日資訊", [now]);
  const timeText = useMemo(() => now?.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false }) ?? "--:--", [now]);

  return (
    <main
      className={`${styles.shell} ${state.activeSpace === "home" ? styles.homeMode : styles.spaceMode} ${state.workMode ? styles.workMode : ""}`}
      onWheel={(event) => {
        if (state.workMode || state.activeSpace === "home") return;
        const intent = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.shiftKey ? event.deltaY : 0;
        if (Math.abs(intent) >= MOTION.wheelThreshold) moveBy(intent > 0 ? 1 : -1);
      }}
      onPointerDown={(event) => {
        if (state.workMode || state.activeSpace === "home") return;
        if (event.pointerType === "mouse" && event.button !== 0) return;
        pointerStart.current = { x: event.clientX, time: performance.now() };
      }}
      onPointerUp={(event) => {
        if (state.workMode || !pointerStart.current || state.activeSpace === "home") return;
        const delta = pointerStart.current.x - event.clientX;
        const elapsed = Math.max(1, performance.now() - pointerStart.current.time);
        const velocity = Math.abs(delta) / elapsed;
        pointerStart.current = null;
        if (Math.abs(delta) >= MOTION.swipeThreshold || (Math.abs(delta) >= 24 && velocity >= MOTION.swipeVelocity)) moveBy(delta > 0 ? 1 : -1);
      }}
      onPointerCancel={() => { pointerStart.current = null; }}
      data-space={state.activeSpace}
      data-work-mode={state.workMode}
    >
      <div className={`${styles.canvasLayer} ${state.workMode ? styles.canvasSubdued : ""}`}>
        <WorldCanvas activeSpace={state.activeSpace} workMode={state.workMode} reducedMotion={reducedMotion} mobile={mobile} visible={documentVisible} onSpaceSelect={enterSpace} />
      </div>

      {state.entrance !== "entered" && (
        <section className={`${styles.entrance} ${state.entrance === "ready" ? styles.entranceReady : ""}`}>
          <div className={styles.entranceMark} aria-hidden="true"><span /><i /></div>
          <p>PERSONAL WORKSPACE · V2</p>
          <h1>今天要處理的事，<br />都在同一個空間。</h1>
          {state.entrance === "loading" ? <div className={styles.loadingLine}><span />Loading home</div> : (
            <button className={styles.enterButton} onClick={enter} data-testid="enter-workspace"><span>進入 3D 總控首頁</span><ArrowDown /></button>
          )}
          <small>HOME · SIX SPACES · DIRECT ACCESS</small>
        </section>
      )}

      {state.entrance === "entered" && !state.workMode && (
        <>
          <header className={styles.topBar}>
            <div className={styles.brand}><span className={styles.brandMark}><i /></span><div><strong>PERSONAL SPACE</strong><small>3D CONTROL HOME</small></div></div>
            {state.activeSpace !== "home" && <button className={styles.homeButton} onClick={goHome} data-testid="go-home"><Home /><span>HOME</span></button>}
          </header>

          {state.activeSpace === "home" ? (
            <section className={styles.homeDashboard} aria-label="3D 個人工作台總控首頁">
              <div className={styles.todayHero}>
                <span className={styles.kicker}>TODAY · PERSONAL CONTROL</span>
                <div className={styles.dateLine}><span>{dateText}</span><strong>{timeText}</strong></div>
                <h1>王先生，<br />今天走到 <em>57%</em>。</h1>
                <p><Sparkles /> 下午專注處理專案，傍晚留給身體。</p>
                <div className={styles.progressBar}><i /></div>
              </div>

              <div className={styles.todayFlow}>
                <header><span><Clock3 /> 今天 4 件事</span><button onClick={() => enterSpace("planning")}>完整計畫 <ChevronRight /></button></header>
                <div>
                  {TODAY_TASKS.map((task) => <button key={task.time} onClick={() => enterSpace(task.title.includes("英語") ? "learning" : task.title.includes("快走") ? "exercise" : "planning")}><span className={task.done ? styles.taskDone : ""}>{task.done ? <Check /> : null}</span><time>{task.time}</time><strong>{task.title}</strong></button>)}
                </div>
              </div>

              <div className={styles.infoRibbon}>
                <button onClick={() => enterSpace("planning")}><CalendarDays /><span><small>下一個行程</small><strong>14:00 專案校對</strong><em>本週共 8 個行程</em></span></button>
                <button onClick={() => enterSpace("planning")}><Bell /><span><small>通知摘要</small><strong>3 則待查看</strong><em>1 則需要今天回覆</em></span></button>
              </div>

              <nav className={styles.portalField} aria-label="全部功能入口">
                <header><span className={styles.kicker}>ALL PORTALS</span><strong>直接前往</strong></header>
                <div>
                  {HOME_FEATURES.map((feature, index) => <button key={feature.id} onClick={() => enterSpace(feature.target)} style={{ "--portal-tone": feature.tone, "--portal-index": index } as React.CSSProperties} data-testid={`portal-${feature.id}`}><feature.icon /><span>{feature.title}</span><ChevronRight /></button>)}
                </div>
              </nav>
            </section>
          ) : activeDefinition ? (
            <section className={styles.spaceOverlay} style={{ "--space-accent": activeDefinition.accent, "--space-secondary": activeDefinition.accentSecondary } as React.CSSProperties}>
              <div className={styles.spaceHeading}>
                <span className={styles.kicker}>{activeDefinition.eyebrow}</span>
                <activeDefinition.icon className={styles.spaceIcon} />
                <h1>{activeDefinition.zhTitle}</h1>
                <p>{activeDefinition.description}</p>
                <button className={styles.primaryAction} onClick={() => enterFeature(activeDefinition.detailFeature)} data-testid={`open-${activeDefinition.detailFeature}`}><span>{activeDefinition.detailLabel}</span><ChevronRight /></button>
              </div>
              <div className={styles.spaceSummary}>
                <div className={styles.metricOrb}><strong>{activeDefinition.metric}</strong><span>{activeDefinition.metricLabel}</span></div>
                <div>{activeDefinition.summary.map((item, index) => <button key={item} onClick={() => enterFeature(activeDefinition.detailFeature)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong><ChevronRight /></button>)}</div>
              </div>
            </section>
          ) : null}

          {activeDefinition && (
            <nav className={styles.spaceNavigator} aria-label="功能空間切換">
              <button onClick={() => moveBy(-1)} disabled={activeIndex === 0} aria-label="上一個空間"><ArrowLeft /></button>
              <div><span>{activeIndex + 1} / {SPACES.length}</span>{SPACES.map((space) => <button key={space.id} className={space.id === state.activeSpace ? styles.spaceActive : ""} onClick={() => enterSpace(space.id)} aria-label={`前往${space.zhTitle}`} />)}</div>
              <button onClick={() => moveBy(1)} disabled={activeIndex === SPACES.length - 1} aria-label="下一個空間"><ArrowRight /></button>
              <small>{mobile ? "左右滑動切換空間" : "水平滑動／拖曳／方向鍵切換"}</small>
            </nav>
          )}
        </>
      )}

      {state.workMode && state.activeFeature === "daily-plan" && <DailyPlanPanel onBack={back} />}
      {state.workMode && state.activeFeature && state.activeSpace !== "home" && state.activeSpace !== "planning" && (
        <FeatureDetailPanel space={state.activeSpace} feature={state.activeFeature} onBack={back} />
      )}
    </main>
  );
}
