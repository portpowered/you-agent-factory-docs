import { afterEach, describe, expect, mock, test } from "bun:test";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  CAPABILITY_STRIP_DEFAULT_ITEMS,
  HERO_PORTRAIT_SIZES,
  YOUI_SHOWCASE_BACKGROUND_SIZES,
  YOUI_SHOWCASE_GRAPH_SIZES,
} from "@/features/landing-page";

mock.module("next/navigation", () => ({
  notFound: () => {
    throw new Error("notFound()");
  },
}));

type MutableEnv = Record<string, string | undefined>;

const mutableEnv = process.env as unknown as MutableEnv;
const originalNodeEnv = mutableEnv.NODE_ENV;
const originalEnableExamples = process.env.ENABLE_COMPONENT_EXAMPLES;

function setNodeEnv(value: string | undefined): void {
  if (value === undefined) {
    delete mutableEnv.NODE_ENV;
    return;
  }
  mutableEnv.NODE_ENV = value;
}

afterEach(() => {
  setNodeEnv(originalNodeEnv);
  if (originalEnableExamples === undefined) {
    delete process.env.ENABLE_COMPONENT_EXAMPLES;
  } else {
    process.env.ENABLE_COMPONENT_EXAMPLES = originalEnableExamples;
  }
});

describe("HeroArtHarnessPage", () => {
  test("stacks owned art sections with TornEdge in two places when enabled", async () => {
    setNodeEnv("development");
    delete process.env.ENABLE_COMPONENT_EXAMPLES;

    const { default: HeroArtHarnessPage } = await import("./page");
    const html = renderToStaticMarkup(HeroArtHarnessPage() as ReactElement);

    expect(html).toContain('data-hero-art-harness=""');
    expect(html).toContain('data-hero-section=""');
    expect(html).toContain('data-hero-portrait=""');
    expect(html).toContain('data-hero-section-sphere=""');
    expect(html).toContain('data-hero-section-terminal=""');
    expect(html).toContain('data-landing-placeholder="sphere"');
    expect(html).toContain('data-landing-placeholder="terminal"');
    expect(html).toContain('data-capability-strip=""');
    expect(html).toContain('data-youi-showcase=""');

    for (const item of CAPABILITY_STRIP_DEFAULT_ITEMS) {
      expect(html).toContain(item.label);
    }

    expect(html).toContain('data-hero-art-harness-torn-edge="after-hero"');
    expect(html).toContain('data-hero-art-harness-torn-edge="before-youi"');
    expect(html.match(/data-torn-edge=""/g)?.length).toBeGreaterThanOrEqual(2);

    expect(html).toContain(`sizes="${HERO_PORTRAIT_SIZES}"`);
    expect(html).toContain(`sizes="${YOUI_SHOWCASE_BACKGROUND_SIZES}"`);
    expect(html).toContain(`sizes="${YOUI_SHOWCASE_GRAPH_SIZES}"`);
    expect(html).toContain("/home/woman-head.png");
    expect(html).toContain("/home/monkey.png");
    expect(html).toContain("/home/factory-graph-ui.png");
  });

  test("calls notFound in production unless ENABLE_COMPONENT_EXAMPLES=1", async () => {
    setNodeEnv("production");
    delete process.env.ENABLE_COMPONENT_EXAMPLES;

    const { default: HeroArtHarnessPage } = await import("./page");
    expect(() => HeroArtHarnessPage()).toThrow(/notFound\(\)/);

    process.env.ENABLE_COMPONENT_EXAMPLES = "1";
    const html = renderToStaticMarkup(HeroArtHarnessPage() as ReactElement);
    expect(html).toContain('data-hero-art-harness=""');
  });
});
