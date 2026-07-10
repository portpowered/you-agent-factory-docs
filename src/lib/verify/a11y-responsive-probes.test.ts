import { afterEach, describe, expect, test } from "bun:test";
import {
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
        <pre class="overflow-x-auto" style="width: 200px; overflow-x: auto;">
          <code>const veryLongIdentifierThatForcesHorizontalScroll = true;</code>
        </pre>
        <p>narrow copy</p>
      </main>
    `;

    const matrix = document.querySelector(
      "[data-harness-support-matrix]",
    ) as HTMLElement;
    const pre = document.querySelector("pre") as HTMLElement;

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
    Object.defineProperty(pre, "clientWidth", {
      configurable: true,
      get: () => 200,
    });
    Object.defineProperty(pre, "scrollWidth", {
      configurable: true,
      get: () => 640,
    });

    const hits = findIntentionalHorizontalScrollContainers(document);
    expect(hits.length).toBeGreaterThanOrEqual(2);

    const matrixHit = hits.find(
      (hit) => hit.matchedBy === "[data-harness-support-matrix]",
    );
    const preHit = hits.find((hit) => hit.matchedBy === "pre");

    expect(matrixHit?.canScrollHorizontally).toBe(true);
    expect(preHit?.canScrollHorizontally).toBe(true);
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
});
