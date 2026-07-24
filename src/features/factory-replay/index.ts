/**
 * Shared host-controlled factory-replay feature.
 *
 * Stories 001–003 freeze pure playback transitions, public projection
 * preparation/cache, and the single chained 2000 ms autoplay scheduler.
 * Later stories add gates and composition.
 */

export type {
  AutoplayScheduler,
  AutoplaySchedulerSyncInput,
  AutoplaySchedulerTimers,
  AutoplayTimerHandle,
} from "./autoplay-scheduler";
export {
  AUTOPLAY_INTERVAL_MS,
  createAutoplayScheduler,
} from "./autoplay-scheduler";
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
