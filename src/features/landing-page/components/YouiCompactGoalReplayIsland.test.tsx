import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  YOUI_COMPACT_GOAL_RECORDING,
  YOUI_COMPACT_GOAL_REPLAY_MESSAGES,
  YouiCompactGoalReplayIsland,
} from "./YouiCompactGoalReplayIsland";
import { YouiShowcase } from "./YouiShowcase";

afterEach(() => {
  cleanup();
});

describe("YouiCompactGoalReplayIsland", () => {
  test("drives compact ControlledFactoryReplay from the goal recording only", () => {
    expect(YOUI_COMPACT_GOAL_RECORDING.id).toBe("packaged-goal-sample");
    expect(YOUI_COMPACT_GOAL_RECORDING.title).toBe(
      "goal packaged factory sample",
    );

    render(<YouiCompactGoalReplayIsland bindDomGates={false} />);

    const island = document.querySelector(
      "[data-youi-compact-goal-replay-island]",
    );
    expect(island).toBeTruthy();
    expect(island?.getAttribute("data-youi-compact-goal-recording-id")).toBe(
      "packaged-goal-sample",
    );

    const root = screen.getByRole("region", {
      name: YOUI_COMPACT_GOAL_REPLAY_MESSAGES.chrome.regionLabel,
    });
    expect(root.getAttribute("data-factory-replay-mode")).toBe("compact");
    expect(root.getAttribute("data-presentation-status")).toBe("ready");
    expect(root.getAttribute("data-progress-visible")).toBe("false");
    expect(root.getAttribute("data-selected-tick")).toBe("0");
    expect(root.className.includes("factory-recording-topology-replay")).toBe(
      false,
    );

    expect(
      screen.getByRole("region", {
        name: YOUI_COMPACT_GOAL_REPLAY_MESSAGES.topology.regionLabel,
      }),
    ).toBeTruthy();
    expect(screen.getByText("Selected tick 0")).toBeTruthy();
    expect(screen.getByText("Tick 0 of 0")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Play" })).toBeTruthy();

    expect(
      screen.queryByRole("region", {
        name: YOUI_COMPACT_GOAL_REPLAY_MESSAGES.progress.regionLabel,
      }),
    ).toBeNull();
    expect(
      screen.queryByRole("region", {
        name: YOUI_COMPACT_GOAL_REPLAY_MESSAGES.timeline.regionLabel,
      }),
    ).toBeNull();
  });

  test("Play and Pause toggle shared compact playback without a landing timer", () => {
    render(<YouiCompactGoalReplayIsland bindDomGates={false} />);

    const root = screen.getByRole("region", {
      name: YOUI_COMPACT_GOAL_REPLAY_MESSAGES.chrome.regionLabel,
    });
    expect(root.getAttribute("data-playing")).toBe("false");

    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(root.getAttribute("data-playing")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(root.getAttribute("data-playing")).toBe("false");
  });

  test("direct island mount keeps static fallback in showcase HTML when active", () => {
    const html = renderToStaticMarkup(
      <YouiShowcase
        replayIsland={<YouiCompactGoalReplayIsland bindDomGates={false} />}
      />,
    );

    expect(html).toContain('data-youi-showcase-graph-fallback=""');
    expect(html).toContain('data-youi-showcase-replay-slot=""');
    expect(html).toContain('data-youi-compact-goal-replay-island=""');
    expect(html).toContain('data-factory-replay-mode="compact"');
    expect(html).toContain(
      'data-youi-compact-goal-recording-id="packaged-goal-sample"',
    );
  });
});
