import { describe, expect, test } from "bun:test";
import {
  createInitialPlaybackState,
  listRecordedTicks,
  type PlaybackState,
  reducePlayback,
} from "./playback-transitions";

const FIXTURE_TICKS = [1, 2, 4] as const;

function initial(): PlaybackState {
  return createInitialPlaybackState(FIXTURE_TICKS);
}

describe("listRecordedTicks", () => {
  test("returns unique ascending ticks from events", () => {
    expect(
      listRecordedTicks([
        { context: { tick: 4 } },
        { context: { tick: 1 } },
        { context: { tick: 4 } },
        { context: { tick: 2 } },
      ]),
    ).toEqual([1, 2, 4]);
  });

  test("uses [0] when the event list is empty", () => {
    expect(listRecordedTicks([])).toEqual([0]);
  });
});

describe("createInitialPlaybackState", () => {
  test("starts paused in current mode at the latest tick", () => {
    const state = initial();
    expect(state).toEqual({
      earliestTick: 1,
      latestTick: 4,
      mode: "current",
      playing: false,
      selectedTick: 4,
      ticks: [1, 2, 4],
    });
  });

  test("normalizes unsorted ticks without mutating the caller array", () => {
    const ticks = [3, 1, 2, 1];
    const snapshot = [...ticks];
    const state = createInitialPlaybackState(ticks);
    expect(ticks).toEqual(snapshot);
    expect(state.ticks).toEqual([1, 2, 3]);
    expect(state.earliestTick).toBe(1);
    expect(state.latestTick).toBe(3);
    expect(state.selectedTick).toBe(3);
  });
});

describe("reducePlayback", () => {
  test("Play sets playing; Pause clears playing", () => {
    const playing = reducePlayback(initial(), { type: "play" });
    expect(playing.playing).toBe(true);
    expect(playing.selectedTick).toBe(4);
    expect(playing.mode).toBe("current");

    const paused = reducePlayback(playing, { type: "pause" });
    expect(paused.playing).toBe(false);
    expect(paused.selectedTick).toBe(4);
  });

  test("Reset returns to initial tick selection and paused playback", () => {
    const mid = reducePlayback(
      reducePlayback(reducePlayback(initial(), { type: "play" }), {
        type: "selectTick",
        tick: 1,
      }),
      { type: "advance" },
    );
    expect(mid.playing).toBe(true);
    expect(mid.selectedTick).toBe(2);
    expect(mid.mode).toBe("history");

    const reset = reducePlayback(mid, { type: "reset" });
    expect(reset).toEqual(initial());
    expect(reset.playing).toBe(false);
  });

  test("Select tick enters history when not latest and current when latest", () => {
    const history = reducePlayback(initial(), {
      type: "selectTick",
      tick: 2,
    });
    expect(history.selectedTick).toBe(2);
    expect(history.mode).toBe("history");
    expect(history.playing).toBe(false);

    const current = reducePlayback(history, {
      type: "selectTick",
      tick: 4,
    });
    expect(current.selectedTick).toBe(4);
    expect(current.mode).toBe("current");
  });

  test("Follow latest returns to current mode at the latest tick", () => {
    const history = reducePlayback(
      reducePlayback(initial(), { type: "play" }),
      { type: "selectTick", tick: 1 },
    );
    const followed = reducePlayback(history, { type: "followLatest" });
    expect(followed.mode).toBe("current");
    expect(followed.selectedTick).toBe(4);
    expect(followed.playing).toBe(true);
  });

  test("Advance moves to the next recorded tick without changing playing", () => {
    const playing = reducePlayback(
      reducePlayback(initial(), { type: "play" }),
      { type: "selectTick", tick: 1 },
    );
    const advanced = reducePlayback(playing, { type: "advance" });
    expect(advanced.selectedTick).toBe(2);
    expect(advanced.mode).toBe("history");
    expect(advanced.playing).toBe(true);

    const toLatest = reducePlayback(advanced, { type: "advance" });
    expect(toLatest.selectedTick).toBe(4);
    expect(toLatest.mode).toBe("current");
    expect(toLatest.playing).toBe(true);
  });

  test("Advance from the final tick loops to the earliest tick", () => {
    const fromLatest = reducePlayback(
      reducePlayback(initial(), { type: "play" }),
      { type: "advance" },
    );
    expect(fromLatest.selectedTick).toBe(1);
    expect(fromLatest.mode).toBe("history");
    expect(fromLatest.playing).toBe(true);
  });

  test("illegal Select ticks outside bounds or not recorded are no-ops", () => {
    const state = reducePlayback(initial(), { type: "play" });
    const below = reducePlayback(state, { type: "selectTick", tick: 0 });
    const above = reducePlayback(state, { type: "selectTick", tick: 99 });
    const gap = reducePlayback(state, { type: "selectTick", tick: 3 });
    expect(below).toBe(state);
    expect(above).toBe(state);
    expect(gap).toBe(state);
    expect(state.selectedTick).toBe(4);
    expect(state.playing).toBe(true);
  });

  test("does not schedule timers or mutate prior state objects", () => {
    const state = initial();
    const frozenTicks = state.ticks;
    const next = reducePlayback(state, { type: "play" });
    expect(state.playing).toBe(false);
    expect(next.playing).toBe(true);
    expect(next.ticks).toBe(frozenTicks);
    expect(typeof setTimeout).toBe("function");
  });
});
