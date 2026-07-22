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

  test("renders the poster-scale capability field", () => {
    const html = renderToStaticMarkup(<CapabilityStrip />);

    expect(html).toContain('data-capability-strip=""');
    expect(html).toContain('data-capability-strip-count="7"');
    expect(html).toContain('aria-label="Capabilities"');
    expect(html).toContain("<ul");
    expect(html).toContain("FLOWS");
    expect(html).toContain("AGENTS");
    expect(html).toContain("ENTRY");
    expect(html).toContain("OS");
    expect(CAPABILITY_STRIP_DEFAULT_ITEMS.map((item) => item.label)).toEqual(
      fixtureLandingPageData.capability.items.map((item) => item.label),
    );
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

  test("default poster items expose direct documentation links", () => {
    const html = renderToStaticMarkup(<CapabilityStrip />);

    expect(html).toContain("<ul");
    expect(html).toContain("<li");
    expect(html).toContain('data-capability-token="mcp"');
    expect(html).toContain('data-capability-token="api"');
    expect(html).toContain('data-capability-token="sse"');
    expect(html).toContain('data-capability-token="js"');
    expect(html).toContain('data-capability-token="graph"');
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
    expect(link.className).toContain("focus-visible:ring-[#191f2b]");

    const autoLinked = container.querySelector(
      '[data-capability-strip-item-id="agents"]',
    );
    expect(autoLinked?.querySelector("a")?.getAttribute("href")).toBe(
      "/docs/workers",
    );
    expect(autoLinked?.textContent).toContain("AGENTS");
  });

  test("poster field keeps the reference typography in one stacked column", () => {
    const html = renderToStaticMarkup(<CapabilityStrip />);

    expect(html).toContain("flex-col");
    expect(html).toContain("justify-center");
    expect(html).toContain('data-capability-copy-position="transition"');
    expect(html).toContain("pt-0");
    expect(html).toContain("text-[#191f2b]");
  });

  test("renders the painted YOU background beneath the feature copy", () => {
    const html = renderToStaticMarkup(
      <CapabilityStrip backgroundSrc="/home/you-you-you-background.png" />,
    );

    expect(html).toContain('data-capability-background=""');
    expect(html).toContain('src="/home/you-you-you-background.png"');
  });

  test("does not render the retired down-transition layer", () => {
    const html = renderToStaticMarkup(<CapabilityStrip />);

    expect(html).not.toContain("data-capability-transition");
    expect(html).not.toContain("down-transition.png");
  });
});
