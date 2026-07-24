/**
 * Near-viewport activation gate for the Youi compact goal replay island.
 *
 * Owns a literal dynamic import of `./YouiCompactGoalReplayIsland` (static
 * path string — not an expression-built specifier). Until the showcase is
 * near/intersecting the viewport, this gate mounts nothing so the SSR
 * semantic/static graph fallback remains the visible foreground.
 */

"use client";

import {
  type ComponentType,
  type ReactElement,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import type { YouiCompactGoalReplayIslandProps } from "./YouiCompactGoalReplayIsland";

export const YOUI_COMPACT_GOAL_REPLAY_NEAR_VIEWPORT_ROOT_MARGIN = "200px 0px";
export const YOUI_COMPACT_GOAL_REPLAY_NEAR_VIEWPORT_THRESHOLD = 0;

type IslandComponent = ComponentType<YouiCompactGoalReplayIslandProps>;

export type YouiCompactGoalReplayNearViewportProps =
  YouiCompactGoalReplayIslandProps & {
    /**
     * Skip IntersectionObserver and load the island on mount.
     * Intended for tests / harnesses that already control visibility.
     */
    readonly activateOnMount?: boolean;
    /** IntersectionObserver rootMargin; defaults to a near-viewport margin. */
    readonly rootMargin?: string;
    /** IntersectionObserver threshold; defaults to 0. */
    readonly threshold?: number;
  };

/**
 * Intersection-gated loader for the compact goal replay client module.
 *
 * Before activation: empty host (SSR/static fallback stays visible).
 * After near-viewport activation: mounts shared compact goal replay island.
 */
export function YouiCompactGoalReplayNearViewport({
  activateOnMount = false,
  rootMargin = YOUI_COMPACT_GOAL_REPLAY_NEAR_VIEWPORT_ROOT_MARGIN,
  threshold = YOUI_COMPACT_GOAL_REPLAY_NEAR_VIEWPORT_THRESHOLD,
  className,
  bindDomGates,
}: YouiCompactGoalReplayNearViewportProps): ReactElement {
  const hostRef = useRef<HTMLDivElement>(null);
  const [Island, setIsland] = useState<IslandComponent | null>(null);

  useEffect(() => {
    let cancelled = false;
    let observer: IntersectionObserver | null = null;

    const activate = () => {
      // Literal module specifier — required for static-export bundler edges.
      void import("./YouiCompactGoalReplayIsland").then((mod) => {
        if (cancelled) return;
        setIsland(() => mod.YouiCompactGoalReplayIsland);
      });
    };

    if (activateOnMount) {
      activate();
      return () => {
        cancelled = true;
      };
    }

    const node = hostRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      return () => {
        cancelled = true;
      };
    }

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer?.disconnect();
          observer = null;
          activate();
          break;
        }
      },
      { rootMargin, threshold },
    );
    observer.observe(node);

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [activateOnMount, rootMargin, threshold]);

  const activated = Island != null;

  return (
    <div
      ref={hostRef}
      className={cn(
        "absolute inset-0 z-10",
        !activated && "pointer-events-none",
        className,
      )}
      data-youi-compact-goal-replay-activated={activated ? "true" : "false"}
      data-youi-compact-goal-replay-near-viewport=""
    >
      {Island ? <Island bindDomGates={bindDomGates} /> : null}
    </div>
  );
}
