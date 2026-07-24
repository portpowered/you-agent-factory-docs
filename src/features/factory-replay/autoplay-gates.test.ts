import { describe, expect, test } from "bun:test";
import {
  type AutoplayGateDocument,
  type AutoplayGateDomEnvironment,
  type AutoplayGateMediaQueryList,
  bindAutoplayGateDom,
  createAutoplayGateSession,
  isAutoplayAllowed,
  REDUCED_MOTION_MEDIA_QUERY,
  shouldStartPlaybackPaused,
} from "./autoplay-gates";
import {
  AUTOPLAY_INTERVAL_MS,
  type AutoplaySchedulerTimers,
  type AutoplayTimerHandle,
  createAutoplayScheduler,
} from "./autoplay-scheduler";
import {
  createInitialPlaybackState,
  type PlaybackState,
  reducePlayback,
} from "./playback-transitions";

const FIXTURE_TICKS = [1, 2, 4] as const;

type PendingTimeout = {
  readonly callback: () => void;
  readonly delayMs: number;
  readonly id: number;
};

function createFakeTimers(): AutoplaySchedulerTimers & {
  advance(ms: number): void;
  pendingCount(): number;
} {
  let nextId = 1;
  let now = 0;
  const pending = new Map<number, PendingTimeout & { dueAt: number }>();

  return {
    advance(ms: number): void {
      now += ms;
      const due = [...pending.values()]
        .filter((entry) => entry.dueAt <= now)
        .sort((left, right) => left.dueAt - right.dueAt || left.id - right.id);
      for (const entry of due) {
        if (!pending.has(entry.id)) {
          continue;
        }
        pending.delete(entry.id);
        entry.callback();
      }
    },
    clearTimeout(handle: AutoplayTimerHandle): void {
      pending.delete(handle as unknown as number);
    },
    pendingCount(): number {
      return pending.size;
    },
    setTimeout(callback: () => void, delayMs: number): AutoplayTimerHandle {
      const id = nextId;
      nextId += 1;
      pending.set(id, { callback, delayMs, dueAt: now + delayMs, id });
      return id as unknown as AutoplayTimerHandle;
    },
  };
}

describe("isAutoplayAllowed", () => {
  test("allows only when visible, intersecting, and not reduced-motion", () => {
    expect(
      isAutoplayAllowed({
        documentVisible: true,
        intersecting: true,
        prefersReducedMotion: false,
      }),
    ).toBe(true);
    expect(
      isAutoplayAllowed({
        documentVisible: false,
        intersecting: true,
        prefersReducedMotion: false,
      }),
    ).toBe(false);
    expect(
      isAutoplayAllowed({
        documentVisible: true,
        intersecting: false,
        prefersReducedMotion: false,
      }),
    ).toBe(false);
    expect(
      isAutoplayAllowed({
        documentVisible: true,
        intersecting: true,
        prefersReducedMotion: true,
      }),
    ).toBe(false);
  });

  test("explicit Play opt-in unlocks autoplay under reduced motion", () => {
    expect(
      isAutoplayAllowed(
        {
          documentVisible: true,
          intersecting: true,
          prefersReducedMotion: true,
        },
        true,
      ),
    ).toBe(true);
    expect(
      isAutoplayAllowed(
        {
          documentVisible: false,
          intersecting: true,
          prefersReducedMotion: true,
        },
        true,
      ),
    ).toBe(false);
  });
});

describe("shouldStartPlaybackPaused", () => {
  test("requires paused start when reduced motion is active", () => {
    expect(shouldStartPlaybackPaused(true)).toBe(true);
    expect(shouldStartPlaybackPaused(false)).toBe(false);
    expect(createInitialPlaybackState(FIXTURE_TICKS).playing).toBe(false);
  });
});

