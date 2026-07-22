import { afterEach, describe, expect, test } from "bun:test";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  DEFAULT_BUBBLE_CLASSES,
  FeatureBubbles,
  PRIMARY_BUBBLE_CLASSES,
} from "./FeatureBubbles";
import { DEFAULT_WHALE_PLATE_THEME } from "./whale-plate.theme";

const FIXTURE_ITEMS = [
  {
    id: "flows",
    label: "Flows",
    description: "Compose persistent workflow branches.",
  },
  { id: "agents", label: "Agents", href: "#agents" },
  { id: "os", label: "OS" },
] as const;

describe("FeatureBubbles", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders fixture labels when armed with zero delay", () => {
    const { container } = render(
      <FeatureBubbles armed delayMs={0} items={[...FIXTURE_ITEMS]} />,
    );

    const host = container.querySelector("[data-feature-bubbles]");
    expect(host).toBeTruthy();
    expect(host?.getAttribute("data-feature-bubbles-phase")).toBe("visible");
    expect(host?.getAttribute("data-feature-bubbles-count")).toBe("3");

    expect(container.textContent).toContain("Flows");
    expect(container.textContent).toContain("Agents");
    expect(container.textContent).toContain("OS");
  });

  test("empty items render a stable empty cluster without throwing", () => {
    const { container } = render(
      <FeatureBubbles armed delayMs={0} items={[]} />,
    );

    const host = container.querySelector("[data-feature-bubbles]");
    expect(host).toBeTruthy();
    expect(host?.getAttribute("data-feature-bubbles-count")).toBe("0");
    expect(container.querySelectorAll("[data-feature-bubble]")).toHaveLength(0);
  });

  test("keeps the authored bubbles visible before motion arms", async () => {
    const { rerender } = render(
      <FeatureBubbles armed={false} delayMs={40} items={[...FIXTURE_ITEMS]} />,
    );

    const host = () => document.querySelector("[data-feature-bubbles]");
    expect(host()?.getAttribute("data-feature-bubbles-armed")).toBe("false");
    expect(host()?.getAttribute("data-feature-bubbles-phase")).toBe("visible");
    expect(host()?.getAttribute("data-feature-bubbles-delay-ms")).toBe("40");

    rerender(<FeatureBubbles armed delayMs={40} items={[...FIXTURE_ITEMS]} />);

    expect(host()?.getAttribute("data-feature-bubbles-armed")).toBe("true");
    expect(host()?.getAttribute("data-feature-bubbles-phase")).toBe("visible");

    await waitFor(() => {
      expect(host()?.getAttribute("data-feature-bubbles-phase")).toBe(
        "visible",
      );
    });
  });

  test("hover applies primary accent treatment distinct from default", async () => {
    const user = userEvent.setup();
    render(<FeatureBubbles armed delayMs={0} items={[...FIXTURE_ITEMS]} />);

    const bubble = document.querySelector(
      '[data-feature-bubble-id="flows"]',
    ) as HTMLElement;
    expect(bubble).toBeTruthy();
    expect(bubble.getAttribute("data-feature-bubble-primary")).toBe("false");
    expect(bubble.className).toContain(DEFAULT_BUBBLE_CLASSES.split(" ")[0]);
    expect(bubble.className).not.toContain("bg-[#f3bd3d]");

    await user.hover(bubble);

    expect(bubble.getAttribute("data-feature-bubble-primary")).toBe("true");
    expect(bubble.className).toContain("bg-[#f3bd3d]");
    for (const token of PRIMARY_BUBBLE_CLASSES.split(" ")) {
      expect(bubble.className).toContain(token);
    }

    await user.unhover(bubble);

    expect(bubble.getAttribute("data-feature-bubble-primary")).toBe("false");
    expect(bubble.className).not.toContain("bg-[#f3bd3d]");
  });

  test("keyboard focus on interactive bubble shows the same primary treatment", async () => {
    const user = userEvent.setup();
    render(<FeatureBubbles armed delayMs={0} items={[...FIXTURE_ITEMS]} />);

    const link = document.querySelector(
      '[data-feature-bubble-id="agents"]',
    ) as HTMLAnchorElement;
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe("#agents");

    await act(async () => {
      link.focus();
    });

    expect(link.getAttribute("data-feature-bubble-primary")).toBe("true");
    expect(link.className).toContain("bg-[#f3bd3d]");

    await user.tab();

    expect(link.getAttribute("data-feature-bubble-primary")).toBe("false");
  });

  test("clicking a bubble opens its animated explanatory panel", async () => {
    const user = userEvent.setup();
    render(<FeatureBubbles armed delayMs={0} items={[...FIXTURE_ITEMS]} />);

    const bubble = screen.getByRole("button", { name: "Flows" });
    await user.click(bubble);

    expect(bubble.getAttribute("aria-expanded")).toBe("true");
    const detail = document.querySelector("[data-feature-bubble-detail]");
    expect(detail).toBeTruthy();
    expect(detail?.textContent).toContain("Flows");
    expect(detail?.textContent).toContain(
      "Compose persistent workflow branches.",
    );

    await user.click(
      screen.getByRole("button", { name: "Close feature details" }),
    );
    expect(document.querySelector("[data-feature-bubble-detail]")).toBeNull();
  });

  test("defaults delayMs to whale theme bubbleDelayMs", () => {
    render(<FeatureBubbles items={[...FIXTURE_ITEMS]} />);

    const host = document.querySelector("[data-feature-bubbles]");
    expect(host?.getAttribute("data-feature-bubbles-delay-ms")).toBe(
      String(DEFAULT_WHALE_PLATE_THEME.bubbleDelayMs),
    );
  });
});
