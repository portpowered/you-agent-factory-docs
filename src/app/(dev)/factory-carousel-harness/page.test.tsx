import { afterEach, describe, expect, mock, test } from "bun:test";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

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

describe("FactoryCarouselHarnessPage", () => {
  test("renders carousel harness when enabled", async () => {
    setNodeEnv("development");
    delete process.env.ENABLE_COMPONENT_EXAMPLES;

    const { default: FactoryCarouselHarnessPage } = await import("./page");
    const html = renderToStaticMarkup(
      FactoryCarouselHarnessPage() as ReactElement,
    );

    expect(html).toContain("data-factory-carousel-harness");
    expect(html).toContain("data-factory-carousel");
    expect(html).toContain("ralph");
  });

  test("calls notFound in production unless ENABLE_COMPONENT_EXAMPLES=1", async () => {
    setNodeEnv("production");
    delete process.env.ENABLE_COMPONENT_EXAMPLES;

    const { default: FactoryCarouselHarnessPage } = await import("./page");
    expect(() => FactoryCarouselHarnessPage()).toThrow(/notFound\(\)/);

    process.env.ENABLE_COMPONENT_EXAMPLES = "1";
    const html = renderToStaticMarkup(
      FactoryCarouselHarnessPage() as ReactElement,
    );
    expect(html).toContain("data-factory-carousel-harness");
  });
});
