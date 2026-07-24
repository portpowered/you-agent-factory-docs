import { describe, expect, test } from "bun:test";
import { FIXTURE_RECORDING_A } from "./fixtures";
import { deriveFullModeComposition } from "./full-mode-composition";
import {
  createInitialPlaybackState,
  listRecordedTicks,
} from "./playback-transitions";
import {
  createReplayProjectionCache,
  prepareReplayProjectionAtTick,
} from "./projection-cache";

describe("deriveFullModeComposition", () => {
  test("loading keeps scrubber unavailable and topology loading", () => {
    const composition = deriveFullModeComposition({
      playback: undefined,
      prepared: undefined,
      status: "loading",
    });

    expect(composition.timeline).toEqual({ status: "unavailable" });
    expect(composition.topology).toEqual({ status: "loading" });
    expect(composition.progressVisible).toBe(true);
    expect(composition.selectedTick).toBeUndefined();
  });

  test("failed keeps scrubber unavailable and topology failed", () => {
    const composition = deriveFullModeComposition({
      playback: undefined,
      prepared: undefined,
      status: "failed",
    });

    expect(composition.timeline).toEqual({ status: "unavailable" });
    expect(composition.topology).toEqual({ status: "failed" });
  });

  test("ready maps host playback and prepared projection into available scrubber and ready topology", () => {
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

    const composition = deriveFullModeComposition({
      playback: selected,
      prepared,
      status: "ready",
    });

    expect(composition.timeline).toEqual({
      earliestTick: 1,
      latestTick: 2,
      mode: "history",
      selectedTick: 1,
      status: "available",
    });
    expect(composition.topology.status).toBe("ready");
    if (composition.topology.status === "ready") {
      expect(composition.topology.projection.topology).toBe(prepared.topology);
      expect(composition.topology.projection.activity).toBe(prepared.activity);
      expect(composition.topology.projection.load).toBe(prepared.load);
    }
    expect(composition.selectedTick).toBe(1);
    expect(composition.progressVisible).toBe(true);
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

    const composition = deriveFullModeComposition({
      playback,
      prepared: emptyPrepared,
      status: "ready",
    });

    expect(composition.topology).toEqual({ status: "empty" });
    expect(composition.timeline.status).toBe("available");
  });
});
