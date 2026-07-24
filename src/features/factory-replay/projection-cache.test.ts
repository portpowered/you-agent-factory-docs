import { describe, expect, test } from "bun:test";
import { FIXTURE_RECORDING_A, FIXTURE_RECORDING_B } from "./fixtures";
import {
  createReplayProjectionCache,
  prepareReplayProjectionAtTick,
} from "./projection-cache";

describe("prepareReplayProjectionAtTick", () => {
  test("prepares topology activity load and work-progress for a selected tick", () => {
    const cache = createReplayProjectionCache();
    const prepared = prepareReplayProjectionAtTick(
      FIXTURE_RECORDING_A,
      2,
      cache,
    );

    expect(prepared.topology.selectedTick).toBe(2);
    expect(prepared.topology.nodes.length).toBeGreaterThan(0);
    expect(prepared.activity.selectedTick).toBe(2);
    expect(prepared.load.selectedTick).toBe(2);
    expect(prepared.progress.selectedTick).toBe(2);
    expect(prepared.progress.total).toBeGreaterThanOrEqual(1);
  });

  test("returns the same projection object on repeated reads of the same tick", () => {
    const cache = createReplayProjectionCache();
    const first = prepareReplayProjectionAtTick(FIXTURE_RECORDING_A, 1, cache);
    const second = prepareReplayProjectionAtTick(FIXTURE_RECORDING_A, 1, cache);

    expect(second).toBe(first);
    expect(second.topology).toBe(first.topology);
    expect(second.activity).toBe(first.activity);
    expect(second.load).toBe(first.load);
    expect(second.progress).toBe(first.progress);
  });

  test("cache-hits each tick independently when the selected tick changes", () => {
    const cache = createReplayProjectionCache();
    const tick1 = prepareReplayProjectionAtTick(FIXTURE_RECORDING_A, 1, cache);
    const tick2 = prepareReplayProjectionAtTick(FIXTURE_RECORDING_A, 2, cache);
    const tick1Again = prepareReplayProjectionAtTick(
      FIXTURE_RECORDING_A,
      1,
      cache,
    );
    const tick2Again = prepareReplayProjectionAtTick(
      FIXTURE_RECORDING_A,
      2,
      cache,
    );

    expect(tick1).not.toBe(tick2);
    expect(tick1.topology.selectedTick).toBe(1);
    expect(tick2.topology.selectedTick).toBe(2);
    expect(tick1Again).toBe(tick1);
    expect(tick2Again).toBe(tick2);
  });

  test("does not reuse cache entries across different recording identities", () => {
    const cache = createReplayProjectionCache();
    const fromA = prepareReplayProjectionAtTick(FIXTURE_RECORDING_A, 1, cache);
    const fromB = prepareReplayProjectionAtTick(FIXTURE_RECORDING_B, 1, cache);
    const fromAAgain = prepareReplayProjectionAtTick(
      FIXTURE_RECORDING_A,
      1,
      cache,
    );

    expect(fromB).not.toBe(fromA);
    expect(fromAAgain).not.toBe(fromA);
    expect(fromAAgain.topology.selectedTick).toBe(1);
  });
});
