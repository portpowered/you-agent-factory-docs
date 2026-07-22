import { afterEach, describe, expect, mock, test } from "bun:test";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import {
  WHALE_BUBBLES_FIXTURE_ITEMS,
  WHALE_BUBBLES_HARNESS_SRC,
} from "../whale-bubbles.fixtures";
import { WhaleBubblesSection } from "./WhaleBubblesSection";
import { DEFAULT_WHALE_PLATE_THEME } from "./whale-plate.theme";

type ObserverCallback = IntersectionObserverCallback;

let observerCallback: ObserverCallback | null = null;
let observedNodes: Element[] = [];

class MockIntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin = "";
  readonly thresholds: ReadonlyArray<number>;

  constructor(callback: ObserverCallback, options?: IntersectionObserverInit) {
    observerCallback = callback;
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

describe("WhaleBubblesSection", () => {
  afterEach(() => {
    cleanup();
    observerCallback = null;
    observedNodes = [];
    mock.restore();
  });

  test("composes whale under bubbles with fixture labels", () => {
    globalThis.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;

    const { container } = render(
      <WhaleBubblesSection whaleSrc={WHALE_BUBBLES_HARNESS_SRC} />,
    );

    const section = container.querySelector("[data-whale-bubbles-section]");
    expect(section).toBeTruthy();
    expect(section?.getAttribute("data-whale-bubbles-armed")).toBe("false");
    expect(section?.getAttribute("data-whale-bubbles-item-count")).toBe(
      String(WHALE_BUBBLES_FIXTURE_ITEMS.length),
    );
    expect(section?.getAttribute("data-whale-bubbles-delay-ms")).toBe(
      String(DEFAULT_WHALE_PLATE_THEME.bubbleDelayMs),
    );

    const plateSlot = container.querySelector(
      "[data-whale-bubbles-plate-slot]",
    );
    const clusterSlot = container.querySelector(
      "[data-whale-bubbles-cluster-slot]",
    );
    expect(plateSlot).toBeTruthy();
    expect(clusterSlot).toBeTruthy();
    expect(clusterSlot?.className).toContain("z-10");
    expect(plateSlot?.className).toContain("z-0");

    const image = container.querySelector(
      "img[data-whale-plate-image]",
    ) as HTMLImageElement;
    expect(image?.getAttribute("src")).toBe(WHALE_BUBBLES_HARNESS_SRC);

    for (const item of WHALE_BUBBLES_FIXTURE_ITEMS) {
      expect(container.textContent).toContain(item.label);
    }

    const bubbles = container.querySelector("[data-feature-bubbles]");
    expect(bubbles?.getAttribute("data-feature-bubbles-armed")).toBe("false");
    expect(bubbles?.getAttribute("data-feature-bubbles-phase")).toBe("visible");
  });

  test("arms bubbles after whale settle then reveals after delay", async () => {
    globalThis.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;

    let settleCount = 0;
    render(
      <WhaleBubblesSection
        theme={{ durationMs: 30, bubbleDelayMs: 40 }}
        whaleSrc={WHALE_BUBBLES_HARNESS_SRC}
        onSettle={() => {
          settleCount += 1;
        }}
      />,
    );

    const section = () =>
      document.querySelector("[data-whale-bubbles-section]");
    const bubbles = () => document.querySelector("[data-feature-bubbles]");

    expect(section()?.getAttribute("data-whale-bubbles-armed")).toBe("false");
    expect(bubbles()?.getAttribute("data-feature-bubbles-phase")).toBe(
      "visible",
    );

    triggerIntersect(true);

    await waitFor(() => {
      expect(settleCount).toBe(1);
      expect(section()?.getAttribute("data-whale-bubbles-armed")).toBe("true");
      expect(bubbles()?.getAttribute("data-feature-bubbles-armed")).toBe(
        "true",
      );
    });

    // Authored bubbles remain visible while their entrance motion arms.
    expect(bubbles()?.getAttribute("data-feature-bubbles-phase")).toBe(
      "visible",
    );

    await waitFor(() => {
      expect(bubbles()?.getAttribute("data-feature-bubbles-phase")).toBe(
        "visible",
      );
    });

    expect(settleCount).toBe(1);
  });

  test("empty items render a stable empty cluster without throwing", () => {
    globalThis.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;

    const { container } = render(
      <WhaleBubblesSection items={[]} whaleSrc={WHALE_BUBBLES_HARNESS_SRC} />,
    );

    const section = container.querySelector("[data-whale-bubbles-section]");
    expect(section?.getAttribute("data-whale-bubbles-item-count")).toBe("0");
    expect(container.querySelectorAll("[data-feature-bubble]")).toHaveLength(0);
  });

  test("theme bubbleDelayMs drives section and bubble delay attributes", () => {
    globalThis.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;

    render(
      <WhaleBubblesSection
        theme={{ bubbleDelayMs: 320 }}
        whaleSrc={WHALE_BUBBLES_HARNESS_SRC}
      />,
    );

    const section = document.querySelector("[data-whale-bubbles-section]");
    const bubbles = document.querySelector("[data-feature-bubbles]");
    expect(section?.getAttribute("data-whale-bubbles-delay-ms")).toBe("320");
    expect(bubbles?.getAttribute("data-feature-bubbles-delay-ms")).toBe("320");
  });

  test("uses a shared scene whale without rendering a duplicate local plate", () => {
    const { container } = render(
      <WhaleBubblesSection
        renderPlate={false}
        whaleSrc={WHALE_BUBBLES_HARNESS_SRC}
      />,
    );

    expect(
      container.querySelector("[data-whale-bubbles-plate-slot]"),
    ).toBeNull();
    expect(
      container
        .querySelector("[data-whale-bubbles-section]")
        ?.getAttribute("data-whale-bubbles-armed"),
    ).toBe("true");
    expect(
      container
        .querySelector("[data-feature-bubbles]")
        ?.getAttribute("data-feature-bubbles-armed"),
    ).toBe("true");
  });
});