describe("createAutoplayGateSession + autoplay scheduler", () => {
  test("hidden document does not schedule or fire Advance until visible again", () => {
    const clock = createFakeTimers();
    let state: PlaybackState = createInitialPlaybackState(FIXTURE_TICKS);
    state = reducePlayback(state, { type: "selectTick", tick: 1 });
    state = reducePlayback(state, { type: "play" });

    const scheduler = createAutoplayScheduler(() => {
      state = reducePlayback(state, { type: "advance" });
    }, clock);

    const gates = createAutoplayGateSession({
      onChange: (decision) => {
        scheduler.sync({ playing: state.playing, allowed: decision.allowed });
      },
    });

    scheduler.sync({
      playing: state.playing,
      allowed: gates.getDecision().allowed,
    });
    expect(clock.pendingCount()).toBe(1);

    gates.setDocumentVisible(false);
    expect(gates.getDecision().allowed).toBe(false);
    expect(scheduler.isScheduled()).toBe(false);
    expect(clock.pendingCount()).toBe(0);

    clock.advance(AUTOPLAY_INTERVAL_MS * 2);
    expect(state.selectedTick).toBe(1);
    expect(state.playing).toBe(true);

    gates.setDocumentVisible(true);
    expect(gates.getDecision().allowed).toBe(true);
    expect(scheduler.isScheduled()).toBe(true);

    clock.advance(AUTOPLAY_INTERVAL_MS);
    expect(state.selectedTick).toBe(2);

    scheduler.dispose();
    gates.dispose();
  });

  test("non-intersecting root does not advance until intersection restores", () => {
    const clock = createFakeTimers();
    let state: PlaybackState = createInitialPlaybackState(FIXTURE_TICKS);
    state = reducePlayback(state, { type: "selectTick", tick: 1 });
    state = reducePlayback(state, { type: "play" });

    const scheduler = createAutoplayScheduler(() => {
      state = reducePlayback(state, { type: "advance" });
    }, clock);

    const gates = createAutoplayGateSession({
      onChange: (decision) => {
        scheduler.sync({ playing: state.playing, allowed: decision.allowed });
      },
    });

    scheduler.sync({
      playing: true,
      allowed: gates.getDecision().allowed,
    });

    gates.setIntersecting(false);
    expect(gates.getDecision().allowed).toBe(false);
    expect(scheduler.isScheduled()).toBe(false);

    clock.advance(AUTOPLAY_INTERVAL_MS * 2);
    expect(state.selectedTick).toBe(1);

    gates.setIntersecting(true);
    clock.advance(AUTOPLAY_INTERVAL_MS);
    expect(state.selectedTick).toBe(2);

    scheduler.dispose();
    gates.dispose();
  });

  test("reduced motion starts gated until explicit Play; Pause clears opt-in", () => {
    const clock = createFakeTimers();
    let state: PlaybackState = createInitialPlaybackState(FIXTURE_TICKS);
    expect(state.playing).toBe(false);

    const scheduler = createAutoplayScheduler(() => {
      state = reducePlayback(state, { type: "advance" });
    }, clock);

    const gates = createAutoplayGateSession({
      initial: { prefersReducedMotion: true },
      onChange: (decision) => {
        scheduler.sync({ playing: state.playing, allowed: decision.allowed });
      },
    });

    expect(shouldStartPlaybackPaused(true)).toBe(true);
    expect(gates.getDecision().allowed).toBe(false);

    // Playing without notifyExplicitPlay stays gated under reduce.
    state = reducePlayback(state, { type: "play" });
    scheduler.sync({
      playing: true,
      allowed: gates.getDecision().allowed,
    });
    expect(scheduler.isScheduled()).toBe(false);

    clock.advance(AUTOPLAY_INTERVAL_MS);
    expect(state.selectedTick).toBe(4);

    gates.notifyExplicitPlay();
    expect(gates.getDecision().allowed).toBe(true);
    expect(gates.getDecision().explicitPlayWhileReducedMotion).toBe(true);
    scheduler.sync({
      playing: true,
      allowed: gates.getDecision().allowed,
    });
    expect(scheduler.isScheduled()).toBe(true);

    clock.advance(AUTOPLAY_INTERVAL_MS);
    expect(state.selectedTick).toBe(1);

    state = reducePlayback(state, { type: "pause" });
    gates.notifyStopped();
    scheduler.sync({
      playing: false,
      allowed: gates.getDecision().allowed,
    });
    expect(gates.getDecision().explicitPlayWhileReducedMotion).toBe(false);
    expect(gates.getDecision().allowed).toBe(false);
    expect(scheduler.isScheduled()).toBe(false);

    scheduler.dispose();
    gates.dispose();
  });

  test("reduced motion becoming active during play stops autoplay and requests Pause", () => {
    const clock = createFakeTimers();
    let state: PlaybackState = createInitialPlaybackState(FIXTURE_TICKS);
    state = reducePlayback(state, { type: "selectTick", tick: 1 });
    state = reducePlayback(state, { type: "play" });
    let pauseRequests = 0;

    const scheduler = createAutoplayScheduler(() => {
      state = reducePlayback(state, { type: "advance" });
    }, clock);

    const gates = createAutoplayGateSession({
      onChange: (decision) => {
        scheduler.sync({ playing: state.playing, allowed: decision.allowed });
      },
      onRequestPause: () => {
        pauseRequests += 1;
        state = reducePlayback(state, { type: "pause" });
        gates.notifyStopped();
        scheduler.sync({
          playing: state.playing,
          allowed: gates.getDecision().allowed,
        });
      },
    });

    scheduler.sync({
      playing: true,
      allowed: gates.getDecision().allowed,
    });
    expect(clock.pendingCount()).toBe(1);

    gates.setPrefersReducedMotion(true);
    expect(pauseRequests).toBe(1);
    expect(state.playing).toBe(false);
    expect(gates.getDecision().allowed).toBe(false);
    expect(scheduler.isScheduled()).toBe(false);

    clock.advance(AUTOPLAY_INTERVAL_MS * 2);
    expect(state.selectedTick).toBe(1);

    scheduler.dispose();
    gates.dispose();
  });
});

