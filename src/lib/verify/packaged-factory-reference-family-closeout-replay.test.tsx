/**
 * Closeout story 003 — tip proofs for shared replay cadence, final-tick hold,
 * manual controls, cleanup, visibility gates, and shared goal recording.
 */
import { afterEach, describe, expect, test } from "bun:test";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { GoalFactoryReplay } from "@/content/docs/references/packaged-factories-index/goal/GoalFactoryReplay";
import {
  AUTOPLAY_INTERVAL_MS,
  DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES,
  useControlledFactoryReplay,
} from "@/features/factory-replay";
import {
  YOUI_COMPACT_GOAL_RECORDING,
  YOUI_COMPACT_GOAL_REPLAY_MESSAGES,
  YouiCompactGoalReplayIsland,
} from "@/features/landing-page/components/YouiCompactGoalReplayIsland";
import {
  assertPackagedFactoryCloseoutAutoplayCadenceMs,
  createPackagedFactoryCloseoutFakeTimers,
  PACKAGED_FACTORY_CLOSEOUT_AUTOPLAY_INTERVAL_MS,
  PACKAGED_FACTORY_CLOSEOUT_GOAL_RECORDING_ID,
  PackagedFactoryCloseoutReplayError,
  provePackagedFactoryCloseoutAutoplayCleanup,
  provePackagedFactoryCloseoutAutoplayGates,
  provePackagedFactoryCloseoutSharedGoalRecording,
  provePackagedFactoryCloseoutSharedPlaybackCadence,
  provePackagedFactoryReferenceFamilyCloseoutReplay,
} from "./packaged-factory-reference-family-closeout-replay";

