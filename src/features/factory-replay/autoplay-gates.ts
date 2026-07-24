/**
 * Visibility, intersection, and reduced-motion gates for host-controlled
 * factory-replay autoplay.
 *
 * Gates only decide whether the existing single chained autoplay timeout may
 * run (`allowed`). They never own a second timer.
 *
 * Reduced-motion: start paused (host initial state); autoplay stays gated
 * until an explicit Play opt-in for the session. If reduce becomes active
 * while playing, clear the opt-in, request Pause, and stop autoplay.
 */

export const REDUCED_MOTION_MEDIA_QUERY = "(prefers-reduced-motion: reduce)";

export type AutoplayGateSignals = {
  readonly documentVisible: boolean;
  readonly intersecting: boolean;
  readonly prefersReducedMotion: boolean;
};

export type AutoplayGateDecision = {
  /** Pass to `createAutoplayScheduler().sync({ allowed })`. */
  readonly allowed: boolean;
  readonly signals: AutoplayGateSignals;
  /**
   * True while reduced motion is active and the host has explicitly Played
   * this session (user opt-in). Cleared on Pause/Reset or when reduce
   * newly activates.
   */
  readonly explicitPlayWhileReducedMotion: boolean;
};

export type AutoplayGateSessionOptions = {
  readonly initial?: Partial<AutoplayGateSignals>;
  /** Called whenever `allowed` may have changed. */
  readonly onChange?: (decision: AutoplayGateDecision) => void;
  /**
   * Called when reduced motion becomes active during an explicit-play
   * session so the host can Pause playback state.
   */
  readonly onRequestPause?: () => void;
};

export type AutoplayGateSession = {
  getDecision(): AutoplayGateDecision;
  setDocumentVisible(visible: boolean): void;
  setIntersecting(intersecting: boolean): void;
  setPrefersReducedMotion(reduce: boolean): void;
  /** Host applied Play — unlocks autoplay under active reduced motion. */
  notifyExplicitPlay(): void;
  /** Host applied Pause or Reset — clears reduced-motion play opt-in. */
  notifyStopped(): void;
  subscribe(listener: (decision: AutoplayGateDecision) => void): () => void;
  dispose(): void;
};

/**
 * Pure gate: document must be visible and the replay root intersecting.
 * Reduced motion blocks autoplay unless the user explicitly Played this
 * session (opt-in override).
 */
export function isAutoplayAllowed(
  signals: AutoplayGateSignals,
  explicitPlayWhileReducedMotion = false,
): boolean {
  if (!signals.documentVisible || !signals.intersecting) {
    return false;
  }
  if (signals.prefersReducedMotion && !explicitPlayWhileReducedMotion) {
    return false;
  }
  return true;
}

/**
 * When reduced motion is active, playback must start paused. (Hosts also use
 * `createInitialPlaybackState`, which is always paused.)
 */
export function shouldStartPlaybackPaused(
  prefersReducedMotion: boolean,
): boolean {
  return prefersReducedMotion;
}

function freezeSignals(signals: AutoplayGateSignals): AutoplayGateSignals {
  return Object.freeze({
    documentVisible: signals.documentVisible,
    intersecting: signals.intersecting,
    prefersReducedMotion: signals.prefersReducedMotion,
  });
}

function decide(
  signals: AutoplayGateSignals,
  explicitPlayWhileReducedMotion: boolean,
): AutoplayGateDecision {
  const override =
    signals.prefersReducedMotion && explicitPlayWhileReducedMotion;
  return Object.freeze({
    allowed: isAutoplayAllowed(signals, override),
    explicitPlayWhileReducedMotion: override,
    signals: freezeSignals(signals),
  });
}

/**
 * Mutable gate session driven by simulated or DOM-bound signals.
 * Wire `getDecision().allowed` into `createAutoplayScheduler().sync`.
 */
