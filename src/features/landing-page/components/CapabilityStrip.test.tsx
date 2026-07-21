import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { fixtureLandingPageData } from "@/features/landing-page/landing-page.data";
import {
  CAPABILITY_STRIP_DEFAULT_ITEMS,
  CapabilityStrip,
} from "./CapabilityStrip";

describe("CapabilityStrip", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders default FLOWS / AGENTS / ENTRY / OS fixture labels", () => {
    const html = renderToStaticMarkup(<CapabilityStrip />);

    expect(html).toContain('data-capability-strip=""');
    expect(html).toContain('data-capability-strip-count="4"');
    expect(html).toContain('aria-label="Capabilities"');
    expect(html).toContain("<ul");
    expect(html).toContain("FLOWS");
    expect(html).toContain("AGENTS");
    expect(html).toContain("ENTRY");
    expect(html).toContain("OS");
    expect(CAPABILITY_STRIP_DEFAULT_ITEMS.map((item) => item.label)).toEqual([
      "FLOWS",
      "AGENTS",
      "ENTRY",
      "OS",
    ]);
    expect(CAPABILITY_STRIP_DEFAULT_ITEMS).toEqual(
      fixtureLandingPageData.capability.items,
    );
  });

  test("accepts a typed items list override", () => {
    const html = renderToStaticMarkup(
      <CapabilityStrip
        className="capability-strip-host"
        items={[
          { id: "flows", label: "FLOWS" },
          { id: "agents", label: "AGENTS" },
        ]}
      />,
    );

    expect(html).toContain("capability-strip-host");
    expect(html).toContain('data-capability-strip-count="2"');
    expect(html).toContain("FLOWS");
    expect(html).toContain("AGENTS");
    expect(html).not.toContain("ENTRY");
    expect(html).not.toContain(">OS<");
  });

  test("empty items render a stable empty host without crashing", () => {
    const html = renderToStaticMarkup(<CapabilityStrip items={[]} />);

    expect(html).toContain('data-capability-strip=""');
    expect(html).toContain('data-capability-strip-count="0"');
    expect(html).not.toContain("data-capability-strip-item");
    expect(html).not.toContain("FLOWS");
  });

  test("non-interactive items use list semantics without links", () => {
    const html = renderToStaticMarkup(<CapabilityStrip />);

    expect(html).toContain("<ul");
    expect(html).toContain("<li");
    expect(html).not.toContain("data-capability-strip-link");
    expect(html).not.toContain("<a ");
  });

  test("items with href are keyboard-focusable links with focus treatment", () => {
    const { container } = render(
      <CapabilityStrip
        items={[
          { id: "flows", label: "FLOWS", href: "#flows" },
          { id: "agents", label: "AGENTS" },
        ]}
      />,
    );

    const link = container.querySelector(
      '[data-capability-strip-item-id="flows"] a',
    ) as HTMLAnchorElement;
    expect(link).toBeTruthy();
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe("#flows");
    expect(link.className).toContain("focus-visible:ring-2");
    expect(link.className).toContain("focus-visible:ring-ring");

    const plain = container.querySelector(
      '[data-capability-strip-item-id="agents"]',
    );
    expect(plain?.querySelector("a")).toBeNull();
    expect(plain?.textContent).toContain("AGENTS");
  });

  test("horizontal strip classes wrap on narrow viewports", () => {
    const html = renderToStaticMarkup(<CapabilityStrip />);

    expect(html).toContain("flex");
    expect(html).toContain("flex-wrap");
  });
});
