/**
 * Host-controlled factory-replay React hook: pure playback transitions,
 * projection cache, single chained autoplay, and visibility/intersection/
 * reduced-motion gates. Full-mode composition owns the selected tick.
 *
 * Autoplay IO (scheduler + gate session) is owned inside a mount effect and
 * nulled on cleanup so React Strict Mode remount creates fresh instances —
 * never reuse a disposed scheduler/session from a render-time lazy ref.
 */

"use client";

import type { FactoryRecording } from "@you-agent-factory/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  bindAutoplayGateDom,
  createAutoplayGateSession,
  shouldStartPlaybackPaused,
} from "./autoplay-gates";
import {
  type AutoplaySchedulerTimers,
  createAutoplayScheduler,
} from "./autoplay-scheduler";
import {
  createInitialPlaybackState,
  listRecordedTicks,
  type PlaybackState,
  reducePlayback,
} from "./playback-transitions";
import {
  createReplayProjectionCache,
  type PreparedReplayProjection,
  prepareReplayProjectionAtTick,
} from "./projection-cache";

export type UseControlledFactoryReplayOptions = {
  readonly recording: FactoryRecording;
  /** When false, skip DOM gate binding (tests / non-DOM hosts). Default true. */
  readonly bindDomGates?: boolean;
  /**
   * Optional timer injection for fixture tests (fake clock). Production
   * callers omit this and use the real `setTimeout` / `clearTimeout`.
   */
  readonly timers?: AutoplaySchedulerTimers;
};

export type ControlledFactoryReplayController = {
  readonly dispatch: {
    advance: () => void;
    followLatest: () => void;
    pause: () => void;
    play: () => void;
    reset: () => void;
    selectTick: (tick: number) => void;
  };
  readonly playback: PlaybackState;
  readonly prepared: PreparedReplayProjection;
  readonly rootRef: (node: HTMLElement | null) => void;
};

function readPrefersReducedMotion(): boolean {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Own selected-tick playback for one injected recording. Callers render
 * visualizers from `playback` + `prepared`; attach `rootRef` to the replay root
 * for intersection gating.
 */
export function useControlledFactoryReplay(
  options: UseControlledFactoryReplayOptions,
): ControlledFactoryReplayController {
  const { recording, bindDomGates = true, timers } = options;
  const ticks = useMemo(
    () => listRecordedTicks(recording.events),
    [recording.events],
  );

  const [playback, setPlayback] = useState<PlaybackState>(() =>
    createInitialPlaybackState(ticks),
  );
  const [gateAllowed, setGateAllowed] = useState(true);

  useEffect(() => {
    setPlayback(createInitialPlaybackState(ticks));
  }, [ticks]);

  const projectionCacheRef = useRef(createReplayProjectionCache());
  const prepared = useMemo(
    () =>
      prepareReplayProjectionAtTick(
        recording,
        playback.selectedTick,
        projectionCacheRef.current,
      ),
    [recording, playback.selectedTick],
  );

  const gateSessionRef = useRef<ReturnType<
    typeof createAutoplayGateSession
  > | null>(null);
  const schedulerRef = useRef<ReturnType<
    typeof createAutoplayScheduler
  > | null>(null);
  const gateDomRef = useRef<ReturnType<typeof bindAutoplayGateDom> | null>(
    null,
  );
  const rootNodeRef = useRef<HTMLElement | null>(null);
  const playbackRef = useRef(playback);
  playbackRef.current = playback;
  const gateAllowedRef = useRef(gateAllowed);
  gateAllowedRef.current = gateAllowed;
  const timersRef = useRef(timers);
  timersRef.current = timers;

  // Own scheduler + gate session in the mount effect. Strict Mode runs
  // cleanup→setup again while preserving refs; nulling on cleanup forces a
  // fresh pair so Play can schedule after remount.
  useEffect(() => {
    const gateSession = createAutoplayGateSession({
      initial: {
        documentVisible: true,
        intersecting: true,
        prefersReducedMotion: readPrefersReducedMotion(),
      },
      onChange: (decision) => {
        setGateAllowed(decision.allowed);
      },
      onRequestPause: () => {
        setPlayback((current) => reducePlayback(current, { type: "pause" }));
      },
    });
    const scheduler = createAutoplayScheduler(() => {
      setPlayback((current) => reducePlayback(current, { type: "advance" }));
    }, timersRef.current);

    gateSessionRef.current = gateSession;
    schedulerRef.current = scheduler;
    setGateAllowed(gateSession.getDecision().allowed);

    if (
      shouldStartPlaybackPaused(
        gateSession.getDecision().signals.prefersReducedMotion,
      )
    ) {
      setPlayback((current) =>
        current.playing ? reducePlayback(current, { type: "pause" }) : current,
      );
    }

    if (
      bindDomGates &&
      rootNodeRef.current !== null &&
      typeof window !== "undefined"
    ) {
      gateDomRef.current = bindAutoplayGateDom(
        gateSession,
        rootNodeRef.current,
        {
          IntersectionObserver: window.IntersectionObserver,
          document,
          matchMedia: (query) => window.matchMedia(query),
        },
      );
    }

    scheduler.sync({
      allowed: gateAllowedRef.current,
      playing: playbackRef.current.playing,
    });

    return () => {
      scheduler.dispose();
      gateDomRef.current?.dispose();
      gateDomRef.current = null;
      gateSession.dispose();
      gateSessionRef.current = null;
      schedulerRef.current = null;
    };
  }, [bindDomGates]);

  useEffect(() => {
    schedulerRef.current?.sync({
      allowed: gateAllowed,
      playing: playback.playing,
    });
  }, [gateAllowed, playback.playing]);

  const bindRootGates = useCallback(
    (node: HTMLElement | null) => {
      rootNodeRef.current = node;
      gateDomRef.current?.dispose();
      gateDomRef.current = null;
      const gateSession = gateSessionRef.current;
      if (
        !bindDomGates ||
        node === null ||
        gateSession === null ||
        typeof window === "undefined"
      ) {
        return;
      }
      gateDomRef.current = bindAutoplayGateDom(gateSession, node, {
        IntersectionObserver: window.IntersectionObserver,
        document,
        matchMedia: (query) => window.matchMedia(query),
      });
    },
    [bindDomGates],
  );

  const play = useCallback(() => {
    gateSessionRef.current?.notifyExplicitPlay();
    setPlayback((current) => reducePlayback(current, { type: "play" }));
  }, []);

  const pause = useCallback(() => {
    gateSessionRef.current?.notifyStopped();
    setPlayback((current) => reducePlayback(current, { type: "pause" }));
  }, []);

  const reset = useCallback(() => {
    gateSessionRef.current?.notifyStopped();
    setPlayback((current) => reducePlayback(current, { type: "reset" }));
  }, []);

  const selectTick = useCallback((tick: number) => {
    setPlayback((current) =>
      reducePlayback(current, { type: "selectTick", tick }),
    );
  }, []);

  const followLatest = useCallback(() => {
    setPlayback((current) => reducePlayback(current, { type: "followLatest" }));
  }, []);

  const advance = useCallback(() => {
    setPlayback((current) => reducePlayback(current, { type: "advance" }));
  }, []);

  return {
    dispatch: {
      advance,
      followLatest,
      pause,
      play,
      reset,
      selectTick,
    },
    playback,
    prepared,
    rootRef: bindRootGates,
  };
}
