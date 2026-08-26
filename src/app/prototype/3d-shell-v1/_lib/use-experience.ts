"use client";

import { useCallback, useReducer } from "react";
import type { AnchorId, FeatureId, SpaceId } from "./experience-config";

export interface ExperienceState {
  activeWorld: "personal";
  activeSpace: SpaceId;
  activeAnchor: AnchorId;
  activeFeature: FeatureId | null;
  previousAnchor: AnchorId;
  workMode: boolean;
  entrance: "loading" | "ready" | "entered";
}

type Action =
  | { type: "READY" }
  | { type: "ENTER" }
  | { type: "GO_ANCHOR"; anchor: AnchorId }
  | { type: "ENTER_PLANNING" }
  | { type: "ENTER_FEATURE"; feature: FeatureId }
  | { type: "BACK" };

const initialState: ExperienceState = {
  activeWorld: "personal",
  activeSpace: "main",
  activeAnchor: "today",
  activeFeature: null,
  previousAnchor: "today",
  workMode: false,
  entrance: "loading",
};

function reducer(state: ExperienceState, action: Action): ExperienceState {
  switch (action.type) {
    case "READY":
      return state.entrance === "loading" ? { ...state, entrance: "ready" } : state;
    case "ENTER":
      return { ...state, entrance: "entered" };
    case "GO_ANCHOR":
      return {
        ...state,
        activeSpace: "main",
        activeFeature: null,
        previousAnchor: state.activeAnchor,
        activeAnchor: action.anchor,
        workMode: false,
      };
    case "ENTER_PLANNING":
      if (state.activeAnchor !== "planning") return state;
      return {
        ...state,
        activeSpace: "planning",
        activeFeature: null,
        previousAnchor: "planning",
        workMode: false,
      };
    case "ENTER_FEATURE":
      return {
        ...state,
        activeSpace: "planning",
        activeFeature: action.feature,
        workMode: action.feature === "daily-plan",
      };
    case "BACK":
      if (state.workMode || state.activeFeature) {
        return { ...state, activeFeature: null, workMode: false };
      }
      if (state.activeSpace === "planning") {
        return {
          ...state,
          activeSpace: "main",
          activeAnchor: "planning",
          previousAnchor: "planning",
        };
      }
      return state;
    default:
      return state;
  }
}

export function useExperience() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const ready = useCallback(() => dispatch({ type: "READY" }), []);
  const enter = useCallback(() => dispatch({ type: "ENTER" }), []);
  const goToAnchor = useCallback(
    (anchor: AnchorId) => dispatch({ type: "GO_ANCHOR", anchor }),
    [],
  );
  const enterPlanning = useCallback(() => dispatch({ type: "ENTER_PLANNING" }), []);
  const enterFeature = useCallback(
    (feature: FeatureId) => dispatch({ type: "ENTER_FEATURE", feature }),
    [],
  );
  const back = useCallback(() => dispatch({ type: "BACK" }), []);

  return { state, ready, enter, goToAnchor, enterPlanning, enterFeature, back };
}
