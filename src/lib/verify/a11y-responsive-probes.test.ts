import { afterEach, describe, expect, test } from "bun:test";
import {
  collectResponsiveOverflowProbe,
  evaluateResponsiveOverflowInBrowser,
  findIntentionalHorizontalScrollContainers,
  measurePageLevelOverflow,
  pageOverflowAllowsIntentionalScrollers,
} from "./a11y-responsive-probes";

describe("measurePageLevelOverflow", () => {
  test("reports no unintended overflow when scrollWidth matches clientWidth", () => {
    const measurement = measurePageLevelOverflow({
      documentElement: { clientWidth: 390, scrollWidth: 390 },
      body: { clientWidth: 390, scrollWidth: 390 },
    });

    expect(measurement.overflowPx).toBe(0);
    expect(measurement.hasUnintendedOverflow).toBe(false);
  });

  test("tolerates one CSS pixel of subpixel rounding", () => {
    const measurement = measurePageLevelOverflow({
      documentElement: { clientWidth: 390, scrollWidth: 391 },
      body: { clientWidth: 390, scrollWidth: 390 },
    });

    expect(measurement.overflowPx).toBe(1);
    expect(measurement.hasUnintendedOverflow).toBe(false);
  });

  test("flags page-level overflow beyond the tolerance", () => {
    const measurement = measurePageLevelOverflow({
      documentElement: { clientWidth: 390, scrollWidth: 520 },
      body: { clientWidth: 390, scrollWidth: 520 },
    });

    expect(measurement.overflowPx).toBe(130);
    expect(measurement.hasUnintendedOverflow).toBe(true);
  });
});

describe("findIntentionalHorizontalScrollContainers", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("detects harness matrix and pre/code overflow wrappers", () => {
    document.body.innerHTML = `
      <main>
        <div data-harness-support-matrix="" style="width: 200px; overflow-x: auto;">
          <table style="width: 800px;"><tr><td>wide</td></tr></table>
        </div>
        <div data-rich-content-scroll="code" style="width: 200px; overflow: auto;">
          <pre><code>const veryLongIdentifierThatForcesHorizontalScroll = true;</code></pre>
        </div>
        <p>narrow copy</p>
      </main>
    `;

    const matrix = document.querySelector(
      "[data-harness-support-matrix]",
    ) as HTMLElement;
    const codeViewport = document.querySelector(
      '[data-rich-content-scroll="code"]',
    ) as HTMLElement;

    // happy-dom may not layout scrollWidth from nested table width; force the
    // observable contract the probe reads so later Playwright stories share it.
    Object.defineProperty(matrix, "clientWidth", {
      configurable: true,
      get: () => 200,
    });
    Object.defineProperty(matrix, "scrollWidth", {
      configurable: true,
      get: () => 800,
    });
    Object.defineProperty(codeViewport, "clientWidth", {
      configurable: true,
      get: () => 200,
    });
    Object.defineProperty(codeViewport, "scrollWidth", {
      configurable: true,
      get: () => 640,
    });

    const hits = findIntentionalHorizontalScrollContainers(document);
    expect(hits.length).toBeGreaterThanOrEqual(2);

    const matrixHit = hits.find(
      (hit) => hit.matchedBy === "[data-harness-support-matrix]",
    );
    const codeHit = hits.find(
      (hit) => hit.matchedBy === '[data-rich-content-scroll="code"]',
    );

    expect(matrixHit?.canScrollHorizontally).toBe(true);
    expect(codeHit?.canScrollHorizontally).toBe(true);
  });

  test("page overflow helper accepts intentional scrollers when page is clean", () => {
    const page = measurePageLevelOverflow({
      documentElement: { clientWidth: 390, scrollWidth: 390 },
      body: { clientWidth: 390, scrollWidth: 390 },
    });
    const intentional = [
      {
        matchedBy: "pre",
        clientWidth: 200,
        scrollWidth: 600,
        canScrollHorizontally: true,
      },
    ];

    expect(pageOverflowAllowsIntentionalScrollers(page, intentional)).toBe(
      true,
    );
    expect(
      pageOverflowAllowsIntentionalScrollers(
        { ...page, hasUnintendedOverflow: true, overflowPx: 40 },
        intentional,
      ),
    ).toBe(false);
  });

  test("collectResponsiveOverflowProbe combines page + intentional scrollers", () => {
    document.body.innerHTML = `
      <main>
        <div data-harness-support-matrix="" class="overflow-x-auto"></div>
      </main>
    `;
    const matrix = document.querySelector(
      "[data-harness-support-matrix]",
    ) as HTMLElement;
    Object.defineProperty(matrix, "clientWidth", {
      configurable: true,
      get: () => 200,
    });
    Object.defineProperty(matrix, "scrollWidth", {
      configurable: true,
      get: () => 800,
    });
    Object.defineProperty(document.documentElement, "clientWidth", {
      configurable: true,
      get: () => 390,
    });
    Object.defineProperty(document.documentElement, "scrollWidth", {
      configurable: true,
      get: () => 390,
    });
    Object.defineProperty(document.body, "clientWidth", {
      configurable: true,
      get: () => 390,
    });
    Object.defineProperty(document.body, "scrollWidth", {
      configurable: true,
      get: () => 390,
    });

    const probe = collectResponsiveOverflowProbe(document, document);
    expect(probe.page.hasUnintendedOverflow).toBe(false);
    expect(probe.allowsIntentionalScrollers).toBe(true);
    expect(
      probe.intentional.some(
        (hit) =>
          hit.matchedBy === "[data-harness-support-matrix]" &&
          hit.canScrollHorizontally,
      ),
    ).toBe(true);
  });

  test("evaluateResponsiveOverflowInBrowser mirrors collect probe shape", () => {
    document.body.innerHTML = `<main><pre class="overflow-x-auto"></pre></main>`;
    const pre = document.querySelector("pre") as HTMLElement;
    Object.defineProperty(pre, "clientWidth", {
      configurable: true,
      get: () => 100,
    });
    Object.defineProperty(pre, "scrollWidth", {
      configurable: true,
      get: () => 400,
    });
    Object.defineProperty(document.documentElement, "clientWidth", {
      configurable: true,
      get: () => 390,
    });
    Object.defineProperty(document.documentElement, "scrollWidth", {
      configurable: true,
      get: () => 390,
    });
    Object.defineProperty(document.body, "clientWidth", {
      configurable: true,
      get: () => 390,
    });
    Object.defineProperty(document.body, "scrollWidth", {
      configurable: true,
      get: () => 390,
    });

    const probe = evaluateResponsiveOverflowInBrowser({
      selectors: ["pre", ".overflow-x-auto"],
      tolerancePx: 1,
    });
    expect(probe.hasUnintendedOverflow).toBe(false);
    expect(probe.allowsIntentionalScrollers).toBe(true);
    expect(probe.intentional.some((hit) => hit.canScrollHorizontally)).toBe(
      true,
    );
  });
});
