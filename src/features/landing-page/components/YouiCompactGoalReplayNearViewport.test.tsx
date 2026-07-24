import { afterEach, describe, expect, mock, test } from "bun:test";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { YOUI_COMPACT_GOAL_REPLAY_MESSAGES } from "./YouiCompactGoalReplayIsland";
import {
  YOUI_COMPACT_GOAL_REPLAY_NEAR_VIEWPORT_ROOT_MARGIN,
  YOUI_COMPACT_GOAL_REPLAY_NEAR_VIEWPORT_THRESHOLD,
  YouiCompactGoalReplayNearViewport,
} from "./YouiCompactGoalReplayNearViewport";
import {
  YOUI_SHOWCASE_CONTENT_CLASSNAME,
  YOUI_SHOWCASE_FOREGROUND_CLASSNAME,
  YouiShowcase,
} from "./YouiShowcase";

type ObserverCallback = IntersectionObserverCallback;

let observerCallback: ObserverCallback | null = null;
let observedNodes: Element[] = [];
let lastObserverOptions: IntersectionObserverInit | undefined;

class MockIntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string;
  readonly thresholds: ReadonlyArray<number>;

  constructor(callback: ObserverCallback, options?: IntersectionObserverInit) {
    observerCallback = callback;
    lastObserverOptions = options;
    this.rootMargin = options?.rootMargin ?? "";
    const threshold = options?.threshold;
    this.thresholds = Array.isArray(threshold) ? threshold : [threshold ?? 0];
  }

  observe(target: Element) {
    observedNodes.push(target);
  }

  unobserve() {}

  disconnect() {
    observerCallback = null;
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

function triggerIntersect(isIntersecting = true) {
  if (!observerCallback || observedNodes.length === 0) {
    throw new Error("IntersectionObserver was not observing");
  }
  const entry = {
    isIntersecting,
    target: observedNodes[0],
    intersectionRatio: isIntersecting ? 1 : 0,
    time: 0,
    boundingClientRect: {} as DOMRectReadOnly,
    intersectionRect: {} as DOMRectReadOnly,
    rootBounds: null,
  } satisfies IntersectionObserverEntry;
  act(() => {
    observerCallback?.([entry], {} as IntersectionObserver);
  });
}

describe("YouiCompactGoalReplayNearViewport", () => {
  afterEach(() => {
    cleanup();
    observerCallback = null;
    observedNodes = [];
    lastObserverOptions = undefined;
    mock.restore();
  });

  test("keeps SSR fallback visible before near-viewport activation", () => {
    globalThis.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;

    const html = renderToStaticMarkup(
      <YouiShowcase replayIsland={<YouiCompactGoalReplayNearViewport />} />,
    );

    expect(html).toContain('data-youi-showcase-graph-fallback=""');
    expect(html).toContain('data-youi-showcase-replay-slot=""');
    expect(html).toContain('data-youi-compact-goal-replay-near-viewport=""');
    expect(html).toContain('data-youi-compact-goal-replay-activated="false"');
    expect(html).not.toContain('data-youi-compact-goal-replay-island=""');
    expect(html).not.toContain('data-factory-replay-mode="compact"');
    expect(html).toContain(YOUI_SHOWCASE_CONTENT_CLASSNAME);
    expect(html).toContain(YOUI_SHOWCASE_FOREGROUND_CLASSNAME);
  });

  test("does not mount the island until the showcase is near the viewport", async () => {
    globalThis.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;

    render(
      <YouiShowcase
        replayIsland={
          <YouiCompactGoalReplayNearViewport bindDomGates={false} />
        }
      />,
    );

    const gate = document.querySelector(
      "[data-youi-compact-goal-replay-near-viewport]",
    );
    expect(gate).toBeTruthy();
    expect(gate?.getAttribute("data-youi-compact-goal-replay-activated")).toBe(
      "false",
    );
    expect(
      document.querySelector("[data-youi-compact-goal-replay-island]"),
    ).toBeNull();
    expect(
      document.querySelector("[data-youi-showcase-graph-fallback]"),
    ).toBeTruthy();
    expect(lastObserverOptions?.rootMargin).toBe(
      YOUI_COMPACT_GOAL_REPLAY_NEAR_VIEWPORT_ROOT_MARGIN,
    );
    expect(lastObserverOptions?.threshold).toBe(
      YOUI_COMPACT_GOAL_REPLAY_NEAR_VIEWPORT_THRESHOLD,
    );

    triggerIntersect(false);
    expect(
      document.querySelector("[data-youi-compact-goal-replay-island]"),
    ).toBeNull();

    triggerIntersect(true);

    await waitFor(() => {
      expect(
        document.querySelector("[data-youi-compact-goal-replay-island]"),
      ).toBeTruthy();
    });

    const activatedGate = document.querySelector(
      "[data-youi-compact-goal-replay-near-viewport]",
    );
    expect(
      activatedGate?.getAttribute("data-youi-compact-goal-replay-activated"),
    ).toBe("true");
    expect(
      document.querySelector("[data-youi-showcase-graph-fallback]"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-youi-showcase-background]"),
    ).toBeTruthy();

    const root = screen.getByRole("region", {
      name: YOUI_COMPACT_GOAL_REPLAY_MESSAGES.chrome.regionLabel,
    });
    expect(root.getAttribute("data-factory-replay-mode")).toBe("compact");
    expect(screen.getByRole("button", { name: "Play" })).toBeTruthy();
  });

  test("activateOnMount loads the literal island module without waiting for intersection", async () => {
    globalThis.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;

    render(
      <YouiCompactGoalReplayNearViewport
        activateOnMount
        bindDomGates={false}
      />,
    );

    expect(observedNodes).toHaveLength(0);

    await waitFor(() => {
      expect(
        document.querySelector("[data-youi-compact-goal-replay-island]"),
      ).toBeTruthy();
    });

    expect(
      document
        .querySelector("[data-youi-compact-goal-replay-near-viewport]")
        ?.getAttribute("data-youi-compact-goal-replay-activated"),
    ).toBe("true");
    expect(
      screen.getByRole("region", {
        name: YOUI_COMPACT_GOAL_REPLAY_MESSAGES.chrome.regionLabel,
      }),
    ).toBeTruthy();
  });
});
