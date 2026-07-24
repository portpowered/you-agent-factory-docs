/**
 * Pure contract for home-route Youi compact goal replay browser evidence.
 *
 * The Playwright probe snapshots the live `/` page; this module classifies
 * those snapshots so unit tests can prove the acceptance matrix without a
 * browser, and the assert script stays thin.
 */

export type YouiCompactGoalReplayPreActivationSnapshot = {
  readonly activated: string | null;
  readonly contentClassName: string | null;
  readonly fallbackPresent: boolean;
  readonly foregroundClassName: string | null;
  readonly foregroundHostHeight: number;
  readonly islandPresent: boolean;
  readonly monkeyBackgroundPresent: boolean;
  readonly showcasePresent: boolean;
};

export type YouiCompactGoalReplayActivatedSnapshot = {
  readonly activated: string | null;
  readonly contentClassName: string | null;
  readonly fallbackPresent: boolean;
  readonly foregroundClassName: string | null;
  readonly islandPresent: boolean;
  readonly monkeyBackgroundPresent: boolean;
  readonly playing: string | null;
  readonly playButtonVisible: boolean;
  readonly progressVisible: string | null;
  readonly recordingId: string | null;
  readonly replayMode: string | null;
  readonly selectedTick: string | null;
  readonly selectedTickLabelVisible: boolean;
  readonly timelinePositionLabelVisible: boolean;
  readonly topologyRegionVisible: boolean;
  readonly workProgressRegionVisible: boolean;
};

export type YouiCompactGoalReplayPlaybackSnapshot = {
  readonly playingAfterPause: string | null;
  readonly playingAfterPlay: string | null;
  readonly selectedTickWhilePlaying: string | null;
  readonly selectedTickLabelWhilePlaying: boolean;
  readonly timelinePositionLabelWhilePlaying: boolean;
};

export type YouiCompactGoalReplayBrowserEvidence = {
  readonly activated: YouiCompactGoalReplayActivatedSnapshot;
  readonly playback: YouiCompactGoalReplayPlaybackSnapshot;
  readonly preActivation: YouiCompactGoalReplayPreActivationSnapshot;
};

/** Locked geometry class fragments expected on the SSR Youi shell. */
export const YOUI_BROWSER_EXPECTED_CONTENT_CLASS_FRAGMENT = "min-h-[clamp(";
export const YOUI_BROWSER_EXPECTED_FOREGROUND_CLASS_FRAGMENT =
  "max-w-[min(92vw,52rem)]";
export const YOUI_BROWSER_EXPECTED_RECORDING_ID = "packaged-goal-sample";

export function evaluateYouiCompactGoalReplayBrowserEvidence(
  evidence: YouiCompactGoalReplayBrowserEvidence,
): readonly string[] {
  const failures: string[] = [];

  const { preActivation, activated, playback } = evidence;

  if (!preActivation.showcasePresent) {
    failures.push("pre-activation: missing data-youi-showcase");
  }
  if (!preActivation.monkeyBackgroundPresent) {
    failures.push("pre-activation: missing monkey background");
  }
  if (!preActivation.fallbackPresent) {
    failures.push("pre-activation: missing static graph fallback");
  }
  if (preActivation.activated !== "false") {
    failures.push(
      `pre-activation: expected activated=false, got ${preActivation.activated}`,
    );
  }
  if (preActivation.islandPresent) {
    failures.push("pre-activation: compact replay island mounted too early");
  }
  if (preActivation.foregroundHostHeight <= 0) {
    failures.push("pre-activation: blank foreground host (height <= 0)");
  }
  if (
    !preActivation.contentClassName?.includes(
      YOUI_BROWSER_EXPECTED_CONTENT_CLASS_FRAGMENT,
    )
  ) {
    failures.push("pre-activation: content host missing clamped min-height");
  }
  if (
    !preActivation.foregroundClassName?.includes(
      YOUI_BROWSER_EXPECTED_FOREGROUND_CLASS_FRAGMENT,
    )
  ) {
    failures.push(
      "pre-activation: foreground host missing constrained max-width",
    );
  }

  if (activated.activated !== "true") {
    failures.push(
      `activated: expected activated=true after near-viewport scroll, got ${activated.activated}`,
    );
  }
  if (!activated.islandPresent) {
    failures.push("activated: missing compact goal replay island");
  }
  if (activated.recordingId !== YOUI_BROWSER_EXPECTED_RECORDING_ID) {
    failures.push(
      `activated: expected recording id ${YOUI_BROWSER_EXPECTED_RECORDING_ID}, got ${activated.recordingId}`,
    );
  }
  if (activated.replayMode !== "compact") {
    failures.push(
      `activated: expected compact replay mode, got ${activated.replayMode}`,
    );
  }
  if (!activated.topologyRegionVisible) {
    failures.push("activated: topology region not visible");
  }
  if (!activated.playButtonVisible) {
    failures.push("activated: Play control not visible");
  }
  if (!activated.selectedTickLabelVisible) {
    failures.push("activated: selected tick label not visible");
  }
  if (!activated.timelinePositionLabelVisible) {
    failures.push("activated: timeline position label not visible");
  }
  if (activated.selectedTick == null) {
    failures.push("activated: missing data-selected-tick");
  }
  if (activated.progressVisible !== "false") {
    failures.push(
      "activated: Work progress should stay hidden in compact mode",
    );
  }
  if (activated.workProgressRegionVisible) {
    failures.push("activated: Work progress region should not mount");
  }
  if (!activated.monkeyBackgroundPresent) {
    failures.push("activated: monkey background disappeared after activation");
  }
  if (!activated.fallbackPresent) {
    failures.push(
      "activated: SSR static graph fallback missing from DOM after activation",
    );
  }
  if (
    !activated.contentClassName?.includes(
      YOUI_BROWSER_EXPECTED_CONTENT_CLASS_FRAGMENT,
    )
  ) {
    failures.push("activated: content host lost clamped min-height");
  }
  if (
    !activated.foregroundClassName?.includes(
      YOUI_BROWSER_EXPECTED_FOREGROUND_CLASS_FRAGMENT,
    )
  ) {
    failures.push("activated: foreground host lost constrained max-width");
  }

  if (playback.playingAfterPlay !== "true") {
    failures.push(
      `playback: expected playing=true after Play, got ${playback.playingAfterPlay}`,
    );
  }
  if (playback.playingAfterPause !== "false") {
    failures.push(
      `playback: expected playing=false after Pause, got ${playback.playingAfterPause}`,
    );
  }
  if (playback.selectedTickWhilePlaying == null) {
    failures.push("playback: selected tick missing while playing");
  }
  if (!playback.selectedTickLabelWhilePlaying) {
    failures.push("playback: selected tick label missing while playing");
  }
  if (!playback.timelinePositionLabelWhilePlaying) {
    failures.push("playback: timeline position label missing while playing");
  }

  return failures;
}
