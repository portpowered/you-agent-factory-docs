"use client";

import { PREFERS_REDUCED_MOTION_MEDIA_QUERY } from "@/lib/media-preferences";
import { useSyncExternalStore } from "react";

function getReducedMotionSnapshot(): boolean {
  return window.matchMedia(PREFERS_REDUCED_MOTION_MEDIA_QUERY).matches;
}

function subscribeToReducedMotionChanges(
  onStoreChange: () => void,
): () => void {
  const query = window.matchMedia(PREFERS_REDUCED_MOTION_MEDIA_QUERY);

  const handleChange = () => {
    onStoreChange();
  };

  query.addEventListener("change", handleChange);

  return () => {
    query.removeEventListener("change", handleChange);
  };
}

/** SSR-safe reduced-motion preference for shell transitions and disclosure behavior. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToReducedMotionChanges,
    getReducedMotionSnapshot,
    () => false,
  );
}
