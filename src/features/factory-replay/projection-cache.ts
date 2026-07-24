/**
 * Prepare and cache selected-tick replay projections from one injected recording.
 *
 * Uses public `@you-agent-factory/factory-replay` APIs only. Does not import
 * `FactoryRecordingTopologyReplay` or own selected-tick UI state.
 */

import type { FactoryEvent, FactoryRecording } from "@you-agent-factory/client";
import {
  canonicalizeFactoryEvents,
  type FactoryActivityProjection,
  type FactoryLoadProjection,
  type FactoryTopologyProjection,
  type FactoryWorkProgressProjection,
  projectFactoryActivityAtTick,
  projectFactoryLoadAtTick,
  projectFactoryTopologyAtTick,
  projectFactoryWorkProgressAtTick,
} from "@you-agent-factory/factory-replay";

/** Soft cap matching packaged visualizer cache behavior. */
export const MAX_CACHED_REPLAY_PROJECTIONS = 32;

export type PreparedReplayProjection = {
  readonly activity: FactoryActivityProjection;
  readonly load: FactoryLoadProjection;
  readonly progress: FactoryWorkProgressProjection;
  readonly topology: FactoryTopologyProjection;
};

/**
 * Mutable cache scoped to one recording identity. Callers own the instance
 * (for example a React ref) across selected-tick changes.
 *
 * Identity is `recording.id` plus the caller-supplied `recording.events`
 * reference. `canonicalizeFactoryEvents` always allocates a new array, so the
 * cache stores one canonicalized list per bound recording and reuses it.
 */
export type ReplayProjectionCache = {
  /** Canonicalized events for the currently bound recording. */
  events: readonly FactoryEvent[] | undefined;
  projections: Map<number, PreparedReplayProjection>;
  recordingIdentity: string | undefined;
  /** Raw `recording.events` reference used to detect same-id event swaps. */
  sourceEvents: readonly FactoryEvent[] | undefined;
};

export function createReplayProjectionCache(): ReplayProjectionCache {
  return {
    events: undefined,
    projections: new Map(),
    recordingIdentity: undefined,
    sourceEvents: undefined,
  };
}

function bindCanonicalEvents(
  cache: ReplayProjectionCache,
  recording: FactoryRecording,
): readonly FactoryEvent[] {
  const identity = recording.id;
  const sourceEvents = recording.events;
  if (
    cache.recordingIdentity === identity &&
    cache.sourceEvents === sourceEvents &&
    cache.events !== undefined
  ) {
    return cache.events;
  }

  cache.recordingIdentity = identity;
  cache.sourceEvents = sourceEvents;
  cache.events = canonicalizeFactoryEvents(sourceEvents);
  cache.projections.clear();
  return cache.events;
}

function prepareProjectionAtTick(
  events: readonly FactoryEvent[],
  tick: number,
): PreparedReplayProjection {
  return {
    activity: projectFactoryActivityAtTick({ events, tick }),
    load: projectFactoryLoadAtTick({ events, tick }),
    progress: projectFactoryWorkProgressAtTick({ events, tick }),
    topology: projectFactoryTopologyAtTick({ events, tick }),
  };
}

/**
 * Prepare topology (with activity + load) and work-progress for one tick.
 * Repeated reads of the same recording identity + tick return the same object.
 */
export function prepareReplayProjectionAtTick(
  recording: FactoryRecording,
  tick: number,
  cache: ReplayProjectionCache,
): PreparedReplayProjection {
  const events = bindCanonicalEvents(cache, recording);

  const cached = cache.projections.get(tick);
  if (cached) {
    return cached;
  }

  const projection = prepareProjectionAtTick(events, tick);
  cache.projections.set(tick, projection);

  if (cache.projections.size > MAX_CACHED_REPLAY_PROJECTIONS) {
    const oldestTick = cache.projections.keys().next().value;
    if (oldestTick !== undefined) {
      cache.projections.delete(oldestTick);
    }
  }

  return projection;
}
