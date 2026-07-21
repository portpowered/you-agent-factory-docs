import { afterEach, describe, expect, mock, test } from "bun:test";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { landingHomeAssets } from "@/features/landing-page/landing-page.assets";

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

describe("FaqCtaHarnessPage", () => {
  test("stacks header, faq, cta, and footer art on skeleton bg when enabled", async () => {
    setNodeEnv("development");
    delete process.env.ENABLE_COMPONENT_EXAMPLES;

    const { default: FaqCtaHarnessPage } = await import("./page");
    const html = renderToStaticMarkup(FaqCtaHarnessPage() as ReactElement);

    expect(html).toContain('data-faq-cta-harness=""');
    expect(html).toContain("bg-neutral-200");
    expect(html).toContain('data-landing-header=""');
    expect(html).toContain('data-landing-faq-panel=""');
    expect(html).toContain('data-landing-faq-parchment=""');
    expect(html).toContain('data-landing-cta-band=""');
    expect(html).toContain('data-landing-footer-art=""');
    expect(html).toContain('data-testid="site-footer"');

    expect(html).toContain("Browse");
    expect(html).toContain('href="/browse"');
    expect(html).toContain("Guides");
    expect(html).toContain('href="/docs/guides"');
    expect(html).toContain("Blog");
    expect(html).toContain('href="/blog"');
    expect(html).toContain("References");
    expect(html).toContain('href="/docs/references"');

    expect(html).toContain("What is you-agent-factory?");
    expect(html).toContain("Install the CLI");
    expect(html).toContain(landingHomeAssets.seadragonCrop);
  });

  test("calls notFound in production unless ENABLE_COMPONENT_EXAMPLES=1", async () => {
    setNodeEnv("production");
    delete process.env.ENABLE_COMPONENT_EXAMPLES;

    const { default: FaqCtaHarnessPage } = await import("./page");
    expect(() => FaqCtaHarnessPage()).toThrow(/notFound\(\)/);

    process.env.ENABLE_COMPONENT_EXAMPLES = "1";
    const html = renderToStaticMarkup(FaqCtaHarnessPage() as ReactElement);
    expect(html).toContain('data-faq-cta-harness=""');
  });
});
