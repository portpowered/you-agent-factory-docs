/**
 * Shared host-controlled factory-replay feature.
 *
 * Stories 001–004 freeze pure playback transitions, public projection
 * preparation/cache, the single chained 2000 ms autoplay scheduler, and
 * visibility / intersection / reduced-motion gates. Later stories add
 * composition.
 */

export type {
  AutoplayGateDecision,
  AutoplayGateDocument,
  AutoplayGateDomBinding,
  AutoplayGateDomEnvironment,
  AutoplayGateMediaQueryList,
  AutoplayGateSession,
  AutoplayGateSessionOptions,
  AutoplayGateSignals,
} from "./autoplay-gates";
export {
  bindAutoplayGateDom,
  createAutoplayGateSession,
  isAutoplayAllowed,
  REDUCED_MOTION_MEDIA_QUERY,
  shouldStartPlaybackPaused,
} from "./autoplay-gates";
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
