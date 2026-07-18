/**
 * W08 story 010 a11y / responsive / print verification contract.
 *
 * Pure helpers for desktop/tablet/phone overflow probes, keyboard focus
 * affordances, reduced-motion hash-focus expectations, and print readability
 * (method/path/summary + request/response remain visible without hover-only
 * facts). Browser probes exercise these against `/api-renderer-harness`.
 */

import {
  API_PARAMETERS_ATTR,
  API_REQUEST_BODY_ATTR,
  API_RESPONSES_ATTR,
} from "./operation-detail";

/** Marker on the API print root (harness or future production page). */
export const API_PRINT_ROOT_ATTR = "data-api-reference-print" as const;

/**
 * Marker on interactive chrome that should not clutter printed pages
 * (filter, navigators, copy-link buttons). Value is always `"hide"`.
 */
export const API_PRINT_CHROME_ATTR = "data-api-print-chrome" as const;

/** Marker on operation content that must remain readable when printing. */
export const API_PRINT_CONTENT_ATTR = "data-api-print-content" as const;

/** Value for {@link API_PRINT_CHROME_ATTR}. */
export const API_PRINT_CHROME_HIDE = "hide" as const;

/**
 * Desktop / tablet / phone viewports for W08 overflow verification.
 * Aligns with critical a11y matrix widths (mobile 390, tablet 768, wide 1440).
 */
export const API_VERIFICATION_VIEWPORTS = [
  { id: "phone", label: "Phone", width: 390, height: 844 },
  { id: "tablet", label: "Tablet", width: 768, height: 1024 },
  { id: "desktop", label: "Desktop", width: 1440, height: 900 },
] as const;

export type ApiVerificationViewport =
  (typeof API_VERIFICATION_VIEWPORTS)[number];

/**
 * Print policy: hide chrome, keep core operation facts readable without
 * relying on hover-only presentation.
 */
export const API_PRINT_POLICY = {
  hideChromeSelectors: [
    `[${API_PRINT_CHROME_ATTR}="${API_PRINT_CHROME_HIDE}"]`,
  ] as const,
  keepReadableFacts: [
    "method",
    "path",
    "summary",
    "parameters",
    "request-body",
    "responses",
  ] as const,
  hoverOnlyFactsForbidden: true,
  stylesheetImport: "@/features/docs/styles/references-api-print.css" as const,
  notes:
    "Print styles hide filter/nav/copy chrome and keep method/path/summary plus request/response content readable. Do not rely on hover-only text for those facts.",
} as const;

/**
 * Primary interactive controls that must remain keyboard operable with
 * visible focus rings on the production API surface.
 */
export const API_KEYBOARD_CONTROL_SELECTORS = [
  '[data-api-operation-filter="input"]',
  '[data-api-operation-filter="clear"]',
  `[${API_PRINT_CHROME_ATTR}="${API_PRINT_CHROME_HIDE}"] summary`,
  "[data-api-operation-nav-link]",
  "[data-api-operation-copy-link]",
] as const;

export type ApiPrintReadableFacts = {
  method: string | null;
  path: string | null;
  summary: string | null;
  hasParametersRegion: boolean;
  hasRequestBodyRegion: boolean;
  hasResponsesRegion: boolean;
  hoverOnlyFacts: boolean;
};

/**
 * Reads print-critical facts from an operation section. Method/path/summary
 * must come from accessible text nodes (not hover-only titles).
 */
export function probeApiPrintReadableFacts(
  section: Element,
): ApiPrintReadableFacts {
  const method =
    section.getAttribute("data-api-operation-method") ??
    section.querySelector("[data-api-method-badge]")?.textContent?.trim() ??
    null;
  const path =
    section.getAttribute("data-api-operation-path") ??
    section.querySelector("h2 code, h2")?.textContent?.trim() ??
    null;
  const summary =
    section
      .querySelector("[data-api-operation-summary]")
      ?.textContent?.trim() ?? null;

  const resolvedMethod = method && method.length > 0 ? method : null;
  const resolvedPath = path && path.length > 0 ? path : null;
  const resolvedSummary = summary && summary.length > 0 ? summary : null;

  return {
    method: resolvedMethod,
    path: resolvedPath,
    summary: resolvedSummary,
    hasParametersRegion:
      section.querySelector(`[${API_PARAMETERS_ATTR}]`) !== null,
    hasRequestBodyRegion:
      section.querySelector(`[${API_REQUEST_BODY_ATTR}]`) !== null,
    hasResponsesRegion:
      section.querySelector(`[${API_RESPONSES_ATTR}]`) !== null,
    // Hover-only presentation would omit method/path from attributes + text.
    hoverOnlyFacts: resolvedMethod === null || resolvedPath === null,
  };
}

/**
 * True when a className string includes the site focus-visible ring pattern
 * used across the API surface.
 */
export function hasApiVisibleFocusRingClass(className: string): boolean {
  return (
    className.includes("focus-visible:ring") ||
    className.includes("focus-visible:outline")
  );
}

/**
 * Collects keyboard-operable primary controls under a root and reports whether
 * each carries a visible focus-ring utility class.
 */
export function probeApiKeyboardControls(root: ParentNode): Array<{
  selector: string;
  found: boolean;
  hasFocusRing: boolean;
}> {
  return API_KEYBOARD_CONTROL_SELECTORS.map((selector) => {
    const element = root.querySelector(selector);
    if (!(element instanceof HTMLElement)) {
      return { selector, found: false, hasFocusRing: false };
    }
    return {
      selector,
      found: true,
      hasFocusRing: hasApiVisibleFocusRingClass(element.className),
    };
  });
}

/**
 * True when reduced-motion hash focus should use instant (`auto`) scroll
 * rather than smooth scrolling.
 */
export function apiHashFocusScrollBehavior(
  reduceMotion: boolean,
): ScrollBehavior {
  return reduceMotion ? "auto" : "smooth";
}
