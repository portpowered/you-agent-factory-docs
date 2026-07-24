import { describe, expect, test } from "bun:test";
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

/**
 * Deterministic fake clock — advances by explicit ms so tests never depend on
 * wall-clock flakiness. Tracks pending handles to prove single-timer chaining.
 */
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

describe("createAutoplayScheduler", () => {
  test("exports a 2000 ms cadence constant", () => {
    expect(AUTOPLAY_INTERVAL_MS).toBe(2000);
  });

  test("schedules exactly one chained timeout while playing and ungated", () => {
    const clock = createFakeTimers();
    const advances: number[] = [];
    const scheduler = createAutoplayScheduler(() => {
      advances.push(clock.pendingCount());
    }, clock);

    scheduler.sync({ playing: true });
    expect(scheduler.isScheduled()).toBe(true);
    expect(clock.pendingCount()).toBe(1);

    clock.advance(AUTOPLAY_INTERVAL_MS - 1);
    expect(advances).toEqual([]);
    expect(clock.pendingCount()).toBe(1);

    clock.advance(1);
    expect(advances).toEqual([0]);
    expect(scheduler.isScheduled()).toBe(true);
    expect(clock.pendingCount()).toBe(1);

    clock.advance(AUTOPLAY_INTERVAL_MS);
    expect(advances).toEqual([0, 0]);
    expect(clock.pendingCount()).toBe(1);

    scheduler.dispose();
  });

  test("sync while already playing does not create overlapping timers", () => {
    const clock = createFakeTimers();
    const scheduler = createAutoplayScheduler(() => undefined, clock);

    scheduler.sync({ playing: true });
    scheduler.sync({ playing: true });
    scheduler.sync({ playing: true, allowed: true });
    expect(clock.pendingCount()).toBe(1);

    scheduler.dispose();
  });

  test("holds on the final tick for one cadence then loops via Advance", () => {
    const clock = createFakeTimers();
    let state: PlaybackState = createInitialPlaybackState(FIXTURE_TICKS);
    // Start on the final tick so the first fire proves hold-then-loop.
    expect(state.selectedTick).toBe(4);

    const scheduler = createAutoplayScheduler(() => {
      state = reducePlayback(state, { type: "advance" });
    }, clock);

    state = reducePlayback(state, { type: "play" });
    scheduler.sync({ playing: state.playing });

    clock.advance(AUTOPLAY_INTERVAL_MS - 1);
    expect(state.selectedTick).toBe(4);

    clock.advance(1);
    expect(state.selectedTick).toBe(1);
    expect(state.mode).toBe("history");
    expect(clock.pendingCount()).toBe(1);

    clock.advance(AUTOPLAY_INTERVAL_MS);
    expect(state.selectedTick).toBe(2);

    clock.advance(AUTOPLAY_INTERVAL_MS);
    expect(state.selectedTick).toBe(4);
    expect(state.mode).toBe("current");

    clock.advance(AUTOPLAY_INTERVAL_MS);
    expect(state.selectedTick).toBe(1);

    scheduler.dispose();
  });

  test("Pause clears the pending timeout so Advance does not fire", () => {
    const clock = createFakeTimers();
    let state: PlaybackState = createInitialPlaybackState(FIXTURE_TICKS);
    state = reducePlayback(state, { type: "selectTick", tick: 1 });

    const scheduler = createAutoplayScheduler(() => {
      state = reducePlayback(state, { type: "advance" });
    }, clock);

    state = reducePlayback(state, { type: "play" });
    scheduler.sync({ playing: true });
    expect(clock.pendingCount()).toBe(1);

    state = reducePlayback(state, { type: "pause" });
    scheduler.sync({ playing: false });
    expect(scheduler.isScheduled()).toBe(false);
    expect(clock.pendingCount()).toBe(0);

    clock.advance(AUTOPLAY_INTERVAL_MS * 3);
    expect(state.selectedTick).toBe(1);
    expect(state.playing).toBe(false);

    scheduler.dispose();
  });

  test("Reset clears the pending timeout so Advance does not fire", () => {
    const clock = createFakeTimers();
    let state: PlaybackState = createInitialPlaybackState(FIXTURE_TICKS);
    state = reducePlayback(state, { type: "selectTick", tick: 1 });
    state = reducePlayback(state, { type: "play" });

    const scheduler = createAutoplayScheduler(() => {
      state = reducePlayback(state, { type: "advance" });
    }, clock);

    scheduler.sync({ playing: true });
    state = reducePlayback(state, { type: "reset" });
    scheduler.sync({ playing: state.playing });

    expect(state.playing).toBe(false);
    expect(state.selectedTick).toBe(4);
    expect(scheduler.isScheduled()).toBe(false);

    clock.advance(AUTOPLAY_INTERVAL_MS * 2);
    expect(state.selectedTick).toBe(4);

    scheduler.dispose();
  });

  test("dispose clears pending timeout and ignores later sync", () => {
    const clock = createFakeTimers();
    let advanced = 0;
    const scheduler = createAutoplayScheduler(() => {
      advanced += 1;
    }, clock);

    scheduler.sync({ playing: true });
    expect(clock.pendingCount()).toBe(1);

    scheduler.dispose();
    expect(scheduler.isScheduled()).toBe(false);
    expect(clock.pendingCount()).toBe(0);

    clock.advance(AUTOPLAY_INTERVAL_MS * 2);
    expect(advanced).toBe(0);

    scheduler.sync({ playing: true });
    expect(scheduler.isScheduled()).toBe(false);
    expect(clock.pendingCount()).toBe(0);
  });

  test("allowed:false clears the timeout without requiring pause", () => {
    const clock = createFakeTimers();
    let advanced = 0;
    const scheduler = createAutoplayScheduler(() => {
      advanced += 1;
    }, clock);

    scheduler.sync({ playing: true, allowed: true });
    expect(clock.pendingCount()).toBe(1);

    scheduler.sync({ playing: true, allowed: false });
    expect(scheduler.isScheduled()).toBe(false);
    expect(clock.pendingCount()).toBe(0);

    clock.advance(AUTOPLAY_INTERVAL_MS);
    expect(advanced).toBe(0);

    scheduler.sync({ playing: true, allowed: true });
    clock.advance(AUTOPLAY_INTERVAL_MS);
    expect(advanced).toBe(1);

    scheduler.dispose();
  });
});
