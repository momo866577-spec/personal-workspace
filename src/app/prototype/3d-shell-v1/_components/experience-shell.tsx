"use client";

import dynamic from "next/dynamic";
import {
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  CornerUpLeft,
  Map,
  Mouse,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "../experience.module.css";
import { ANCHORS, MOTION, PLANNING_FEATURES, type AnchorId } from "../_lib/experience-config";
import { useExperience } from "../_lib/use-experience";
import { DailyPlanPanel } from "./daily-plan-panel";

const WorldCanvas = dynamic(
  () => import("./world-canvas").then((module) => module.WorldCanvas),
  { ssr: false },
);

export function ExperienceShell() {
  const { state, ready, enter, goToAnchor, enterPlanning, enterFeature, back } = useExperience();
  const [quickJumpOpen, setQuickJumpOpen] = useState(false);
  const [featureNote, setFeatureNote] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [documentVisible, setDocumentVisible] = useState(true);
  const gestureLockedUntil = useRef(0);
  const pointerStart = useRef<number | null>(null);
  const activeAnchor = ANCHORS.find((anchor) => anchor.id === state.activeAnchor) ?? ANCHORS[0];
  const activeIndex = activeAnchor.index;

  useEffect(() => {
    const timer = window.setTimeout(ready, 650);
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileQuery = window.matchMedia("(max-width: 720px)");
    const updateMotion = () => setReducedMotion(motionQuery.matches);
    const updateMobile = () => setMobile(mobileQuery.matches);
    const updateVisibility = () => setDocumentVisible(document.visibilityState === "visible");
    updateMotion();
    updateMobile();
    motionQuery.addEventListener("change", updateMotion);
    mobileQuery.addEventListener("change", updateMobile);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      window.clearTimeout(timer);
      motionQuery.removeEventListener("change", updateMotion);
      mobileQuery.removeEventListener("change", updateMobile);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, [ready]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setQuickJumpOpen(false);
        back();
      }
      if (state.entrance !== "entered" || state.activeSpace !== "main" || state.workMode) return;
      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault();
        const next = ANCHORS[Math.min(ANCHORS.length - 1, activeIndex + 1)];
        goToAnchor(next.id);
      }
      if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        const previous = ANCHORS[Math.max(0, activeIndex - 1)];
        goToAnchor(previous.id);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, back, goToAnchor, state.activeSpace, state.entrance, state.workMode]);

  const moveBy = useCallback(
    (direction: 1 | -1) => {
      if (state.activeSpace !== "main" || state.workMode || state.entrance !== "entered") return;
      const now = Date.now();
      if (now < gestureLockedUntil.current) return;
      const nextIndex = Math.max(0, Math.min(ANCHORS.length - 1, activeIndex + direction));
      if (nextIndex === activeIndex) return;
      gestureLockedUntil.current = now + (reducedMotion ? 340 : MOTION.gestureLockMs);
      goToAnchor(ANCHORS[nextIndex].id);
    }, [activeIndex, goToAnchor, reducedMotion, state.activeSpace, state.entrance, state.workMode],
  );

  const handleFeatureSelect = useCallback(
    (featureId: (typeof PLANNING_FEATURES)[number]["id"]) => {
      if (featureId === "daily-plan") {
        enterFeature(featureId);
        return;
      }
      const feature = PLANNING_FEATURES.find((item) => item.id === featureId);
      setFeatureNote(`${feature?.title ?? "此功能"}將在下一版接上正式內容。`);
      window.setTimeout(() => setFeatureNote(null), 2400);
    },
    [enterFeature],
  );

  const anchorLabel = useMemo(
    () => `${String(activeIndex + 1).padStart(2, "0")} / ${String(ANCHORS.length).padStart(2, "0")}`,
    [activeIndex],
  );

  function jump(anchor: AnchorId) {
    goToAnchor(anchor);
    setQuickJumpOpen(false);
  }

  return (
    <main
      className={`${styles.shell} ${state.workMode ? styles.workMode : ""}`}
      onWheel={(event) => {
        if (state.workMode || state.activeSpace !== "main") return;
        if (Math.abs(event.deltaY) < MOTION.wheelThreshold) return;
        moveBy(event.deltaY > 0 ? 1 : -1);
      }}
      onPointerDown={(event) => {
        if (state.workMode) return;
        if (!mobile && event.pointerType !== "touch") return;
        pointerStart.current = event.clientY;
      }}
      onPointerUp={(event) => {
        if (state.workMode || pointerStart.current === null) return;
        const delta = pointerStart.current - event.clientY;
        pointerStart.current = null;
        if (Math.abs(delta) >= MOTION.swipeThreshold) moveBy(delta > 0 ? 1 : -1);
      }}
      data-anchor={state.activeAnchor}
      data-space={state.activeSpace}
      data-work-mode={state.workMode}
    >
      <div className={`${styles.canvasLayer} ${state.workMode ? styles.canvasSubdued : ""}`}>
        <WorldCanvas
          activeAnchor={state.activeAnchor}
          activeSpace={state.activeSpace}
          activeFeature={state.activeFeature}
          workMode={state.workMode}
          reducedMotion={reducedMotion}
          mobile={mobile}
          visible={documentVisible}
          onAnchorSelect={goToAnchor}
          onEnterPlanning={enterPlanning}
          onFeatureSelect={handleFeatureSelect}
        />
      </div>

      {state.entrance !== "entered" && (
        <section className={`${styles.entrance} ${state.entrance === "ready" ? styles.entranceReady : ""}`}>
          <div className={styles.entranceMark} aria-hidden="true">
            <span />
            <i />
          </div>
          <p>PERSONAL SPACE</p>
          <h1>讓生活與工作，<br />回到同一個空間。</h1>
          {state.entrance === "loading" ? (
            <div className={styles.loadingLine}>
              <span />
              Loading space
            </div>
          ) : (
            <button className={styles.enterButton} onClick={enter}>
              <span>Enter Workspace</span>
              <ArrowDown />
            </button>
          )}
          <small>3D INTERACTIVE UX SHELL · V1</small>
        </section>
      )}

      {state.entrance === "entered" && !state.workMode && (
        <>
          <header className={styles.topBar}>
            <div className={styles.brand}>
              <span className={styles.brandMark}><i /></span>
              <div>
                <strong>PERSONAL SPACE</strong>
                <small>GUIDED WORKSPACE</small>
              </div>
            </div>
            {state.activeSpace === "planning" && (
              <button className={styles.backButton} onClick={back} data-testid="space-back">
                <CornerUpLeft />
                <span>回到主世界</span>
              </button>
            )}
          </header>

          {state.activeSpace === "main" ? (
            <section className={styles.anchorStory} aria-live="polite">
              <span className={styles.kicker}>{activeAnchor.eyebrow}</span>
              <activeAnchor.icon className={styles.storyIcon} aria-hidden="true" />
              <h1>{activeAnchor.title}</h1>
              <p>{activeAnchor.description}</p>
              {activeAnchor.id === "planning" ? (
                <button className={styles.primaryAction} onClick={enterPlanning} data-testid="enter-planning">
                  <span>進入 Planning 空間</span>
                  <ChevronRight />
                </button>
              ) : (
                <div className={styles.scrollHint}>
                  <Mouse />
                  <span>{mobile ? "向上滑動，前往下一站" : "滾動，前往下一站"}</span>
                </div>
              )}
            </section>
          ) : (
            <section className={styles.planningOverlay}>
              <div className={styles.spaceHeading}>
                <span className={styles.kicker}>PLANNING SPACE</span>
                <h1>把今天放回手上。</h1>
                <p>選一個工作裝置，讓空間慢慢退到身後。</p>
              </div>
              <div className={styles.featureRail}>
                {PLANNING_FEATURES.map((feature, index) => (
                  <button
                    key={feature.id}
                    className={`${styles.featureButton} ${index === 0 ? styles.featurePrimary : ""}`}
                    onClick={() => handleFeatureSelect(feature.id)}
                    data-testid={feature.id === "daily-plan" ? "open-daily-plan" : undefined}
                  >
                    <feature.icon />
                    <span>
                      <small>{feature.label}</small>
                      <strong>{feature.title}</strong>
                      <em>{feature.description}</em>
                    </span>
                    <ChevronRight />
                  </button>
                ))}
              </div>
            </section>
          )}

          {state.activeSpace === "main" && (
            <nav className={styles.anchorProgress} aria-label="空間進度">
              <button onClick={() => moveBy(-1)} disabled={activeIndex === 0} aria-label="上一站">
                <ChevronLeft />
              </button>
              <div>
                <span>{anchorLabel}</span>
                <div>
                  {ANCHORS.map((anchor) => (
                    <button
                      key={anchor.id}
                      aria-label={`前往 ${anchor.title}`}
                      className={anchor.id === state.activeAnchor ? styles.progressActive : ""}
                      onClick={() => jump(anchor.id)}
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={() => moveBy(1)}
                disabled={activeIndex === ANCHORS.length - 1}
                aria-label="下一站"
              >
                <ChevronRight />
              </button>
            </nav>
          )}

          <button
            className={styles.quickTrigger}
            onClick={() => setQuickJumpOpen((open) => !open)}
            aria-label="Quick Jump"
            aria-expanded={quickJumpOpen}
            aria-controls="quick-jump-menu"
          >
            <Map />
            <span>Quick Jump</span>
          </button>

          {quickJumpOpen && (
            <aside className={styles.quickMenu} id="quick-jump-menu">
              <header>
                <div>
                  <span className={styles.kicker}>QUICK JUMP</span>
                  <strong>直接前往</strong>
                </div>
                <button onClick={() => setQuickJumpOpen(false)} aria-label="關閉 Quick Jump">
                  <X />
                </button>
              </header>
              <div>
                {ANCHORS.map((anchor) => (
                  <button
                    key={anchor.id}
                    className={anchor.id === state.activeAnchor ? styles.quickActive : ""}
                    onClick={() => jump(anchor.id)}
                  >
                    <anchor.icon />
                    <span>{anchor.title}</span>
                    <small>{String(anchor.index + 1).padStart(2, "0")}</small>
                  </button>
                ))}
              </div>
            </aside>
          )}

          {featureNote && <div className={styles.toast}><Sparkles />{featureNote}</div>}
        </>
      )}

      {state.workMode && <DailyPlanPanel onBack={back} />}
    </main>
  );
}
