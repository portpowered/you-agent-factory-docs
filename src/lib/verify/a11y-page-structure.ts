/**
 * Pure DOM probes for critical-page landmarks, headings, and keyboard-focusable
 * controls. Safe in happy-dom unit tests or Playwright page.evaluate.
 */

export type PageLandmarkProbe = {
  hasBanner: boolean;
  hasPrimaryNavigation: boolean;
  hasMain: boolean;
  h1Count: number;
  h1Texts: string[];
  headingLevels: number[];
};

export type FocusableControlProbe = {
  tagName: string;
  role: string | null;
  name: string;
  href: string | null;
  hasFocusVisibleRingClass: boolean;
};

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

function accessibleName(element: Element): string {
  const ariaLabel = element.getAttribute("aria-label")?.trim();
  if (ariaLabel) {
    return ariaLabel;
  }
  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy) {
    const scope = element.ownerDocument ?? document;
    const parts = labelledBy
      .split(/\s+/)
      .map((id) => scope.getElementById(id)?.textContent?.trim() ?? "")
      .filter(Boolean);
    if (parts.length > 0) {
      return parts.join(" ");
    }
  }
  const htmlElement = element as HTMLElement & {
    labels?: NodeListOf<HTMLLabelElement> | null;
  };
  if (htmlElement.labels && htmlElement.labels.length > 0) {
    const fromLabels = Array.from(htmlElement.labels)
      .map((label) => (label.textContent ?? "").replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .join(" ");
    if (fromLabels) {
      return fromLabels;
    }
  }
  const id = element.getAttribute("id");
  if (id) {
    const scope = element.ownerDocument ?? document;
    const forLabel = scope.querySelector(`label[for="${CSS.escape(id)}"]`);
    const fromFor = (forLabel?.textContent ?? "").replace(/\s+/g, " ").trim();
    if (fromFor) {
      return fromFor;
    }
  }
  const title = element.getAttribute("title")?.trim();
  if (title) {
    return title;
  }
  return (element.textContent ?? "").replace(/\s+/g, " ").trim();
}

function headingLevel(element: Element): number | null {
  const match = /^H([1-6])$/i.exec(element.tagName);
  if (!match) {
    return null;
  }
  return Number(match[1]);
}

/** Probes banner/header, primary nav, main, and heading outline. */
export function probePageLandmarks(root: ParentNode): PageLandmarkProbe {
  const scope =
    root instanceof Document ? root : (root.ownerDocument ?? document);
  const banner =
    root.querySelector('header, [role="banner"]') ??
    scope.querySelector('header, [role="banner"]');
  // Docs chrome uses Primary; production landing home uses Landing.
  const siteNav =
    root.querySelector(
      'nav[aria-label="Primary"], nav[aria-label="Landing"]',
    ) ??
    scope.querySelector('nav[aria-label="Primary"], nav[aria-label="Landing"]');
  const main =
    root.querySelector('main, [role="main"]') ??
    scope.querySelector('main, [role="main"]');

  const headings = Array.from(root.querySelectorAll("h1, h2, h3, h4, h5, h6"));
  const h1s = headings.filter((el) => headingLevel(el) === 1);

  return {
    hasBanner: Boolean(banner),
    hasPrimaryNavigation: Boolean(siteNav),
    hasMain: Boolean(main),
    h1Count: h1s.length,
    h1Texts: h1s.map((el) =>
      (el.textContent ?? "").replace(/\s+/g, " ").trim(),
    ),
    headingLevels: headings
      .map((el) => headingLevel(el))
      .filter((level): level is number => level !== null),
  };
}

/** Lists interactive controls that should be keyboard reachable. */
export function listKeyboardFocusableControls(
  root: ParentNode,
): FocusableControlProbe[] {
  return Array.from(root.querySelectorAll(FOCUSABLE_SELECTOR)).map(
    (element) => {
      const htmlElement = element as HTMLElement;
      return {
        tagName: element.tagName.toLowerCase(),
        role: element.getAttribute("role"),
        name: accessibleName(element),
        href: element.getAttribute("href"),
        hasFocusVisibleRingClass:
          htmlElement.className.includes("focus-visible:ring"),
      };
    },
  );
}

/**
 * Asserts expected critical-page chrome: banner, primary nav, main, and a
 * single coherent h1. Throws with a readable message on failure.
 */
export function expectCriticalPageStructure(
  root: ParentNode,
  options: { expectedH1?: string | RegExp } = {},
): PageLandmarkProbe {
  const probe = probePageLandmarks(root);
  if (!probe.hasBanner) {
    throw new Error("Expected banner/header landmark on critical page");
  }
  if (!probe.hasPrimaryNavigation) {
    throw new Error(
      'Expected site navigation (nav aria-label="Primary" or "Landing")',
    );
  }
  if (!probe.hasMain) {
    throw new Error("Expected main landmark on critical page");
  }
  if (probe.h1Count < 1) {
    throw new Error("Expected at least one h1 on critical page");
  }
  if (options.expectedH1) {
    const expectedH1 = options.expectedH1;
    const matched = probe.h1Texts.some((text) =>
      typeof expectedH1 === "string"
        ? text === expectedH1
        : expectedH1.test(text),
    );
    if (!matched) {
      throw new Error(
        `Expected h1 matching ${String(expectedH1)}; found: ${probe.h1Texts.join(", ") || "(none)"}`,
      );
    }
  }
  return probe;
}
