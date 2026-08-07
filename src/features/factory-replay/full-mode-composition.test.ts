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
  // `FactoryRecording.factory` is optional upstream, but the graph cannot reach
  // its ready state without a definition — narrow once here rather than at every
  // assertion.
  const fixtureFactory = FIXTURE_RECORDING_A.factory;
  if (fixtureFactory === undefined) {
    throw new Error("FIXTURE_RECORDING_A must carry a factory definition");
  }

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
      factory: fixtureFactory,
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
      // 0.0.6 wraps the runtime projection in a FactoryGraphSource that also
      // carries the complete Factory definition and the selected tick.
      expect(composition.topology.source.runtime.topology).toBe(
        prepared.topology,
      );
      expect(composition.topology.source.runtime.activity).toBe(
        prepared.activity,
      );
      expect(composition.topology.source.runtime.load).toBe(prepared.load);
      expect(composition.topology.source.factory).toBe(fixtureFactory);
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
