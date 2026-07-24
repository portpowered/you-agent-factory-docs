import { describe, expect, test } from "bun:test";
import { deriveCompactModeComposition } from "./compact-mode-composition";
import { FIXTURE_RECORDING_A } from "./fixtures";
import {
  createInitialPlaybackState,
  listRecordedTicks,
} from "./playback-transitions";
import {
  createReplayProjectionCache,
  prepareReplayProjectionAtTick,
} from "./projection-cache";

describe("deriveCompactModeComposition", () => {
  test("loading keeps topology loading and progress hidden", () => {
    const composition = deriveCompactModeComposition({
      playback: undefined,
      prepared: undefined,
      status: "loading",
    });

    expect(composition.topology).toEqual({ status: "loading" });
    expect(composition.progressVisible).toBe(false);
    expect(composition.selectedTick).toBeUndefined();
  });

  test("failed keeps topology failed and progress hidden", () => {
    const composition = deriveCompactModeComposition({
      playback: undefined,
      prepared: undefined,
      status: "failed",
    });

    expect(composition.topology).toEqual({ status: "failed" });
    expect(composition.progressVisible).toBe(false);
  });

  test("ready maps host playback and prepared projection into topology and tick bounds", () => {
    const ticks = listRecordedTicks(FIXTURE_RECORDING_A.events);
    const playback = createInitialPlaybackState(ticks);
    const selected = {
      ...playback,
      mode: "history" as const,
      selectedTick: 1,
    };
    const prepared = prepareReplayProjectionAtTick(
      FIXTURE_RECORDING_A,
      1,
      createReplayProjectionCache(),
    );

    const composition = deriveCompactModeComposition({
      playback: selected,
      prepared,
      status: "ready",
    });

    expect(composition.earliestTick).toBe(1);
    expect(composition.latestTick).toBe(2);
    expect(composition.selectedTick).toBe(1);
    expect(composition.progressVisible).toBe(false);
    expect(composition.topology.status).toBe("ready");
    if (composition.topology.status === "ready") {
      expect(composition.topology.projection.topology).toBe(prepared.topology);
      expect(composition.topology.projection.activity).toBe(prepared.activity);
      expect(composition.topology.projection.load).toBe(prepared.load);
    }
  });

  test("ready with zero topology nodes yields empty topology state", () => {
    const ticks = listRecordedTicks(FIXTURE_RECORDING_A.events);
    const playback = createInitialPlaybackState(ticks);
    const prepared = prepareReplayProjectionAtTick(
      FIXTURE_RECORDING_A,
      1,
      createReplayProjectionCache(),
    );
    const emptyPrepared = {
      ...prepared,
      topology: {
        ...prepared.topology,
        nodes: [],
      },
    };

    const composition = deriveCompactModeComposition({
      playback,
      prepared: emptyPrepared,
      status: "ready",
    });

    expect(composition.topology).toEqual({ status: "empty" });
    expect(composition.progressVisible).toBe(false);
  });
});
