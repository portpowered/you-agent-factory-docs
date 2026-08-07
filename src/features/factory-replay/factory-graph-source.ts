/**
 * Build the controlled topology state the Factory graph renderer consumes.
 *
 * `@you-agent-factory/factory-visualizers` 0.0.6 changed the `ready` variant of
 * `FactoryTopologyReplayState` from a reduced `{ projection }` payload to a
 * `FactoryGraphSource` — the complete Factory definition alongside the selected
 * tick's runtime projection. Semantic node renderers read the definition
 * directly, so a topology-only substitute is no longer sufficient.
 *
 * Pure mapping: no React, timers, or DOM.
 */

import type { FactoryDefinition } from "@you-agent-factory/client";
import type { FactoryTopologyReplayState } from "@you-agent-factory/factory-visualizers";
import type { PreparedReplayProjection } from "./projection-cache";

export type FactoryGraphSourceInput = {
  /**
   * Factory definition from the bound recording. Optional on
   * `FactoryRecording`, so a recording that omits it cannot produce a ready
   * graph.
   */
  readonly factory: Readonly<FactoryDefinition> | undefined;
  readonly prepared: PreparedReplayProjection;
  readonly selectedTick: number;
};

/**
 * Map a prepared projection onto topology state.
 *
 * Reads `empty` when the recording published no factory definition or the
 * projected topology has no nodes — the graph renders its empty state rather
 * than a partial one. Never fabricates a definition to fill the gap.
 */
export function deriveFactoryTopologyReplayState({
  factory,
  prepared,
  selectedTick,
}: FactoryGraphSourceInput): FactoryTopologyReplayState {
  if (factory === undefined || prepared.topology.nodes.length === 0) {
    return { status: "empty" };
  }

  return {
    source: {
      factory,
      runtime: {
        activity: prepared.activity,
        load: prepared.load,
        topology: prepared.topology,
      },
      selectedTick,
    },
    status: "ready",
  };
}
