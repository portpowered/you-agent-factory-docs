import { afterEach, describe, expect, test } from "bun:test";
import {
  assertCriticalLayoutContract,
  CRITICAL_LAYOUT_CHROME_SELECTORS,
  type CriticalLayoutSnapshot,
  captureCriticalLayoutSnapshot,
  diffLayoutSnapshots,
  evaluateContentColumnLeftEdgeAlignmentInBrowser,
  evaluateCriticalLayoutSnapshotInBrowser,
  expectLayoutSnapshotMatches,
  hashLayoutSnapshot,
  serializeLayoutSnapshot,
} from "./a11y-layout-snapshot";
import { PAGE_OVERFLOW_TOLERANCE_PX } from "./a11y-responsive-contract";

function goodPageHtml(): string {
  return `
    <header role="banner">
      <a data-docs-header-brand href="/">You Agent Factory</a>
      <nav aria-label="Primary">
        <a href="/">Home</a>
        <a href="/browse">Browse</a>
        <a href="/docs">Docs</a>
        <a href="/blog">Blog</a>
        <a href="/search">Search</a>
      </nav>
    </header>
    <main>
      <article id="nd-page" data-content-column-surface="home-article-browse">
        <h1>Factory docs</h1>
        <p>Welcome</p>
      </article>
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
    expect(snapshot.brandText).toBe("You Agent Factory");
    expect(snapshot.contentColumnSurfaces).toEqual(["home-article-browse"]);
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
    brandText: "You Agent Factory",
    contentColumnSurfaces: ["home-article-browse"],
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
      expectedBrand: "You Agent Factory",
      expectedContentColumnSurface: "home-article-browse",
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

  test("fails when brand or content-column surface regresses", () => {
    document.body.innerHTML = goodPageHtml();
    const good = captureCriticalLayoutSnapshot(document);
    assertCriticalLayoutContract(good, {
      expectedBrand: "You Agent Factory",
      expectedContentColumnSurface: "home-article-browse",
    });

    document.querySelector("a[data-docs-header-brand]")?.remove();
    const noBrand = captureCriticalLayoutSnapshot(document);
    expect(() =>
      assertCriticalLayoutContract(noBrand, {
        expectedBrand: "You Agent Factory",
      }),
    ).toThrow(/expected brand matching/);

    document.body.innerHTML = goodPageHtml();
    document
      .querySelector("[data-content-column-surface]")
      ?.removeAttribute("data-content-column-surface");
    const noSurface = captureCriticalLayoutSnapshot(document);
    expect(() =>
      assertCriticalLayoutContract(noSurface, {
        expectedContentColumnSurface: "home-article-browse",
      }),
    ).toThrow(/expected content-column surface/);
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
    expect(fromEvaluate.brandText).toEqual(fromCapture.brandText);
    expect(fromEvaluate.contentColumnSurfaces).toEqual(
      fromCapture.contentColumnSurfaces,
    );
  });
});

describe("evaluateContentColumnLeftEdgeAlignmentInBrowser", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("reports aligned when header nav column and #nd-page share a left edge", () => {
    document.body.innerHTML = `
      <header>
        <nav aria-label="Primary"><div id="nav-col">Nav</div></nav>
      </header>
      <main><article id="nd-page">Page</article></main>
    `;
    const nav = document.getElementById("nav-col") as HTMLElement;
    const page = document.getElementById("nd-page") as HTMLElement;
    for (const el of [nav, page]) {
      el.getBoundingClientRect = () =>
        ({
          x: 24,
          y: 0,
          left: 24,
          top: 0,
          width: 800,
          height: 40,
          right: 824,
          bottom: 40,
          toJSON() {
            return {};
          },
        }) as DOMRect;
    }

    const probe = evaluateContentColumnLeftEdgeAlignmentInBrowser({
      tolerancePx: 2,
    });
    expect(probe.aligned).toBe(true);
    expect(probe.deltaPx).toBe(0);
    expect(probe.headerNavLeft).toBe(24);
    expect(probe.contentColumnLeft).toBe(24);
  });
});
