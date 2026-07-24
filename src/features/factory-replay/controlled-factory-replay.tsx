/**
 * Frozen public client entry for host-controlled factory replay.
 *
 * Callers inject one serializable recording and choose full or compact mode.
 * This module does not import generated packaged-factory recordings, reference
 * pages, landing files, route loaders, dependency manifests, or global CSS.
 */

"use client";

import type { FactoryRecording } from "@you-agent-factory/client";
import type { ReactElement } from "react";
import {
  ControlledFactoryReplayCompact,
  type ControlledFactoryReplayCompactProps,
} from "./controlled-factory-replay-compact";
import {
  ControlledFactoryReplayFull,
  type ControlledFactoryReplayFullProps,
} from "./controlled-factory-replay-full";
import type { ControlledFactoryReplayMessages } from "./default-messages";
import type { FullModePresentationStatus } from "./full-mode-composition";

/** Presentation modes for the shared controlled replay surface. */
export type ControlledFactoryReplayMode = "compact" | "full";

type ControlledFactoryReplaySharedProps = {
  readonly bindDomGates?: boolean;
  readonly className?: string;
  readonly formatNumber?: (value: number) => string;
  readonly messages?: ControlledFactoryReplayMessages;
  readonly presentationStatus?: FullModePresentationStatus;
  /** Exactly one injected serializable recording — callers own route imports. */
  readonly recording: FactoryRecording;
};

export type ControlledFactoryReplayProps =
  ControlledFactoryReplaySharedProps & {
    readonly mode: ControlledFactoryReplayMode;
  };

/**
 * Public client entry: one recording + full/compact mode.
 *
 * Full mode composes timeline scrubber, topology, and work progress. Compact
 * mode composes topology, tick/timeline position, and Play/Pause only.
 */
export function ControlledFactoryReplay({
  mode,
  ...shared
}: ControlledFactoryReplayProps): ReactElement {
  if (mode === "compact") {
    const compactProps: ControlledFactoryReplayCompactProps = shared;
    return <ControlledFactoryReplayCompact {...compactProps} />;
  }

  const fullProps: ControlledFactoryReplayFullProps = shared;
  return <ControlledFactoryReplayFull {...fullProps} />;
}