describe("bindAutoplayGateDom", () => {
  test("wires visibility, intersection, and reduced-motion and cleans up", () => {
    const visibilityListeners = new Set<() => void>();
    let documentHidden = false;
    const doc: AutoplayGateDocument = {
      get hidden() {
        return documentHidden;
      },
      addEventListener(_type, listener) {
        visibilityListeners.add(listener);
      },
      removeEventListener(_type, listener) {
        visibilityListeners.delete(listener);
      },
    };

    const motionListeners = new Set<(event: { matches: boolean }) => void>();
    let reduceMatches = false;
    const media: AutoplayGateMediaQueryList = {
      get matches() {
        return reduceMatches;
      },
      addEventListener(_type, listener) {
        motionListeners.add(listener);
      },
      removeEventListener(_type, listener) {
        motionListeners.delete(listener);
      },
    };

    const observerState: {
      callback:
        | ((entries: ReadonlyArray<{ isIntersecting: boolean }>) => void)
        | null;
      disconnected: boolean;
      observed: Element | null;
    } = {
      callback: null,
      disconnected: false,
      observed: null,
    };

    const env: AutoplayGateDomEnvironment = {
      document: doc,
      matchMedia(query: string) {
        expect(query).toBe(REDUCED_MOTION_MEDIA_QUERY);
        return media;
      },
      IntersectionObserver: class {
        constructor(
          callback: (
            entries: ReadonlyArray<{ isIntersecting: boolean }>,
          ) => void,
        ) {
          observerState.callback = callback;
        }
        observe(target: Element) {
          observerState.observed = target;
        }
        disconnect() {
          observerState.disconnected = true;
          observerState.callback = null;
        }
      },
    };

    const root = { tagName: "DIV" } as unknown as Element;
    const session = createAutoplayGateSession();

    const binding = bindAutoplayGateDom(session, root, env);
    expect(observerState.observed).toBe(root);
    expect(visibilityListeners.size).toBe(1);
    expect(motionListeners.size).toBe(1);
    expect(session.getDecision().allowed).toBe(true);

    documentHidden = true;
    for (const listener of visibilityListeners) {
      listener();
    }
    expect(session.getDecision().signals.documentVisible).toBe(false);
    expect(session.getDecision().allowed).toBe(false);

    documentHidden = false;
    for (const listener of visibilityListeners) {
      listener();
    }
    expect(observerState.callback).not.toBeNull();
    observerState.callback?.([{ isIntersecting: false }]);
    expect(session.getDecision().signals.intersecting).toBe(false);
    expect(session.getDecision().allowed).toBe(false);

    observerState.callback?.([{ isIntersecting: true }]);
    reduceMatches = true;
    for (const listener of motionListeners) {
      listener({ matches: true });
    }
    expect(session.getDecision().signals.prefersReducedMotion).toBe(true);
    expect(session.getDecision().allowed).toBe(false);

    binding.dispose();
    expect(visibilityListeners.size).toBe(0);
    expect(motionListeners.size).toBe(0);
    expect(observerState.disconnected).toBe(true);

    session.dispose();
  });
});
