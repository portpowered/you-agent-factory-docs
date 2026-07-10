/**
 * Pure DOM probes for page-level overflow and intentional horizontal scroll
 * containers. Safe to call from happy-dom unit tests or Playwright page.evaluate.
 */

import {
  INTENTIONAL_HORIZONTAL_SCROLL_SELECTORS,
  PAGE_OVERFLOW_TOLERANCE_PX,
} from "./a11y-responsive-contract";

export type PageOverflowMeasurement = {
  clientWidth: number;
  scrollWidth: number;
  overflowPx: number;
  hasUnintendedOverflow: boolean;
};

export type DocumentLike = {
  documentElement: {
    clientWidth: number;
    scrollWidth: number;
  };
  body: {
    clientWidth: number;
    scrollWidth: number;
  } | null;
};

/**
 * Measures whether the document/page body scrolls horizontally beyond an
 * explicit subpixel tolerance. Intentional inner scrollers are out of scope;
 * callers should assert those separately.
 */
export function measurePageLevelOverflow(
  doc: DocumentLike,
  tolerancePx: number = PAGE_OVERFLOW_TOLERANCE_PX,
): PageOverflowMeasurement {
  const root = doc.documentElement;
  const body = doc.body;
  const clientWidth = Math.max(root.clientWidth, body?.clientWidth ?? 0);
  const scrollWidth = Math.max(root.scrollWidth, body?.scrollWidth ?? 0);
  const overflowPx = Math.max(0, scrollWidth - clientWidth);
  return {
    clientWidth,
    scrollWidth,
    overflowPx,
    hasUnintendedOverflow: overflowPx > tolerancePx,
  };
}

export type IntentionalScrollContainerHit = {
  /** Matched selector, or a tag/class hint when discovered via overflow style. */
  matchedBy: string;
  clientWidth: number;
  scrollWidth: number;
  canScrollHorizontally: boolean;
};

function elementCanScrollHorizontally(element: Element): boolean {
  const htmlElement = element as HTMLElement;
  const clientWidth = htmlElement.clientWidth;
  const scrollWidth = htmlElement.scrollWidth;
  return scrollWidth > clientWidth + PAGE_OVERFLOW_TOLERANCE_PX;
}

/**
 * Finds elements that are allowed to scroll horizontally (tables/code) and
 * reports whether each currently overflows its box.
 */
export function findIntentionalHorizontalScrollContainers(
  root: ParentNode,
  selectors: readonly string[] = INTENTIONAL_HORIZONTAL_SCROLL_SELECTORS,
): IntentionalScrollContainerHit[] {
  const seen = new Set<Element>();
  const hits: IntentionalScrollContainerHit[] = [];

  for (const selector of selectors) {
    let matches: NodeListOf<Element>;
    try {
      matches = root.querySelectorAll(selector);
    } catch {
      continue;
    }
    for (const element of matches) {
      if (seen.has(element)) {
        continue;
      }
      seen.add(element);
      const htmlElement = element as HTMLElement;
      hits.push({
        matchedBy: selector,
        clientWidth: htmlElement.clientWidth,
        scrollWidth: htmlElement.scrollWidth,
        canScrollHorizontally: elementCanScrollHorizontally(element),
      });
    }
  }

  return hits;
}

/**
 * True when page-level overflow is absent while at least one intentional
 * container is allowed to scroll (or none are present yet). Used by later
 * matrix stories; kept here so the contract helpers stay cohesive.
 */
export function pageOverflowAllowsIntentionalScrollers(
  page: PageOverflowMeasurement,
  intentional: readonly IntentionalScrollContainerHit[],
): boolean {
  if (page.hasUnintendedOverflow) {
    return false;
  }
  // Absence of intentional scrollers is fine (narrow content); presence with
  // horizontal scroll is also fine as long as the page itself does not overflow.
  void intentional;
  return true;
}
