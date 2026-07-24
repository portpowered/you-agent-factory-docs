/**
 * Host-controlled factory-replay React hook: pure playback transitions,
 * projection cache, single chained autoplay, and visibility/intersection/
 * reduced-motion gates. Full-mode composition owns the selected tick.
 */

"use client";

import type { FactoryRecording } from "@you-agent-factory/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  bindAutoplayGateDom,
  createAutoplayGateSession,
  shouldStartPlaybackPaused,
} from "./autoplay-gates";
import { createAutoplayScheduler } from "./autoplay-scheduler";
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
  const { recording, bindDomGates = true } = options;
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

  if (gateSessionRef.current === null) {
    gateSessionRef.current = createAutoplayGateSession({
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
  }

  if (schedulerRef.current === null) {
    schedulerRef.current = createAutoplayScheduler(() => {
      setPlayback((current) => reducePlayback(current, { type: "advance" }));
    });
  }

  const gateSession = gateSessionRef.current;
  const scheduler = schedulerRef.current;

  useEffect(() => {
    if (
      shouldStartPlaybackPaused(
        gateSession.getDecision().signals.prefersReducedMotion,
      )
    ) {
      setPlayback((current) =>
        current.playing ? reducePlayback(current, { type: "pause" }) : current,
      );
    }
  }, [gateSession]);

  useEffect(() => {
    scheduler.sync({
      allowed: gateAllowed,
      playing: playback.playing,
    });
  }, [gateAllowed, playback.playing, scheduler]);

  useEffect(() => {
    return () => {
      scheduler.dispose();
      gateDomRef.current?.dispose();
      gateDomRef.current = null;
      gateSession.dispose();
    };
  }, [gateSession, scheduler]);

  const bindRootGates = useCallback(
    (node: HTMLElement | null) => {
      gateDomRef.current?.dispose();
      gateDomRef.current = null;
      if (!bindDomGates || node === null || typeof window === "undefined") {
        return;
      }
      gateDomRef.current = bindAutoplayGateDom(gateSession, node, {
        IntersectionObserver: window.IntersectionObserver,
        document,
        matchMedia: (query) => window.matchMedia(query),
      });
    },
    [bindDomGates, gateSession],
  );

  const play = useCallback(() => {
    gateSession.notifyExplicitPlay();
    setPlayback((current) => reducePlayback(current, { type: "play" }));
  }, [gateSession]);

  const pause = useCallback(() => {
    gateSession.notifyStopped();
    setPlayback((current) => reducePlayback(current, { type: "pause" }));
  }, [gateSession]);

  const reset = useCallback(() => {
    gateSession.notifyStopped();
    setPlayback((current) => reducePlayback(current, { type: "reset" }));
  }, [gateSession]);

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