export function createAutoplayGateSession(
  options: AutoplayGateSessionOptions = {},
): AutoplayGateSession {
  let disposed = false;
  let signals: AutoplayGateSignals = {
    documentVisible: options.initial?.documentVisible ?? true,
    intersecting: options.initial?.intersecting ?? true,
    prefersReducedMotion: options.initial?.prefersReducedMotion ?? false,
  };
  let explicitPlayWhileReducedMotion = false;
  const listeners = new Set<(decision: AutoplayGateDecision) => void>();

  function emit(): void {
    if (disposed) {
      return;
    }
    const decision = decide(signals, explicitPlayWhileReducedMotion);
    options.onChange?.(decision);
    for (const listener of listeners) {
      listener(decision);
    }
  }

  function updateSignals(next: AutoplayGateSignals): void {
    if (
      next.documentVisible === signals.documentVisible &&
      next.intersecting === signals.intersecting &&
      next.prefersReducedMotion === signals.prefersReducedMotion
    ) {
      return;
    }
    signals = next;
    emit();
  }

  return {
    getDecision(): AutoplayGateDecision {
      return decide(signals, explicitPlayWhileReducedMotion);
    },
    setDocumentVisible(visible: boolean): void {
      if (disposed) {
        return;
      }
      updateSignals({ ...signals, documentVisible: visible });
    },
    setIntersecting(intersecting: boolean): void {
      if (disposed) {
        return;
      }
      updateSignals({ ...signals, intersecting });
    },
    setPrefersReducedMotion(reduce: boolean): void {
      if (disposed) {
        return;
      }
      const wasReduce = signals.prefersReducedMotion;
      if (reduce && !wasReduce) {
        // Reduce newly activated during play: clear opt-in, stop autoplay,
        // and ask the host to Pause (no-op when already paused).
        explicitPlayWhileReducedMotion = false;
        options.onRequestPause?.();
      }
      updateSignals({ ...signals, prefersReducedMotion: reduce });
    },
    notifyExplicitPlay(): void {
      if (disposed) {
        return;
      }
      if (signals.prefersReducedMotion && !explicitPlayWhileReducedMotion) {
        explicitPlayWhileReducedMotion = true;
        emit();
        return;
      }
      if (!signals.prefersReducedMotion) {
        // No override needed when motion is unrestricted.
        return;
      }
    },
    notifyStopped(): void {
      if (disposed) {
        return;
      }
      if (!explicitPlayWhileReducedMotion) {
        return;
      }
      explicitPlayWhileReducedMotion = false;
      emit();
    },
    subscribe(listener: (decision: AutoplayGateDecision) => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispose(): void {
      disposed = true;
      listeners.clear();
      explicitPlayWhileReducedMotion = false;
    },
  };
}

/** Minimal document surface for visibility binding. */
export type AutoplayGateDocument = {
  readonly hidden: boolean;
  addEventListener(type: "visibilitychange", listener: () => void): void;
  removeEventListener(type: "visibilitychange", listener: () => void): void;
};

/** Minimal matchMedia surface for reduced-motion binding. */
export type AutoplayGateMediaQueryList = {
  readonly matches: boolean;
  addEventListener(
    type: "change",
    listener: (event: { readonly matches: boolean }) => void,
  ): void;
  removeEventListener(
    type: "change",
    listener: (event: { readonly matches: boolean }) => void,
  ): void;
};

export type AutoplayGateDomEnvironment = {
  readonly document: AutoplayGateDocument;
  matchMedia(query: string): AutoplayGateMediaQueryList;
  readonly IntersectionObserver: {
    new (
      callback: (
        entries: ReadonlyArray<{ readonly isIntersecting: boolean }>,
      ) => void,
    ): {
      observe(target: Element): void;
      disconnect(): void;
    };
  };
};

export type AutoplayGateDomBinding = {
  dispose(): void;
};

/**
 * Bind a gate session to document visibility, root intersection, and
 * prefers-reduced-motion. Removes all listeners on dispose.
 */
export function bindAutoplayGateDom(
  session: AutoplayGateSession,
  root: Element,
  env: AutoplayGateDomEnvironment,
): AutoplayGateDomBinding {
  const syncVisibility = (): void => {
    session.setDocumentVisible(!env.document.hidden);
  };
  syncVisibility();
  env.document.addEventListener("visibilitychange", syncVisibility);

  const media = env.matchMedia(REDUCED_MOTION_MEDIA_QUERY);
  const syncMotion = (): void => {
    session.setPrefersReducedMotion(media.matches);
  };
  syncMotion();
  const onMotionChange = (event: { readonly matches: boolean }): void => {
    session.setPrefersReducedMotion(event.matches);
  };
  media.addEventListener("change", onMotionChange);

  const observer = new env.IntersectionObserver((entries) => {
    const entry = entries[entries.length - 1];
    if (entry === undefined) {
      return;
    }
    session.setIntersecting(entry.isIntersecting);
  });
  observer.observe(root);

  let disposed = false;
  return {
    dispose(): void {
      if (disposed) {
        return;
      }
      disposed = true;
      env.document.removeEventListener("visibilitychange", syncVisibility);
      media.removeEventListener("change", onMotionChange);
      observer.disconnect();
    },
  };
}
