/**
 * Closeout story 005 — tip proofs for keyboard/touch accessibility, graph
 * containment contracts, and hydration-mismatch classification.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { GoalFactoryReplay } from "@/content/docs/references/packaged-factories-index/goal/GoalFactoryReplay";
import { DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES } from "@/features/factory-replay";
import {
  YOUI_COMPACT_GOAL_REPLAY_MESSAGES,
  YouiCompactGoalReplayIsland,
} from "@/features/landing-page/components/YouiCompactGoalReplayIsland";
import { PAGE_OVERFLOW_TOLERANCE_PX } from "./a11y-responsive-contract";
import {
  assertPackagedFactoryCloseoutHydrationMismatchMessage,
  assertPackagedFactoryCloseoutKeyboardFocusableControls,
  assertPackagedFactoryCloseoutNoHydrationMismatches,
  assertPackagedFactoryCloseoutPageContained,
  isPackagedFactoryCloseoutHydrationMismatchMessage,
  PACKAGED_FACTORY_CLOSEOUT_A11Y_FAMILY_ROUTES,
  PACKAGED_FACTORY_CLOSEOUT_FOLLOW_LATEST_LABEL,
  PACKAGED_FACTORY_CLOSEOUT_GRAPH_CONTAINMENT_VIEWPORTS,
  PACKAGED_FACTORY_CLOSEOUT_PAUSE_CONTROL_NAME,
  PACKAGED_FACTORY_CLOSEOUT_PLAY_CONTROL_NAME,
  PACKAGED_FACTORY_CLOSEOUT_REPLAY_REGION_LABEL,
  PACKAGED_FACTORY_CLOSEOUT_RESET_CONTROL_NAME,
  PACKAGED_FACTORY_CLOSEOUT_TIMELINE_REGION_LABEL,
  PACKAGED_FACTORY_CLOSEOUT_TIMELINE_SLIDER_LABEL,
  PackagedFactoryCloseoutA11yError,
  provePackagedFactoryReferenceFamilyCloseoutA11yContract,
} from "./packaged-factory-reference-family-closeout-a11y";

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

afterEach(() => {
  cleanup();
});

describe("packaged-factory-reference-family-closeout a11y (pure)", () => {
  test("family route and containment viewport contracts stay locked", () => {
    const evidence = provePackagedFactoryReferenceFamilyCloseoutA11yContract();
    expect(evidence.familyRoutes).toEqual([
      "parent-index",
      "goal-child",
      "deep-research-child",
      "home-youi",
    ]);
    expect(evidence.graphContainmentViewports).toEqual(["mobile", "wide"]);
    expect(evidence.pageOverflowTolerancePx).toBe(PAGE_OVERFLOW_TOLERANCE_PX);
    expect(evidence.keyboard.regionLabel).toBe(
      PACKAGED_FACTORY_CLOSEOUT_REPLAY_REGION_LABEL,
    );
    expect(PACKAGED_FACTORY_CLOSEOUT_A11Y_FAMILY_ROUTES).toHaveLength(4);
    expect(
      PACKAGED_FACTORY_CLOSEOUT_GRAPH_CONTAINMENT_VIEWPORTS.map((v) => v.width),
    ).toEqual([390, 1440]);
  });

  test("hydration classifier fails closed on mismatch text and clears clean logs", () => {
    expect(
      isPackagedFactoryCloseoutHydrationMismatchMessage(
        'Warning: Text content did not match. Server: "A" Client: "B"',
      ),
    ).toBe(true);
    expect(
      isPackagedFactoryCloseoutHydrationMismatchMessage(
        "Hydration failed because the initial UI does not match what was rendered on the server.",
      ),
    ).toBe(true);
    expect(
      isPackagedFactoryCloseoutHydrationMismatchMessage(
        "Failed to fetch chunk",
      ),
    ).toBe(false);

    expect(() =>
      assertPackagedFactoryCloseoutHydrationMismatchMessage(
        "A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.",
      ),
    ).not.toThrow();
    expect(() =>
      assertPackagedFactoryCloseoutHydrationMismatchMessage("network timeout"),
    ).toThrow(/Expected a hydration-mismatch/);

    expect(
      assertPackagedFactoryCloseoutNoHydrationMismatches("goal-child", [
        "ready",
        "chunk loaded",
      ]),
    ).toEqual({ routeId: "goal-child", hydrationMismatchCount: 0 });
    expect(() =>
      assertPackagedFactoryCloseoutNoHydrationMismatches("home-youi", [
        "Minified React error #418; Hydration mismatch",
      ]),
    ).toThrow(/hydration mismatch/);
  });

  test("page containment assert fails closed on horizontal overflow", () => {
    const clean = {
      documentElement: { clientWidth: 390, scrollWidth: 390 },
      body: { clientWidth: 390, scrollWidth: 390 },
    };
    expect(
      assertPackagedFactoryCloseoutPageContained(clean, {
        id: "mobile",
        width: 390,
      }),
    ).toEqual({
      viewportId: "mobile",
      width: 390,
      overflowPx: 0,
      contained: true,
    });

    const leaking = {
      documentElement: { clientWidth: 390, scrollWidth: 520 },
      body: { clientWidth: 390, scrollWidth: 520 },
    };
    expect(() =>
      assertPackagedFactoryCloseoutPageContained(leaking, {
        id: "mobile",
        width: 390,
      }),
    ).toThrow(/page overflow/);
  });
});

describe("packaged-factory-reference-family-closeout a11y (tip mounts)", () => {
  test("full goal replay exposes keyboard-operable Play/Pause, Reset, and timeline controls", () => {
    ensureIntersectionObserverStub();
    render(<GoalFactoryReplay />);

    const region = screen.getByRole("region", {
      name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.chrome.regionLabel,
    });
    expect(region.getAttribute("data-factory-replay-mode")).toBe("full");
    expect(region.getAttribute("data-presentation-status")).toBe("ready");

    const pausedControls =
      assertPackagedFactoryCloseoutKeyboardFocusableControls(region, {
        mode: "full",
        playing: false,
      });
    expect(pausedControls.playOrPauseName).toBe(
      PACKAGED_FACTORY_CLOSEOUT_PLAY_CONTROL_NAME,
    );
    expect(pausedControls.controlNames).toContain(
      PACKAGED_FACTORY_CLOSEOUT_RESET_CONTROL_NAME,
    );
    expect(pausedControls.controlNames).toContain(
      PACKAGED_FACTORY_CLOSEOUT_TIMELINE_SLIDER_LABEL,
    );

    expect(
      screen.getByRole("region", {
        name: PACKAGED_FACTORY_CLOSEOUT_TIMELINE_REGION_LABEL,
      }),
    ).toBeTruthy();
    // Goal sample is a single tick at latest — Follow latest stays present but
    // may be disabled (excluded from enabled focusables).
    expect(
      screen.getByRole("button", {
        name: PACKAGED_FACTORY_CLOSEOUT_FOLLOW_LATEST_LABEL,
      }),
    ).toBeTruthy();

    const play = screen.getByRole("button", {
      name: PACKAGED_FACTORY_CLOSEOUT_PLAY_CONTROL_NAME,
    });
    play.focus();
    expect(document.activeElement).toBe(play);
    fireEvent.keyDown(play, { key: "Enter", code: "Enter", charCode: 13 });
    fireEvent.click(play);
    expect(region.getAttribute("data-playing")).toBe("true");

    const pause = screen.getByRole("button", {
      name: PACKAGED_FACTORY_CLOSEOUT_PAUSE_CONTROL_NAME,
    });
    pause.focus();
    fireEvent.keyDown(pause, { key: " ", code: "Space", charCode: 32 });
    fireEvent.click(pause);
    expect(region.getAttribute("data-playing")).toBe("false");

    const afterPause = assertPackagedFactoryCloseoutKeyboardFocusableControls(
      region,
      { mode: "full", playing: false },
    );
    expect(afterPause.playOrPauseName).toBe(
      PACKAGED_FACTORY_CLOSEOUT_PLAY_CONTROL_NAME,
    );
  });

  test("compact landing Youi replay exposes keyboard-operable Play/Pause without Work progress", () => {
    ensureIntersectionObserverStub();
    render(<YouiCompactGoalReplayIsland bindDomGates={false} />);

    const region = screen.getByRole("region", {
      name: YOUI_COMPACT_GOAL_REPLAY_MESSAGES.chrome.regionLabel,
    });
    expect(region.getAttribute("data-factory-replay-mode")).toBe("compact");
    expect(region.getAttribute("data-progress-visible")).toBe("false");

    assertPackagedFactoryCloseoutKeyboardFocusableControls(region, {
      mode: "compact",
      playing: false,
    });

    const play = screen.getByRole("button", {
      name: PACKAGED_FACTORY_CLOSEOUT_PLAY_CONTROL_NAME,
    });
    play.focus();
    fireEvent.keyDown(play, { key: "Enter", code: "Enter", charCode: 13 });
    fireEvent.click(play);
    expect(region.getAttribute("data-playing")).toBe("true");

    assertPackagedFactoryCloseoutKeyboardFocusableControls(region, {
      mode: "compact",
      playing: true,
    });

    const pause = screen.getByRole("button", {
      name: PACKAGED_FACTORY_CLOSEOUT_PAUSE_CONTROL_NAME,
    });
    pause.focus();
    fireEvent.click(pause);
    expect(region.getAttribute("data-playing")).toBe("false");

    expect(
      screen.queryByRole("region", {
        name: YOUI_COMPACT_GOAL_REPLAY_MESSAGES.progress.regionLabel,
      }),
    ).toBeNull();
  });

  test("fail-closed error type remains available for a11y regressions", () => {
    const error = new PackagedFactoryCloseoutA11yError(
      "keyboard-control-missing",
      "fixture",
    );
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe("keyboard-control-missing");
    expect(error.name).toBe("PackagedFactoryCloseoutA11yError");
  });
});
