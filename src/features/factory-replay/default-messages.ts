/**
 * Default English message contracts for host-controlled factory-replay
 * composition. Callers may override any field when mounting the feature.
 */

import type { FactoryTopologyNode } from "@you-agent-factory/factory-replay";
import type {
  FactoryTimelineScrubberMessages,
  FactoryTopologyReplayMessages,
  WorkProgressVisualizerMessages,
} from "@you-agent-factory/factory-visualizers";

export type ControlledFactoryReplayChromeMessages = {
  readonly pause: string;
  readonly play: string;
  readonly regionLabel: string;
  readonly reset: string;
  readonly selectedTick: (formattedTick: string) => string;
};

export type ControlledFactoryReplayMessages = {
  readonly chrome: ControlledFactoryReplayChromeMessages;
  readonly progress: WorkProgressVisualizerMessages;
  readonly timeline: FactoryTimelineScrubberMessages;
  readonly topology: FactoryTopologyReplayMessages;
};

export const DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES: ControlledFactoryReplayMessages =
  Object.freeze({
    chrome: Object.freeze({
      pause: "Pause",
      play: "Play",
      regionLabel: "Factory replay",
      reset: "Reset",
      selectedTick: (formattedTick: string) => `Selected tick ${formattedTick}`,
    }),
    progress: Object.freeze({
      categories: Object.freeze({
        active: Object.freeze({
          plural: (count: string) => `${count} active`,
          singular: (count: string) => `${count} active`,
        }),
        completed: Object.freeze({
          plural: (count: string) => `${count} completed`,
          singular: (count: string) => `${count} completed`,
        }),
        failed: Object.freeze({
          plural: (count: string) => `${count} failed`,
          singular: (count: string) => `${count} failed`,
        }),
        queued: Object.freeze({
          plural: (count: string) => `${count} queued`,
          singular: (count: string) => `${count} queued`,
        }),
        unclassified: Object.freeze({
          plural: (count: string) => `${count} unclassified`,
          singular: (count: string) => `${count} unclassified`,
        }),
      }),
      empty: "No work progress yet.",
      regionLabel: "Work progress",
      title: "Work progress",
      total: (formattedTotal: string) => `Total ${formattedTotal}`,
    }),
    timeline: Object.freeze({
      alreadyFollowingLatest: "Already following the latest tick.",
      currentMode: "Current mode",
      disabled: "Timeline scrubber disabled.",
      followLatest: "Follow latest",
      historyMode: "History mode",
      position: (selected: string, latest: string) =>
        `Tick ${selected} of ${latest}`,
      regionLabel: "Timeline scrubber",
      sliderLabel: "Select recorded tick",
      title: "Timeline",
      unavailable: "Timeline unavailable.",
    }),
    topology: Object.freeze({
      activeDispatches: (count: number) =>
        count === 1 ? "1 active dispatch" : `${count} active dispatches`,
      annotationsHidden: "Annotations hidden",
      annotationsVisible: "Annotations visible",
      empty: "No topology to show.",
      failed: "Topology replay failed.",
      inactiveDispatches: "No active dispatches",
      imageFailed: "Topology image failed.",
      imageLoading: "Loading topology image…",
      loading: "Loading topology…",
      nodeLabel: (_kind: FactoryTopologyNode["kind"], label: string) => label,
      regionLabel: "Factory topology",
      resourceOccupancy: (occupied: number, capacity: number) =>
        `${occupied} / ${capacity}`,
      resourceOccupancyUnavailable: "Occupancy unavailable",
      retry: "Retry",
      selectedNode: "Selected node",
      workStateCount: (count: number) =>
        count === 1 ? "1 work state" : `${count} work states`,
      workStateCountUnavailable: "Work state count unavailable",
    }),
  });
