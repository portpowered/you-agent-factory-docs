import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  WHALE_BUBBLES_FIXTURE_ITEMS,
  WHALE_BUBBLES_HARNESS_SRC,
} from "../whale-bubbles.fixtures";
import {
  WHALE_BUBBLES_FAQ_SPACER_MIN_HEIGHT,
  WHALE_BUBBLES_HARNESS_PRESETS,
  WhaleBubblesHarness,
} from "./WhaleBubblesHarness";
import { DEFAULT_WHALE_PLATE_THEME } from "./whale-plate.theme";

class MockIntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin = "";
  readonly thresholds: ReadonlyArray<number> = [];

  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

describe("WhaleBubblesHarness", () => {
  afterEach(() => {
    cleanup();
    mock.restore();
  });

  test("renders FAQ-height spacer above the whale+bubbles section", () => {
    globalThis.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;

    const { container } = render(<WhaleBubblesHarness />);

    const root = container.querySelector("[data-whale-bubbles-harness]");
    expect(root).toBeTruthy();
    expect(root?.getAttribute("data-whale-bubbles-harness-preset")).toBe(
      "default",
    );

    const spacer = container.querySelector(
      "[data-whale-bubbles-faq-spacer]",
    ) as HTMLElement;
    expect(spacer).toBeTruthy();
    expect(spacer.style.minHeight).toBe(WHALE_BUBBLES_FAQ_SPACER_MIN_HEIGHT);
    expect(spacer.textContent).toContain("FAQ parchment spacer");

    const section = container.querySelector("[data-whale-bubbles-section]");
    expect(section).toBeTruthy();

    // Spacer precedes the whale section in document order (scroll-required).
    const position = spacer.compareDocumentPosition(section as Node);
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const image = container.querySelector(
      "img[data-whale-plate-image]",
    ) as HTMLImageElement;
    expect(image?.getAttribute("src")).toBe(WHALE_BUBBLES_HARNESS_SRC);

    for (const item of WHALE_BUBBLES_FIXTURE_ITEMS) {
      expect(container.textContent).toContain(item.label);
    }

    expect(section?.getAttribute("data-whale-bubbles-delay-ms")).toBe(
      String(DEFAULT_WHALE_PLATE_THEME.bubbleDelayMs),
    );
  });

  test("theme preset control visibly changes whale knobs and bubble delay", () => {
    globalThis.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;

    const { container } = render(<WhaleBubblesHarness />);

    const select = screen.getByRole("combobox", {
      name: /theme knobs/i,
    }) as HTMLSelectElement;
    expect(select.value).toBe("default");

    fireEvent.change(select, { target: { value: "exaggerated" } });

    const root = container.querySelector("[data-whale-bubbles-harness]");
    expect(root?.getAttribute("data-whale-bubbles-harness-preset")).toBe(
      "exaggerated",
    );

    const exaggerated = WHALE_BUBBLES_HARNESS_PRESETS.exaggerated;
    const plate = container.querySelector("[data-whale-plate]");
    expect(plate?.getAttribute("data-whale-initial-scale")).toBe(
      String(exaggerated.initialScale),
    );
    expect(plate?.getAttribute("data-whale-duration-ms")).toBe(
      String(exaggerated.durationMs),
    );
    expect(plate?.getAttribute("data-whale-blur-px")).toBe(
      String(exaggerated.blurPx),
    );

    const section = container.querySelector("[data-whale-bubbles-section]");
    expect(section?.getAttribute("data-whale-bubbles-delay-ms")).toBe(
      String(exaggerated.bubbleDelayMs),
    );

    const knobs = container.querySelector("[data-whale-bubbles-harness-knobs]");
    expect(knobs?.textContent).toContain(String(exaggerated.durationMs));
    expect(knobs?.textContent).toContain(String(exaggerated.bubbleDelayMs));
  });
});
