import { afterEach, describe, expect, mock, test } from "bun:test";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LANDING_SLOT_ORDER } from "@/features/landing-page/LandingPage";
import { landingThemeToCssVars } from "@/features/landing-page/landing-page.theme";

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

describe("LandingHarnessPage", () => {
  test("renders LandingPage placeholders and theme CSS vars when enabled", async () => {
    setNodeEnv("development");
    delete process.env.ENABLE_COMPONENT_EXAMPLES;

    const { default: LandingHarnessPage } = await import("./page");
    const html = renderToStaticMarkup(LandingHarnessPage() as ReactElement);

    expect(html).toContain('data-landing-page=""');
    for (const slot of LANDING_SLOT_ORDER) {
      expect(html).toContain(`data-landing-placeholder="${slot}"`);
    }

    const vars = landingThemeToCssVars();
    expect(html).toContain(
      `--landing-whale-initial-scale:${vars["--landing-whale-initial-scale"]}`,
    );
    expect(html).toContain(
      `--landing-sphere-particle-count:${vars["--landing-sphere-particle-count"]}`,
    );
  });

  test("calls notFound in production unless ENABLE_COMPONENT_EXAMPLES=1", async () => {
    setNodeEnv("production");
    delete process.env.ENABLE_COMPONENT_EXAMPLES;

    const { default: LandingHarnessPage } = await import("./page");
    expect(() => LandingHarnessPage()).toThrow(/notFound\(\)/);

    process.env.ENABLE_COMPONENT_EXAMPLES = "1";
    const html = renderToStaticMarkup(LandingHarnessPage() as ReactElement);
    expect(html).toContain('data-landing-page=""');
  });
});
