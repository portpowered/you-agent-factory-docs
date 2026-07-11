import { afterEach, describe, expect, test } from "bun:test";
import {
  assertCriticalLayoutContract,
  CRITICAL_LAYOUT_CHROME_SELECTORS,
  type CriticalLayoutSnapshot,
  captureCriticalLayoutSnapshot,
  diffLayoutSnapshots,
  evaluateCriticalLayoutSnapshotInBrowser,
  expectLayoutSnapshotMatches,
  hashLayoutSnapshot,
  serializeLayoutSnapshot,
} from "./a11y-layout-snapshot";
import { PAGE_OVERFLOW_TOLERANCE_PX } from "./a11y-responsive-contract";

function goodPageHtml(): string {
  return `
    <header role="banner">
      <nav aria-label="Primary">
        <a href="/">Home</a>
        <a href="/browse">Browse</a>
        <a href="/docs">Docs</a>
        <a href="/blog">Blog</a>
        <a href="/search">Search</a>
      </nav>
    </header>
    <main>
      <h1>Factory docs</h1>
      <p>Welcome</p>
    </main>
  `;
}

describe("captureCriticalLayoutSnapshot", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("captures landmarks, headings, and primary nav hrefs", () => {
    document.body.innerHTML = goodPageHtml();
    const snapshot = captureCriticalLayoutSnapshot(document);
    expect(snapshot.hasBanner).toBe(true);
    expect(snapshot.hasPrimaryNavigation).toBe(true);
    expect(snapshot.hasMain).toBe(true);
    expect(snapshot.h1Texts).toEqual(["Factory docs"]);
    expect(snapshot.primaryNavLinkCount).toBe(5);
    expect(snapshot.primaryNavHrefs).toEqual([
      "/",
      "/browse",
      "/docs",
      "/blog",
      "/search",
    ]);
    expect(snapshot.hasUnintendedPageOverflow).toBe(false);
  });

  test("reports missing landmarks when chrome is stripped", () => {
    document.body.innerHTML = `<div><p>no chrome</p></div>`;
    const snapshot = captureCriticalLayoutSnapshot(document);
    expect(snapshot.hasBanner).toBe(false);
    expect(snapshot.hasPrimaryNavigation).toBe(false);
    expect(snapshot.hasMain).toBe(false);
    expect(snapshot.h1Texts).toEqual([]);
    expect(snapshot.primaryNavLinkCount).toBe(0);
  });
});

describe("serialize / hash / diff layout snapshots", () => {
  const baseline: CriticalLayoutSnapshot = {
    hasBanner: true,
    hasPrimaryNavigation: true,
    hasMain: true,
    h1Texts: ["Factory docs"],
    primaryNavHrefs: ["/", "/browse"],
    primaryNavLinkCount: 2,
    pageOverflowPx: 0,
    hasUnintendedPageOverflow: false,
    chromeBoxes: [],
  };

  test("hash is stable for identical snapshots", () => {
    const a = hashLayoutSnapshot(baseline);
    const b = hashLayoutSnapshot({ ...baseline, chromeBoxes: [] });
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{8}$/);
  });

  test("hash changes when a meaningful field changes", () => {
    const good = hashLayoutSnapshot(baseline);
    const regress = hashLayoutSnapshot({ ...baseline, hasMain: false });
    expect(regress).not.toBe(good);
  });

  test("serialize is deterministic JSON", () => {
    expect(serializeLayoutSnapshot(baseline)).toContain('"hasMain":true');
    expect(JSON.parse(serializeLayoutSnapshot(baseline))).toEqual(baseline);
  });

  test("diffLayoutSnapshots lists field-level regressions", () => {
    const diffs = diffLayoutSnapshots(baseline, {
      ...baseline,
      hasMain: false,
      h1Texts: [],
    });
    expect(diffs.some((d) => d.startsWith("hasMain:"))).toBe(true);
    expect(diffs.some((d) => d.startsWith("h1Texts:"))).toBe(true);
  });

  test("expectLayoutSnapshotMatches passes on baseline and fails on regression", () => {
    expectLayoutSnapshotMatches(baseline, baseline);
    expect(() =>
      expectLayoutSnapshotMatches({ ...baseline, hasMain: false }, baseline),
    ).toThrow(/Layout snapshot mismatch/);
  });
});

describe("assertCriticalLayoutContract", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("passes on a good critical page and fails when main is removed", () => {
    document.body.innerHTML = goodPageHtml();
    const good = captureCriticalLayoutSnapshot(document);
    assertCriticalLayoutContract(good, {
      expectedH1: "Factory docs",
      minPrimaryNavLinks: 5,
    });

    const main = document.querySelector("main");
    main?.remove();
    const regress = captureCriticalLayoutSnapshot(document);
    expect(() => assertCriticalLayoutContract(regress)).toThrow(
      /expected main landmark/,
    );
    expect(hashLayoutSnapshot(regress)).not.toBe(hashLayoutSnapshot(good));
  });

  test("fails when h1 is removed (meaningful layout regression)", () => {
    document.body.innerHTML = goodPageHtml();
    const good = captureCriticalLayoutSnapshot(document);
    document.querySelector("h1")?.remove();
    const regress = captureCriticalLayoutSnapshot(document);
    expect(() => assertCriticalLayoutContract(regress)).toThrow(
      /expected at least one h1/,
    );
    expect(diffLayoutSnapshots(good, regress).length).toBeGreaterThan(0);
  });
});

describe("evaluateCriticalLayoutSnapshotInBrowser", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("is self-contained and mirrors capture for structural fields", () => {
    document.body.innerHTML = goodPageHtml();
    const fromCapture = captureCriticalLayoutSnapshot(document);
    const fromEvaluate = evaluateCriticalLayoutSnapshotInBrowser({
      overflowTolerancePx: PAGE_OVERFLOW_TOLERANCE_PX,
      chromeSelectors: CRITICAL_LAYOUT_CHROME_SELECTORS,
    });
    expect(fromEvaluate.hasBanner).toBe(fromCapture.hasBanner);
    expect(fromEvaluate.hasPrimaryNavigation).toBe(
      fromCapture.hasPrimaryNavigation,
    );
    expect(fromEvaluate.hasMain).toBe(fromCapture.hasMain);
    expect(fromEvaluate.h1Texts).toEqual(fromCapture.h1Texts);
    expect(fromEvaluate.primaryNavHrefs).toEqual(fromCapture.primaryNavHrefs);
  });
});
