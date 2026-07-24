/**
 * Shared host-controlled factory-replay feature.
 *
 * Stories 001–006 freeze pure playback transitions, public projection
 * preparation/cache, the single chained 2000 ms autoplay scheduler,
 * visibility / intersection / reduced-motion gates, full-mode composition,
 * and compact-mode composition with host-controlled selected tick. Later
 * stories freeze the public mode entry.
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
  CompactModeComposition,
  CompactModeCompositionInput,
  CompactModePresentationStatus,
} from "./compact-mode-composition";
export { deriveCompactModeComposition } from "./compact-mode-composition";
export type { ControlledFactoryReplayCompactProps } from "./controlled-factory-replay-compact";
export { ControlledFactoryReplayCompact } from "./controlled-factory-replay-compact";
export type { ControlledFactoryReplayFullProps } from "./controlled-factory-replay-full";
export { ControlledFactoryReplayFull } from "./controlled-factory-replay-full";
export type {
  ControlledFactoryReplayChromeMessages,
  ControlledFactoryReplayMessages,
} from "./default-messages";
export { DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES } from "./default-messages";
export type {
  FullModeComposition,
  FullModeCompositionInput,
  FullModePresentationStatus,
} from "./full-mode-composition";
export { deriveFullModeComposition } from "./full-mode-composition";
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
export type {
  ControlledFactoryReplayController,
  UseControlledFactoryReplayOptions,
} from "./use-controlled-factory-replay";
export { useControlledFactoryReplay } from "./use-controlled-factory-replay";
