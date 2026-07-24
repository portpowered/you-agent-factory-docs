/**
 * Pure full-mode composition mapping: host playback + prepared projection →
 * controlled visualizer state contracts.
 *
 * No React, timers, or DOM. Does not import FactoryRecordingTopologyReplay.
 */

import type {
  FactoryTimelineScrubberState,
  FactoryTopologyReplayState,
} from "@you-agent-factory/factory-visualizers";
import type { PlaybackState } from "./playback-transitions";
import type { PreparedReplayProjection } from "./projection-cache";

/** Host-supplied presentation status for async / failed mounts. */
export type FullModePresentationStatus = "failed" | "loading" | "ready";

export type FullModeCompositionInput = {
  readonly playback: PlaybackState | undefined;
  readonly prepared: PreparedReplayProjection | undefined;
  readonly status: FullModePresentationStatus;
};

export type FullModeComposition = {
  readonly progressVisible: true;
  readonly selectedTick: number | undefined;
  readonly timeline: FactoryTimelineScrubberState;
  readonly topology: FactoryTopologyReplayState;
};

/**
 * Map host playback + prepared projection into scrubber / topology / progress
 * contracts. Loading and failed keep the scrubber unavailable; ready uses
 * available scrubber bounds and topology empty vs ready from node count.
 */
export function deriveFullModeComposition(
  input: FullModeCompositionInput,
): FullModeComposition {
  if (input.status === "loading") {
    return {
      progressVisible: true,
      selectedTick: undefined,
      timeline: { status: "unavailable" },
      topology: { status: "loading" },
    };
  }

  if (input.status === "failed") {
    return {
      progressVisible: true,
      selectedTick: undefined,
      timeline: { status: "unavailable" },
      topology: { status: "failed" },
    };
  }

  const playback = input.playback;
  const prepared = input.prepared;
  if (playback === undefined || prepared === undefined) {
    return {
      progressVisible: true,
      selectedTick: undefined,
      timeline: { status: "unavailable" },
      topology: { status: "empty" },
    };
  }

  const timeline: FactoryTimelineScrubberState = {
    earliestTick: playback.earliestTick,
    latestTick: playback.latestTick,
    mode: playback.mode,
    selectedTick: playback.selectedTick,
    status: "available",
  };

  const topology: FactoryTopologyReplayState =
    prepared.topology.nodes.length === 0
      ? { status: "empty" }
      : {
          projection: {
            activity: prepared.activity,
            load: prepared.load,
            topology: prepared.topology,
          },
          status: "ready",
        };

  return {
    progressVisible: true,
    selectedTick: playback.selectedTick,
    timeline,
    topology,
  };
}
