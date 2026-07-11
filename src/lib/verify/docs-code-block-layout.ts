/**
 * Layout probes for DocsCodeBlock: horizontal scroll stays in the viewport
 * column and never overlaps the dedicated copy rail.
 */

export type DocsCodeBlockLayoutHit = {
  figure: Element;
  viewport: HTMLElement | null;
  rail: HTMLElement | null;
  copyControl: HTMLElement | null;
};

/** Collect rail/viewport/copy markers under a rendered DocsCodeBlock figure. */
export function collectDocsCodeBlockLayout(
  root: ParentNode = document,
): DocsCodeBlockLayoutHit[] {
  const figures = root.querySelectorAll(
    "figure.docs-code-block, .docs-code-block",
  );
  const hits: DocsCodeBlockLayoutHit[] = [];

  for (const figure of figures) {
    hits.push({
      figure,
      viewport: figure.querySelector(
        '[data-rich-content-scroll="code"]',
      ) as HTMLElement | null,
      rail: figure.querySelector(
        '[data-docs-code-actions="rail"]',
      ) as HTMLElement | null,
      copyControl: figure.querySelector(
        '[data-docs-code-copy="control"]',
      ) as HTMLElement | null,
    });
  }

  return hits;
}

/**
 * True when the copy control lives in the rail (not inside the scroll
 * viewport), so horizontal scroll cannot paint over the control.
 */
export function copyControlIsOutsideScrollViewport(
  hit: DocsCodeBlockLayoutHit,
): boolean {
  if (!hit.viewport || !hit.rail || !hit.copyControl) {
    return false;
  }
  if (!hit.rail.contains(hit.copyControl)) {
    return false;
  }
  if (hit.viewport.contains(hit.copyControl)) {
    return false;
  }
  // Rail and viewport must be siblings under the figure grid, not nested.
  return (
    hit.rail.parentElement === hit.figure &&
    hit.viewport.parentElement === hit.figure
  );
}

/**
 * Simulate a long-line horizontal overflow inside the code viewport and assert
 * the page/rail geometry stays independent of that scroll width.
 */
export function assertViewportScrollDoesNotOverlapRail(
  hit: DocsCodeBlockLayoutHit,
  options: {
    viewportClientWidth?: number;
    viewportScrollWidth?: number;
    railClientWidth?: number;
  } = {},
): {
  viewportCanScroll: boolean;
  railOutsideViewport: boolean;
  copyOutsideViewport: boolean;
} {
  if (!hit.viewport || !hit.rail || !hit.copyControl) {
    throw new Error("DocsCodeBlock layout markers missing");
  }

  const viewportClientWidth = options.viewportClientWidth ?? 240;
  const viewportScrollWidth = options.viewportScrollWidth ?? 900;
  const railClientWidth = options.railClientWidth ?? 40;

  Object.defineProperty(hit.viewport, "clientWidth", {
    configurable: true,
    get: () => viewportClientWidth,
  });
  Object.defineProperty(hit.viewport, "scrollWidth", {
    configurable: true,
    get: () => viewportScrollWidth,
  });
  Object.defineProperty(hit.rail, "clientWidth", {
    configurable: true,
    get: () => railClientWidth,
  });

  const viewportCanScroll = hit.viewport.scrollWidth > hit.viewport.clientWidth;
  const railOutsideViewport = !hit.viewport.contains(hit.rail);
  const copyOutsideViewport = !hit.viewport.contains(hit.copyControl);

  return {
    viewportCanScroll,
    railOutsideViewport,
    copyOutsideViewport,
  };
}
