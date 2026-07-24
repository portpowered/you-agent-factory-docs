/**
 * Shared host-controlled factory-replay feature.
 *
 * Story 001 freezes pure playback transitions. Later stories add projection
 * cache, autoplay cadence/gates, and full/compact composition.
 */

export {
  createInitialPlaybackState,
  listRecordedTicks,
  type PlaybackAction,
  type PlaybackMode,
  type PlaybackState,
  reducePlayback,
} from "./playback-transitions";
