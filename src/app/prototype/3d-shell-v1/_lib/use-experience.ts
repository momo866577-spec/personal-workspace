"use client";

import { useCallback, useReducer } from "react";
import type { FeatureId, PrimarySpaceId, SpaceId } from "./experience-config";

export interface ExperienceState {
  activeWorld: "personal";
  activeSpace: SpaceId;
  activeFeature: FeatureId | null;
  previousSpace: SpaceId;
  workMode: boolean;
  entrance: "loading" | "ready" | "entered";
}

type Action = { type: "READY" } | { type: "ENTER" } | { type: "GO_HOME" } |
  { type: "ENTER_SPACE"; space: PrimarySpaceId } | { type: "ENTER_FEATURE"; feature: FeatureId } |
  { type: "BACK" };

const initialState: ExperienceState = {
  activeWorld: "personal", activeSpace: "home", activeFeature: null,
  previousSpace: "home", workMode: false, entrance: "loading",
};

function reducer(state: ExperienceState, action: Action): ExperienceState {
  switch (action.type) {
    case "READY": return state.entrance === "loading" ? { ...state, entrance: "ready" } : state;
    case "ENTER": return { ...state, entrance: "entered" };
    case "GO_HOME": return { ...state, activeSpace: "home", activeFeature: null, previousSpace: state.activeSpace, workMode: false };
    case "ENTER_SPACE": return { ...state, previousSpace: state.activeSpace, activeSpace: action.space, activeFeature: null, workMode: false };
    case "ENTER_FEATURE": return { ...state, activeFeature: action.feature, workMode: true };
    case "BACK":
      if (state.workMode || state.activeFeature) return { ...state, activeFeature: null, workMode: false };
      return state.activeSpace === "home" ? state : { ...state, activeSpace: "home", activeFeature: null, workMode: false };
    default: return state;
  }
}

export function useExperience() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const ready = useCallback(() => dispatch({ type: "READY" }), []);
  const enter = useCallback(() => dispatch({ type: "ENTER" }), []);
  const goHome = useCallback(() => dispatch({ type: "GO_HOME" }), []);
  const enterSpace = useCallback((space: PrimarySpaceId) => dispatch({ type: "ENTER_SPACE", space }), []);
  const enterFeature = useCallback((feature: FeatureId) => dispatch({ type: "ENTER_FEATURE", feature }), []);
  const back = useCallback(() => dispatch({ type: "BACK" }), []);
  return { state, ready, enter, goHome, enterSpace, enterFeature, back };
}