function ensureIntersectionObserverStub(): void {
  if (typeof globalThis.IntersectionObserver === "function") {
    return;
  }
  globalThis.IntersectionObserver = class {
    disconnect(): void {}
    observe(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
    unobserve(): void {}
  } as unknown as typeof IntersectionObserver;
}

function GoalRecordingHookHarness({
  timers,
}: {
  readonly timers?: ReturnType<typeof createPackagedFactoryCloseoutFakeTimers>;
}) {
  // Stable module-level recording identity — re-parsing each render would
  // allocate new `events` and loop the playback reset effect.
  const { dispatch, playback, rootRef } = useControlledFactoryReplay({
    bindDomGates: false,
    recording: YOUI_COMPACT_GOAL_RECORDING,
    timers,
  });

  return (
    <div
      ref={rootRef}
      data-playing={String(playback.playing)}
      data-recording-id={YOUI_COMPACT_GOAL_RECORDING.id}
      data-selected-tick={String(playback.selectedTick)}
      data-testid="closeout-goal-recording-hook"
    >
      <button type="button" onClick={dispatch.play}>
        Play
      </button>
      <button type="button" onClick={dispatch.pause}>
        Pause
      </button>
    </div>
  );
}

afterEach(() => {
  cleanup();
});

describe("packaged-factory-reference-family-closeout replay (pure)", () => {
  test("cadence assert fails closed when interval drifts from 2000 ms", () => {
    expect(AUTOPLAY_INTERVAL_MS).toBe(2000);
    expect(() =>
      assertPackagedFactoryCloseoutAutoplayCadenceMs(),
    ).not.toThrow();
    expect(PACKAGED_FACTORY_CLOSEOUT_AUTOPLAY_INTERVAL_MS).toBe(2000);
  });

  test("shared playback cadence holds final tick one cadence then wraps", () => {
    const evidence = provePackagedFactoryCloseoutSharedPlaybackCadence();
    expect(evidence.autoplayIntervalMs).toBe(2000);
    expect(evidence.advancesAtCadence).toBe(true);
    expect(evidence.finalTickHeldOneCadenceBeforeWrap).toBe(true);
    expect(evidence.pendingTimeoutCountWhilePlaying).toBe(1);
  });

  test("autoplay gates pause for hidden, offscreen, and reduced motion", () => {
    const evidence = provePackagedFactoryCloseoutAutoplayGates();
    expect(evidence.hiddenPauses).toBe(true);
    expect(evidence.offscreenPauses).toBe(true);
    expect(evidence.reducedMotionGatesUntilExplicitPlay).toBe(true);
  });

  test("dispose cleanup clears pending timeout and ignores later sync", () => {
    const evidence = provePackagedFactoryCloseoutAutoplayCleanup();
    expect(evidence.disposeClearsPendingTimeout).toBe(true);
    expect(evidence.postDisposeAdvances).toBe(0);
  });

  test("shared goal recording assert fails closed on id drift", () => {
    expect(() =>
      provePackagedFactoryCloseoutSharedGoalRecording(),
    ).not.toThrow();
    expect(YOUI_COMPACT_GOAL_RECORDING.id).toBe(
      PACKAGED_FACTORY_CLOSEOUT_GOAL_RECORDING_ID,
    );
  });
});

describe("packaged-factory-reference-family-closeout replay (tip)", () => {
  test("full tip proof pack stays green", () => {
    const evidence = provePackagedFactoryReferenceFamilyCloseoutReplay();
    expect(evidence.cadence.autoplayIntervalMs).toBe(2000);
    expect(evidence.sharedGoalRecording.recordingId).toBe(
      PACKAGED_FACTORY_CLOSEOUT_GOAL_RECORDING_ID,
    );
    expect(evidence.sharedGoalRecording.goalChildRecordingId).toBe(
      evidence.sharedGoalRecording.landingRecordingId,
    );
    expect(evidence.gates.hiddenPauses).toBe(true);
    expect(evidence.cleanup.disposeClearsPendingTimeout).toBe(true);
  });

  test("goal child full-mode mount and landing compact mount share goal recording controls", () => {
    ensureIntersectionObserverStub();

    const { unmount: unmountGoal } = render(<GoalFactoryReplay />);
    const goalRoot = screen.getByRole("region", {
      name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.chrome.regionLabel,
    });
    expect(goalRoot.getAttribute("data-factory-replay-mode")).toBe("full");
    expect(goalRoot.getAttribute("data-presentation-status")).toBe("ready");
    expect(goalRoot.getAttribute("data-playing")).toBe("false");
    expect(goalRoot.getAttribute("data-selected-tick")).toBe("0");

    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(goalRoot.getAttribute("data-playing")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(goalRoot.getAttribute("data-playing")).toBe("false");
    expect(
      screen.getByRole("region", {
        name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.timeline.regionLabel,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("region", {
        name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.progress.regionLabel,
      }),
    ).toBeTruthy();
    unmountGoal();

    render(<YouiCompactGoalReplayIsland bindDomGates={false} />);
    const island = document.querySelector(
      "[data-youi-compact-goal-replay-island]",
    );
    expect(island?.getAttribute("data-youi-compact-goal-recording-id")).toBe(
      PACKAGED_FACTORY_CLOSEOUT_GOAL_RECORDING_ID,
    );

    const compactRoot = screen.getByRole("region", {
      name: YOUI_COMPACT_GOAL_REPLAY_MESSAGES.chrome.regionLabel,
    });
    expect(compactRoot.getAttribute("data-factory-replay-mode")).toBe(
      "compact",
    );
    expect(compactRoot.getAttribute("data-progress-visible")).toBe("false");
    expect(compactRoot.getAttribute("data-playing")).toBe("false");

    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(compactRoot.getAttribute("data-playing")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(compactRoot.getAttribute("data-playing")).toBe("false");
    expect(
      screen.queryByRole("region", {
        name: YOUI_COMPACT_GOAL_REPLAY_MESSAGES.progress.regionLabel,
      }),
    ).toBeNull();
  });

  test("shared hook schedules 2000 ms cadence for the generated goal recording and cleans up on unmount", () => {
    const clock = createPackagedFactoryCloseoutFakeTimers();
    const view = render(<GoalRecordingHookHarness timers={clock} />);

    const harness = screen.getByTestId("closeout-goal-recording-hook");
    expect(harness.getAttribute("data-recording-id")).toBe(
      PACKAGED_FACTORY_CLOSEOUT_GOAL_RECORDING_ID,
    );
    expect(harness.getAttribute("data-selected-tick")).toBe("0");
    expect(clock.pendingCount()).toBe(0);

    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(harness.getAttribute("data-playing")).toBe("true");
    expect(clock.pendingCount()).toBe(1);

    act(() => {
      clock.advance(AUTOPLAY_INTERVAL_MS);
    });
    // Single-tick goal sample: Advance is a no-op hold on the final tick.
    expect(harness.getAttribute("data-selected-tick")).toBe("0");
    expect(clock.pendingCount()).toBe(1);

    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(harness.getAttribute("data-playing")).toBe("false");
    expect(clock.pendingCount()).toBe(0);

    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(clock.pendingCount()).toBe(1);
    view.unmount();
    expect(clock.pendingCount()).toBe(0);
  });

  test("fail-closed error type remains available for gate regressions", () => {
    const error = new PackagedFactoryCloseoutReplayError(
      "gate-failed",
      "fixture",
    );
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe("gate-failed");
    expect(error.name).toBe("PackagedFactoryCloseoutReplayError");
  });
});
