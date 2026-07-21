import { afterEach, describe, expect, mock, test } from "bun:test";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { WhalePlate } from "./WhalePlate";
import {
  DEFAULT_WHALE_PLATE_THEME,
  resolveWhalePlateTheme,
  WHALE_PLATE_DEFAULT_SRC,
  whaleEaseToCss,
} from "./whale-plate.theme";

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

describe("whale-plate.theme", () => {
  test("resolveWhalePlateTheme applies motion-whale defaults", () => {
    expect(resolveWhalePlateTheme()).toEqual({
      initialScale: DEFAULT_WHALE_PLATE_THEME.initialScale,
      initialY: DEFAULT_WHALE_PLATE_THEME.initialY,
      durationMs: DEFAULT_WHALE_PLATE_THEME.durationMs,
      ease: DEFAULT_WHALE_PLATE_THEME.ease,
      blurPx: DEFAULT_WHALE_PLATE_THEME.blurPx,
      viewAmount: DEFAULT_WHALE_PLATE_THEME.viewAmount,
      bubbleDelayMs: DEFAULT_WHALE_PLATE_THEME.bubbleDelayMs,
    });
  });

  test("resolveWhalePlateTheme accepts knob overrides", () => {
    expect(
      resolveWhalePlateTheme({
        initialScale: 0.8,
        durationMs: 2000,
        viewAmount: 0.25,
      }),
    ).toMatchObject({
      initialScale: 0.8,
      durationMs: 2000,
      viewAmount: 0.25,
    });
  });

  test("whaleEaseToCss formats the cubic bezier tuple", () => {
    expect(whaleEaseToCss([0.16, 0.84, 0.22, 1])).toBe(
      "cubic-bezier(0.16, 0.84, 0.22, 1)",
    );
  });
});

describe("WhalePlate", () => {
  afterEach(() => {
    cleanup();
    observerCallback = null;
    observedNodes = [];
    mock.restore();
  });

  test("mounts the whale image with default src and applies className", () => {
    // Avoid IO side effects for the mount-only assertion.
    globalThis.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;

    const { container } = render(<WhalePlate className="whale-host-test" />);

    const host = container.querySelector("[data-whale-plate]");
    expect(host).toBeTruthy();
    expect(host?.className).toContain("whale-host-test");
    expect(host?.getAttribute("aria-hidden")).toBe("true");
    expect(host?.getAttribute("data-whale-phase")).toBe("initial");

    const image = container.querySelector(
      "img[data-whale-plate-image]",
    ) as HTMLImageElement | null;
    expect(image).toBeTruthy();
    expect(image?.getAttribute("src")).toBe(WHALE_PLATE_DEFAULT_SRC);
  });

  test("accepts a harness-safe fixture src override", () => {
    globalThis.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;

    render(<WhalePlate src="/fixtures/whale-harness.png" />);

    const image = document.querySelector("img[data-whale-plate-image]");
    expect(image?.getAttribute("src")).toBe("/fixtures/whale-harness.png");
  });

  test("exposes default theme knobs as observable data attributes", () => {
    globalThis.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;

    render(<WhalePlate />);

    const host = document.querySelector("[data-whale-plate]");
    expect(host?.getAttribute("data-whale-initial-scale")).toBe(
      String(DEFAULT_WHALE_PLATE_THEME.initialScale),
    );
    expect(host?.getAttribute("data-whale-duration-ms")).toBe(
      String(DEFAULT_WHALE_PLATE_THEME.durationMs),
    );
    expect(host?.getAttribute("data-whale-view-amount")).toBe(
      String(DEFAULT_WHALE_PLATE_THEME.viewAmount),
    );
    expect(host?.getAttribute("data-whale-blur-px")).toBe(
      String(DEFAULT_WHALE_PLATE_THEME.blurPx),
    );
  });

  test("injected theme knobs change observable attributes", () => {
    globalThis.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;

    render(
      <WhalePlate
        theme={{ initialScale: 0.72, durationMs: 1800, blurPx: 8 }}
      />,
    );

    const host = document.querySelector("[data-whale-plate]");
    expect(host?.getAttribute("data-whale-initial-scale")).toBe("0.72");
    expect(host?.getAttribute("data-whale-duration-ms")).toBe("1800");
    expect(host?.getAttribute("data-whale-blur-px")).toBe("8");
  });

  test("starts scaled below rest and one-shot enter-view moves to rest", async () => {
    globalThis.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;

    render(<WhalePlate theme={{ durationMs: 40 }} />);

    const image = document.querySelector(
      "img[data-whale-plate-image]",
    ) as HTMLImageElement;
    expect(image.style.transform).toContain("scale(0.78)");
    expect(image.style.opacity).toBe("0.35");

    const host = document.querySelector("[data-whale-plate]");
    expect(host?.getAttribute("data-whale-phase")).toBe("initial");

    triggerIntersect(true);

    await waitFor(() => {
      expect(
        document
          .querySelector("[data-whale-plate]")
          ?.getAttribute("data-whale-phase"),
      ).toBe("entering");
    });

    expect(image.style.transform).toContain("scale(1)");
    expect(image.style.opacity).toBe("1");

    // Re-entry must not re-arm: disconnect already cleared observerCallback.
    expect(observerCallback).toBeNull();
  });

  test("fires onSettle once after entrance duration", async () => {
    globalThis.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;

    let settleCount = 0;
    render(
      <WhalePlate
        theme={{ durationMs: 30 }}
        onSettle={() => {
          settleCount += 1;
        }}
      />,
    );

    triggerIntersect(true);

    await waitFor(() => {
      expect(settleCount).toBe(1);
      expect(
        document
          .querySelector("[data-whale-plate]")
          ?.getAttribute("data-whale-phase"),
      ).toBe("settled");
    });

    expect(settleCount).toBe(1);
  });
});
