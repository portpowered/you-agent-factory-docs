/**
 * Lightweight deterministic layout snapshots for critical pages.
 *
 * Prefer this over full-page screenshot baselines: capture landmark presence,
 * key headings, primary-nav hrefs, page overflow, and rounded chrome boxes
 * (when the layout engine reports non-zero geometry). Safe in happy-dom unit
 * tests; the browser evaluator is self-contained for Playwright page.evaluate.
 */

import { PAGE_OVERFLOW_TOLERANCE_PX } from "./a11y-responsive-contract";
import { measurePageLevelOverflow } from "./a11y-responsive-probes";

/** Selectors for critical chrome regions included in layout snapshots. */
export const CRITICAL_LAYOUT_CHROME_SELECTORS = [
  'header, [role="banner"]',
  // Docs chrome uses Primary; production landing home uses Landing.
  'nav[aria-label="Primary"], nav[aria-label="Landing"]',
  'main, [role="main"]',
] as const;

export type LayoutChromeBox = {
  selector: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CriticalLayoutSnapshot = {
  hasBanner: boolean;
  hasPrimaryNavigation: boolean;
  hasMain: boolean;
  h1Texts: string[];
  primaryNavHrefs: string[];
  primaryNavLinkCount: number;
  /** Reader-visible header brand text from `a[data-docs-header-brand]`. */
  brandText: string | null;
  /** Values of `[data-content-column-surface]` markers in document order. */
  contentColumnSurfaces: string[];
  pageOverflowPx: number;
  hasUnintendedPageOverflow: boolean;
  /** Rounded integer boxes; omitted entries stay empty when geometry is zero. */
  chromeBoxes: LayoutChromeBox[];
};

export type CriticalLayoutContractOptions = {
  /** Require at least one h1 (default true). */
  requireH1?: boolean;
  /** Require zero page-level overflow (default true). */
  requireNoPageOverflow?: boolean;
  /** Optional exact or regex match against any h1 text. */
  expectedH1?: string | RegExp;
  /** Minimum primary-nav link count (default 1). */
  minPrimaryNavLinks?: number;
  /** Optional exact or regex match against header brand text. */
  expectedBrand?: string | RegExp;
  /** Optional exact content-column surface marker that must be present. */
  expectedContentColumnSurface?: string;
};

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function roundBox(rect: {
  x: number;
  y: number;
  width: number;
  height: number;
}): { x: number; y: number; width: number; height: number } {
  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}

function readChromeBox(
  root: ParentNode,
  selector: string,
): LayoutChromeBox | null {
  const element = root.querySelector(selector);
  if (
    !element ||
    typeof (element as Element).getBoundingClientRect !== "function"
  ) {
    return null;
  }
  const rect = (element as Element).getBoundingClientRect();
  if (rect.width <= 0 && rect.height <= 0) {
    return null;
  }
  const rounded = roundBox(rect);
  return {
    selector,
    ...rounded,
  };
}

/**
 * Captures a deterministic layout snapshot of critical chrome on a page root.
 */
export function captureCriticalLayoutSnapshot(
  root: ParentNode,
  options: {
    overflowTolerancePx?: number;
    chromeSelectors?: readonly string[];
  } = {},
): CriticalLayoutSnapshot {
  const scope =
    root instanceof Document ? root : (root.ownerDocument ?? document);
  const banner =
    root.querySelector('header, [role="banner"]') ??
    scope.querySelector('header, [role="banner"]');
  const siteNav =
    root.querySelector(
      'nav[aria-label="Primary"], nav[aria-label="Landing"]',
    ) ??
    scope.querySelector('nav[aria-label="Primary"], nav[aria-label="Landing"]');
  const main =
    root.querySelector('main, [role="main"]') ??
    scope.querySelector('main, [role="main"]');

  const h1Texts = Array.from(root.querySelectorAll("h1")).map((el) =>
    normalizeText(el.textContent ?? ""),
  );

  const primaryNavHrefs = siteNav
    ? Array.from(siteNav.querySelectorAll("a[href]")).map(
        (anchor) => anchor.getAttribute("href") ?? "",
      )
    : [];

  const brandEl =
    root.querySelector("a[data-docs-header-brand]") ??
    scope.querySelector("a[data-docs-header-brand]");
  const brandText = brandEl
    ? normalizeText(brandEl.textContent ?? "") || null
    : null;

  const contentColumnSurfaces = Array.from(
    root.querySelectorAll("[data-content-column-surface]"),
  ).map((el) => el.getAttribute("data-content-column-surface") ?? "");

  const overflowDoc = root instanceof Document ? root : (scope as Document);
  const overflow = measurePageLevelOverflow(
    {
      documentElement: {
        clientWidth: overflowDoc.documentElement?.clientWidth ?? 0,
        scrollWidth: overflowDoc.documentElement?.scrollWidth ?? 0,
      },
      body: overflowDoc.body
        ? {
            clientWidth: overflowDoc.body.clientWidth,
            scrollWidth: overflowDoc.body.scrollWidth,
          }
        : null,
    },
    options.overflowTolerancePx ?? PAGE_OVERFLOW_TOLERANCE_PX,
  );

  const chromeSelectors =
    options.chromeSelectors ?? CRITICAL_LAYOUT_CHROME_SELECTORS;
  const chromeBoxes: LayoutChromeBox[] = [];
  for (const selector of chromeSelectors) {
    const box = readChromeBox(root, selector);
    if (box) {
      chromeBoxes.push(box);
    }
  }

  return {
    hasBanner: Boolean(banner),
    hasPrimaryNavigation: Boolean(siteNav),
    hasMain: Boolean(main),
    h1Texts,
    primaryNavHrefs,
    primaryNavLinkCount: primaryNavHrefs.length,
    brandText,
    contentColumnSurfaces,
    pageOverflowPx: overflow.overflowPx,
    hasUnintendedPageOverflow: overflow.hasUnintendedOverflow,
    chromeBoxes,
  };
}

/**
 * Stable JSON serialization for snapshot comparison / hashing. Keys stay
 * ordered; chrome boxes are sorted by selector for determinism.
 */
export function serializeLayoutSnapshot(
  snapshot: CriticalLayoutSnapshot,
): string {
  const normalized: CriticalLayoutSnapshot = {
    ...snapshot,
    h1Texts: [...snapshot.h1Texts],
    primaryNavHrefs: [...snapshot.primaryNavHrefs],
    contentColumnSurfaces: [...snapshot.contentColumnSurfaces],
    chromeBoxes: [...snapshot.chromeBoxes].sort((a, b) =>
      a.selector.localeCompare(b.selector),
    ),
  };
  return JSON.stringify(normalized);
}

/**
 * Deterministic FNV-1a 32-bit hash of the serialized snapshot. Stable across
 * Node/Bun/browser for the same snapshot contents.
 */
export function hashLayoutSnapshot(snapshot: CriticalLayoutSnapshot): string {
  const input = serializeLayoutSnapshot(snapshot);
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/**
 * Field-level diffs between an expected baseline and an actual snapshot.
 */
export function diffLayoutSnapshots(
  expected: CriticalLayoutSnapshot,
  actual: CriticalLayoutSnapshot,
): string[] {
  const diffs: string[] = [];
  const keys: (keyof CriticalLayoutSnapshot)[] = [
    "hasBanner",
    "hasPrimaryNavigation",
    "hasMain",
    "primaryNavLinkCount",
    "pageOverflowPx",
    "hasUnintendedPageOverflow",
  ];
  for (const key of keys) {
    if (expected[key] !== actual[key]) {
      diffs.push(
        `${key}: expected ${String(expected[key])}, got ${String(actual[key])}`,
      );
    }
  }
  if (JSON.stringify(expected.h1Texts) !== JSON.stringify(actual.h1Texts)) {
    diffs.push(
      `h1Texts: expected ${JSON.stringify(expected.h1Texts)}, got ${JSON.stringify(actual.h1Texts)}`,
    );
  }
  if (
    JSON.stringify(expected.primaryNavHrefs) !==
    JSON.stringify(actual.primaryNavHrefs)
  ) {
    diffs.push(
      `primaryNavHrefs: expected ${JSON.stringify(expected.primaryNavHrefs)}, got ${JSON.stringify(actual.primaryNavHrefs)}`,
    );
  }
  if (expected.brandText !== actual.brandText) {
    diffs.push(
      `brandText: expected ${JSON.stringify(expected.brandText)}, got ${JSON.stringify(actual.brandText)}`,
    );
  }
  if (
    JSON.stringify(expected.contentColumnSurfaces) !==
    JSON.stringify(actual.contentColumnSurfaces)
  ) {
    diffs.push(
      `contentColumnSurfaces: expected ${JSON.stringify(expected.contentColumnSurfaces)}, got ${JSON.stringify(actual.contentColumnSurfaces)}`,
    );
  }
  // Chrome boxes are optional geometry — only diff when both sides recorded them.
  if (
    expected.chromeBoxes.length > 0 &&
    actual.chromeBoxes.length > 0 &&
    JSON.stringify(expected.chromeBoxes) !== JSON.stringify(actual.chromeBoxes)
  ) {
    diffs.push(
      `chromeBoxes: expected ${JSON.stringify(expected.chromeBoxes)}, got ${JSON.stringify(actual.chromeBoxes)}`,
    );
  }
  return diffs;
}

/**
 * Throws when actual diverges from the expected baseline snapshot.
 */
export function expectLayoutSnapshotMatches(
  actual: CriticalLayoutSnapshot,
  expected: CriticalLayoutSnapshot,
): void {
  const diffs = diffLayoutSnapshots(expected, actual);
  if (diffs.length > 0) {
    throw new Error(
      `Layout snapshot mismatch (hash ${hashLayoutSnapshot(actual)} vs ${hashLayoutSnapshot(expected)}):\n- ${diffs.join("\n- ")}`,
    );
  }
}

/**
 * Asserts the structural layout contract for a critical page (landmarks, h1,
 * primary nav, no page overflow). Does not require chrome box geometry so it
 * stays valid under happy-dom zero-rect layouts.
 */
export function assertCriticalLayoutContract(
  snapshot: CriticalLayoutSnapshot,
  options: CriticalLayoutContractOptions = {},
): void {
  const requireH1 = options.requireH1 ?? true;
  const requireNoPageOverflow = options.requireNoPageOverflow ?? true;
  const minPrimaryNavLinks = options.minPrimaryNavLinks ?? 1;

  if (!snapshot.hasBanner) {
    throw new Error("Layout contract: expected banner/header landmark");
  }
  if (!snapshot.hasPrimaryNavigation) {
    throw new Error(
      'Layout contract: expected site nav (aria-label="Primary" or "Landing")',
    );
  }
  if (!snapshot.hasMain) {
    throw new Error("Layout contract: expected main landmark");
  }
  if (requireH1 && snapshot.h1Texts.length < 1) {
    throw new Error("Layout contract: expected at least one h1");
  }
  if (options.expectedH1) {
    const expectedH1 = options.expectedH1;
    const matched = snapshot.h1Texts.some((text) =>
      typeof expectedH1 === "string"
        ? text === expectedH1
        : expectedH1.test(text),
    );
    if (!matched) {
      throw new Error(
        `Layout contract: expected h1 matching ${String(expectedH1)}; found: ${snapshot.h1Texts.join(", ") || "(none)"}`,
      );
    }
  }
  if (snapshot.primaryNavLinkCount < minPrimaryNavLinks) {
    throw new Error(
      `Layout contract: expected ≥${minPrimaryNavLinks} primary nav links; found ${snapshot.primaryNavLinkCount}`,
    );
  }
  if (options.expectedBrand) {
    const expectedBrand = options.expectedBrand;
    const brand = snapshot.brandText ?? "";
    const matched =
      typeof expectedBrand === "string"
        ? brand === expectedBrand
        : expectedBrand.test(brand);
    if (!matched) {
      throw new Error(
        `Layout contract: expected brand matching ${String(expectedBrand)}; found: ${snapshot.brandText ?? "(none)"}`,
      );
    }
  }
  if (options.expectedContentColumnSurface) {
    if (
      !snapshot.contentColumnSurfaces.includes(
        options.expectedContentColumnSurface,
      )
    ) {
      throw new Error(
        `Layout contract: expected content-column surface "${options.expectedContentColumnSurface}"; found: ${snapshot.contentColumnSurfaces.join(", ") || "(none)"}`,
      );
    }
  }
  if (requireNoPageOverflow && snapshot.hasUnintendedPageOverflow) {
    throw new Error(
      `Layout contract: unintended page overflow of ${snapshot.pageOverflowPx}px`,
    );
  }
}

export type LayoutSnapshotBrowserProbeArgs = {
  overflowTolerancePx: number;
  chromeSelectors: readonly string[];
};

/**
 * Self-contained Playwright `page.evaluate` helper. Do not close over module
 * imports — pass tolerance + selectors as a single argument object.
 */
export function evaluateCriticalLayoutSnapshotInBrowser(
  args: LayoutSnapshotBrowserProbeArgs,
): CriticalLayoutSnapshot {
  const normalize = (value: string): string =>
    value.replace(/\s+/g, " ").trim();

  const banner = document.querySelector('header, [role="banner"]');
  const siteNav = document.querySelector(
    'nav[aria-label="Primary"], nav[aria-label="Landing"]',
  );
  const main = document.querySelector('main, [role="main"]');
  const h1Texts = Array.from(document.querySelectorAll("h1")).map((el) =>
    normalize(el.textContent ?? ""),
  );
  const primaryNavHrefs = siteNav
    ? Array.from(siteNav.querySelectorAll("a[href]")).map(
        (anchor) => anchor.getAttribute("href") ?? "",
      )
    : [];

  const brandEl = document.querySelector("a[data-docs-header-brand]");
  const brandText = brandEl
    ? normalize(brandEl.textContent ?? "") || null
    : null;
  const contentColumnSurfaces = Array.from(
    document.querySelectorAll("[data-content-column-surface]"),
  ).map((el) => el.getAttribute("data-content-column-surface") ?? "");

  const root = document.documentElement;
  const body = document.body;
  const clientWidth = Math.max(root.clientWidth, body?.clientWidth ?? 0);
  const scrollWidth = Math.max(root.scrollWidth, body?.scrollWidth ?? 0);
  const pageOverflowPx = Math.max(0, scrollWidth - clientWidth);
  const hasUnintendedPageOverflow = pageOverflowPx > args.overflowTolerancePx;

  const chromeBoxes: LayoutChromeBox[] = [];
  for (const selector of args.chromeSelectors) {
    const element = document.querySelector(selector);
    if (!element) {
      continue;
    }
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 && rect.height <= 0) {
      continue;
    }
    chromeBoxes.push({
      selector,
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    });
  }

  return {
    hasBanner: Boolean(banner),
    hasPrimaryNavigation: Boolean(siteNav),
    hasMain: Boolean(main),
    h1Texts,
    primaryNavHrefs,
    primaryNavLinkCount: primaryNavHrefs.length,
    brandText,
    contentColumnSurfaces,
    pageOverflowPx,
    hasUnintendedPageOverflow,
    chromeBoxes,
  };
}

export type ContentColumnLeftEdgeProbe = {
  headerNavLeft: number | null;
  contentColumnLeft: number | null;
  deltaPx: number | null;
  aligned: boolean;
};

/**
 * Self-contained Playwright helper: compare header primary-nav column left
 * edge to the DocsPage `#nd-page` content column (shared inset). Surface
 * markers are asserted separately via the layout snapshot; geometry uses
 * `#nd-page` so inner article markers (home) do not double-count padding.
 */
export function evaluateContentColumnLeftEdgeAlignmentInBrowser(args: {
  tolerancePx: number;
}): ContentColumnLeftEdgeProbe {
  const navColumn = document.querySelector(
    'nav[aria-label="Primary"] > div',
  ) as HTMLElement | null;
  const contentColumn = document.querySelector(
    "#nd-page",
  ) as HTMLElement | null;

  const navRect = navColumn?.getBoundingClientRect();
  const contentRect = contentColumn?.getBoundingClientRect();
  const headerNavLeft =
    navRect && navRect.width > 0 ? Math.round(navRect.left) : null;
  const contentColumnLeft =
    contentRect && contentRect.width > 0 ? Math.round(contentRect.left) : null;

  if (headerNavLeft === null || contentColumnLeft === null) {
    return {
      headerNavLeft,
      contentColumnLeft,
      deltaPx: null,
      aligned: false,
    };
  }

  const deltaPx = Math.abs(headerNavLeft - contentColumnLeft);
  return {
    headerNavLeft,
    contentColumnLeft,
    deltaPx,
    aligned: deltaPx <= args.tolerancePx,
  };
}
