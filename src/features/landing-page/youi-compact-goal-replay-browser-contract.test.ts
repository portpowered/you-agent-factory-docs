/**
 * Always-on unit coverage for the home Youi compact goal replay browser
 * evidence classifier. Live Playwright proof lives in
 * `assert-youi-compact-goal-replay-browser.ts`.
 */

import { describe, expect, test } from "bun:test";
import {
  evaluateYouiCompactGoalReplayBrowserEvidence,
  YOUI_BROWSER_EXPECTED_CONTENT_CLASS_FRAGMENT,
  YOUI_BROWSER_EXPECTED_FOREGROUND_CLASS_FRAGMENT,
  YOUI_BROWSER_EXPECTED_RECORDING_ID,
  type YouiCompactGoalReplayBrowserEvidence,
} from "./youi-compact-goal-replay-browser-contract";

function passingEvidence(): YouiCompactGoalReplayBrowserEvidence {
  return {
    preActivation: {
      showcasePresent: true,
      monkeyBackgroundPresent: true,
      fallbackPresent: true,
      activated: "false",
      islandPresent: false,
      foregroundHostHeight: 640,
      contentClassName: `relative ${YOUI_BROWSER_EXPECTED_CONTENT_CLASS_FRAGMENT}48rem,82vw,82rem)]`,
      foregroundClassName: `relative ${YOUI_BROWSER_EXPECTED_FOREGROUND_CLASS_FRAGMENT}`,
    },
    activated: {
      activated: "true",
      islandPresent: true,
      recordingId: YOUI_BROWSER_EXPECTED_RECORDING_ID,
      replayMode: "compact",
      topologyRegionVisible: true,
      playButtonVisible: true,
      selectedTickLabelVisible: true,
      timelinePositionLabelVisible: true,
      selectedTick: "0",
      playing: "false",
      progressVisible: "false",
      workProgressRegionVisible: false,
      monkeyBackgroundPresent: true,
      fallbackPresent: true,
      contentClassName: `relative ${YOUI_BROWSER_EXPECTED_CONTENT_CLASS_FRAGMENT}48rem,82vw,82rem)]`,
      foregroundClassName: `relative ${YOUI_BROWSER_EXPECTED_FOREGROUND_CLASS_FRAGMENT}`,
    },
    playback: {
      playingAfterPlay: "true",
      playingAfterPause: "false",
      selectedTickWhilePlaying: "0",
      selectedTickLabelWhilePlaying: true,
      timelinePositionLabelWhilePlaying: true,
    },
  };
}

describe("evaluateYouiCompactGoalReplayBrowserEvidence", () => {
  test("accepts a complete home-route evidence matrix", () => {
    expect(
      evaluateYouiCompactGoalReplayBrowserEvidence(passingEvidence()),
    ).toEqual([]);
  });

  test("flags blank foreground, early island mount, and missing Play/topology", () => {
    const base = passingEvidence();
    const evidence: YouiCompactGoalReplayBrowserEvidence = {
      preActivation: {
        ...base.preActivation,
        foregroundHostHeight: 0,
        islandPresent: true,
      },
      activated: {
        ...base.activated,
        topologyRegionVisible: false,
        playButtonVisible: false,
      },
      playback: {
        ...base.playback,
        playingAfterPlay: "false",
      },
    };

    const failures = evaluateYouiCompactGoalReplayBrowserEvidence(evidence);
    expect(failures).toContain(
      "pre-activation: blank foreground host (height <= 0)",
    );
    expect(failures).toContain(
      "pre-activation: compact replay island mounted too early",
    );
    expect(failures).toContain("activated: topology region not visible");
    expect(failures).toContain("activated: Play control not visible");
    expect(failures).toContain(
      "playback: expected playing=true after Play, got false",
    );
  });
});
