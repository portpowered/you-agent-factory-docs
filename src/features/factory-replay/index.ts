/**
 * Shared host-controlled factory-replay feature.
 *
 * Frozen public client entry: `ControlledFactoryReplay` accepts one injected
 * serializable recording plus `mode: "full" | "compact"`. Callers own
 * route-level recording imports; this feature owns pure transitions, projection
 * cache, 2000 ms autoplay, gates, and full/compact composition — without
 * FactoryRecordingTopologyReplay or generated packaged-factory corpus modules.
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
export type {
  ControlledFactoryReplayMode,
  ControlledFactoryReplayProps,
} from "./controlled-factory-replay";
export { ControlledFactoryReplay } from "./controlled-factory-replay";
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
