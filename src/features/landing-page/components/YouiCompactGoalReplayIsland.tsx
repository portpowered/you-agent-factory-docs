/**
 * Landing-owned Youi foreground island: compact goal factory replay.
 *
 * Literally imports only `goal.factory-recording.v1.json` and mounts shared
 * `ControlledFactoryReplay` in compact mode. Cadence, visibility, intersection,
 * and reduced-motion gates come from the shared factory-replay feature — this
 * module does not invent a second autoplay timer or gate stack.
 */

"use client";

import { parseFactoryRecording } from "@you-agent-factory/client";
import type { ReactElement } from "react";
import goalRecordingJson from "@/content/docs/references/packaged-factories-index/generated/goal.factory-recording.v1.json";
import {
  ControlledFactoryReplay,
  DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES,
} from "@/features/factory-replay";
import { cn } from "@/lib/utils";

/** Parsed goal recording — only generated recording this island may import. */
export const YOUI_COMPACT_GOAL_RECORDING =
  parseFactoryRecording(goalRecordingJson);

export type YouiCompactGoalReplayIslandProps = {
  readonly bindDomGates?: boolean;
  readonly className?: string;
};

/**
 * Compact goal replay client island for the Youi showcase foreground.
 *
 * When active and ready: topology, selected-tick / timeline position, and
 * Play/Pause. No Work progress panel; no FactoryRecordingTopologyReplay.
 */
export function YouiCompactGoalReplayIsland({
  bindDomGates = true,
  className,
}: YouiCompactGoalReplayIslandProps): ReactElement {
  return (
    <div
      className={cn(
        "youi-compact-goal-replay-island absolute inset-0 z-10 flex min-h-0 flex-col overflow-hidden bg-[#191f2b]/96",
        className,
      )}
      data-youi-compact-goal-replay-island=""
      data-youi-compact-goal-recording-id={YOUI_COMPACT_GOAL_RECORDING.id}
    >
      <ControlledFactoryReplay
        bindDomGates={bindDomGates}
        className="min-h-0 flex-1 overflow-auto p-3 sm:p-4"
        mode="compact"
        recording={YOUI_COMPACT_GOAL_RECORDING}
      />
    </div>
  );
}

export {
  DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES as YOUI_COMPACT_GOAL_REPLAY_MESSAGES,
};
