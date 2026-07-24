/**
 * Pure compact-mode composition mapping: host playback + prepared projection →
 * topology + visible tick/timeline position (no Work progress panel).
 *
 * No React, timers, or DOM. Does not import FactoryRecordingTopologyReplay.
 */

import type { FactoryTopologyReplayState } from "@you-agent-factory/factory-visualizers";
import type { FullModePresentationStatus } from "./full-mode-composition";
import type { PlaybackState } from "./playback-transitions";
import type { PreparedReplayProjection } from "./projection-cache";

export type CompactModePresentationStatus = FullModePresentationStatus;

export type CompactModeCompositionInput = {
  readonly playback: PlaybackState | undefined;
  readonly prepared: PreparedReplayProjection | undefined;
  readonly status: CompactModePresentationStatus;
};

export type CompactModeComposition = {
  readonly earliestTick: number | undefined;
  readonly latestTick: number | undefined;
  readonly progressVisible: false;
  readonly selectedTick: number | undefined;
  readonly topology: FactoryTopologyReplayState;
};

/**
 * Map host playback + prepared projection into compact topology + tick
 * position contracts. Loading and failed keep topology in matching status;
 * ready uses topology empty vs ready from node count. Work progress stays
 * hidden (`progressVisible: false`).
 */
export function deriveCompactModeComposition(
  input: CompactModeCompositionInput,
): CompactModeComposition {
  if (input.status === "loading") {
    return {
      earliestTick: undefined,
      latestTick: undefined,
      progressVisible: false,
      selectedTick: undefined,
      topology: { status: "loading" },
    };
  }

  if (input.status === "failed") {
    return {
      earliestTick: undefined,
      latestTick: undefined,
      progressVisible: false,
      selectedTick: undefined,
      topology: { status: "failed" },
    };
  }

  const playback = input.playback;
  const prepared = input.prepared;
  if (playback === undefined || prepared === undefined) {
    return {
      earliestTick: undefined,
      latestTick: undefined,
      progressVisible: false,
      selectedTick: undefined,
      topology: { status: "empty" },
    };
  }

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
    earliestTick: playback.earliestTick,
    latestTick: playback.latestTick,
    progressVisible: false,
    selectedTick: playback.selectedTick,
    topology,
  };
}
