/**
 * Shared host-controlled factory-replay feature.
 *
 * Stories 001–002 freeze pure playback transitions and public projection
 * preparation/cache. Later stories add autoplay cadence/gates and composition.
 */

export type {
  PlaybackAction,
  PlaybackMode,
  PlaybackState,
} from "./playback-transitions";
export {
  createInitialPlaybackState,
  listRecordedTicks,
  reducePlayback,
} from "./playback-transitions";

export type {
  PreparedReplayProjection,
  ReplayProjectionCache,
} from "./projection-cache";
export {
  createReplayProjectionCache,
  MAX_CACHED_REPLAY_PROJECTIONS,
  prepareReplayProjectionAtTick,
} from "./projection-cache";
