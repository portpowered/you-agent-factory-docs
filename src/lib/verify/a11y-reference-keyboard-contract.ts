/**
 * W19 keyboard-navigation contract for representative Factory reference
 * surfaces. Enumerates production data-attribute selectors that must remain
 * keyboard operable with visible focus indicators.
 *
 * Keep selectors mirrored from the components layer (do not import
 * `@/components` into verify/). Clear / optional chrome that only appears when
 * a filter query is active stays `required: false`.
 */

import {
  REFERENCE_SURFACE_ROUTE_IDS,
  REFERENCE_SURFACE_ROUTES,
  type ReferenceSurfaceRouteId,
} from "./a11y-reference-surface-contract";

export type ReferenceKeyboardControlKind =
  | "filter"
  | "filter-clear"
  | "collapsible"
  | "nav-link"
  | "copy"
  | "mobile-nav"
  | "schema-link"
  | "schema-expand"
  | "code-copy";

export type ReferenceKeyboardControlSpec = {
  id: string;
  kind: ReferenceKeyboardControlKind;
  /** CSS selector matching the interactive control (not a wrapper). */
  selector: string;
  label: string;
  /**
   * When true, every matching representative route must expose at least one
   * hit. When false, hits are probed for focusability only if present.
   */
  required: boolean;
  routeIds: readonly ReferenceSurfaceRouteId[];
};

/**
 * Primary interactive chrome for W19 keyboard gates. Selectors match production
 * markers used by API / events / schema / authored embed surfaces.
 */
export const REFERENCE_KEYBOARD_CONTROLS: readonly ReferenceKeyboardControlSpec[] =
  [
    {
      id: "api-filter-input",
      kind: "filter",
      selector: '[data-api-operation-filter="input"]',
      label: "API operation filter input",
      required: true,
      routeIds: ["references-api"],
    },
    {
      id: "api-filter-clear",
      kind: "filter-clear",
      selector: '[data-api-operation-filter="clear"]',
      label: "API operation filter clear",
      required: false,
      routeIds: ["references-api"],
    },
    {
      id: "api-mobile-nav-summary",
      kind: "mobile-nav",
      selector: "[data-api-mobile-navigator] summary",
      label: "API mobile navigator disclosure",
      required: true,
      routeIds: ["references-api"],
    },
    {
      id: "api-nav-link",
      kind: "nav-link",
      selector: "[data-api-operation-nav-link]",
      label: "API in-page operation navigator link",
      required: true,
      routeIds: ["references-api"],
    },
    {
      id: "api-copy-link",
      kind: "copy",
      selector: "[data-api-operation-copy-link]",
      label: "API operation deep-link copy",
      required: true,
      routeIds: ["references-api"],
    },
    {
      id: "events-filter-query",
      kind: "filter",
      selector:
        "[data-event-catalog-navigation] [data-reference-inventory-filter-query]",
      label: "Events catalog filter query",
      // Production /docs/references/events mounts catalogs + copy anchors; the
      // filtered EventCatalogNavigation chrome is harness/component coverage.
      required: false,
      routeIds: ["references-events"],
    },
    {
      id: "events-filter-clear",
      kind: "filter-clear",
      selector:
        "[data-event-catalog-navigation] [data-reference-inventory-filter-clear]",
      label: "Events catalog filter clear",
      required: false,
      routeIds: ["references-events"],
    },
    {
      id: "events-nav-link",
      kind: "nav-link",
      selector:
        "a[data-event-catalog-link], a[data-event-catalog-nav-link], a[data-event-schema-anchor-link]",
      label: "Events catalog / schema deep link",
      required: true,
      routeIds: ["references-events"],
    },
    {
      id: "events-anchor-copy",
      kind: "copy",
      selector: "[data-reference-anchor-copy]",
      label: "Events / shared deep-link copy",
      required: true,
      routeIds: ["references-events"],
    },
    {
      id: "schema-filter-input",
      kind: "filter",
      selector: '[data-schema-filter="input"]',
      label: "Schema filter input",
      required: true,
      routeIds: ["references-factory-schema"],
    },
    {
      id: "schema-filter-clear",
      kind: "filter-clear",
      selector: '[data-schema-filter="clear"]',
      label: "Schema filter clear",
      required: false,
      routeIds: ["references-factory-schema"],
    },
    {
      id: "schema-field-expand",
      kind: "schema-expand",
      selector: "[data-schema-field-expand]",
      label: "Schema field expand/collapse",
      // Production SchemaReference builds flat property trees; nested expand is
      // proven via SchemaFieldTree harness fixtures (as applicable).
      required: false,
      routeIds: ["references-factory-schema"],
    },
    {
      id: "schema-ref-link",
      kind: "schema-link",
      selector: "a[data-schema-ref-kind]",
      label: "Schema $ref link",
      required: true,
      routeIds: ["references-factory-schema"],
    },
    {
      id: "authored-schema-embed",
      kind: "schema-link",
      selector:
        "[data-schema-definition-embed] a[href], a[data-schema-ref-kind]",
      label: "Authored page schema embed / $ref link",
      required: false,
      routeIds: ["authored-factory", "authored-worker", "authored-workstation"],
    },
    {
      id: "code-copy",
      kind: "code-copy",
      selector: '[data-docs-code-copy="control"]',
      label: "Code-block copy control",
      required: false,
      routeIds: REFERENCE_SURFACE_ROUTE_IDS,
    },
  ] as const;

export type ReferenceKeyboardControlProbe = {
  id: string;
  kind: ReferenceKeyboardControlKind;
  selector: string;
  label: string;
  required: boolean;
  found: boolean;
  hitCount: number;
  /** True when every found hit is a natively keyboard-focusable control. */
  allHitsKeyboardFocusable: boolean;
  /** True when every found hit exposes a visible focus-ring utility class. */
  allHitsHaveFocusRing: boolean;
  pointerOnlyHitCount: number;
};

const NATIVE_FOCUSABLE_TAGS = new Set([
  "a",
  "button",
  "input",
  "select",
  "textarea",
  "summary",
]);

/**
 * True when a className string includes the site focus-visible ring / outline
 * pattern used across reference chrome.
 */
export function hasReferenceVisibleFocusRingClass(className: string): boolean {
  return (
    className.includes("focus-visible:ring") ||
    className.includes("focus-visible:outline")
  );
}

/**
 * True when the element is reachable via Tab / native keyboard activation
 * (button, link with href, form control, summary, or tabindex >= 0).
 */
export function isKeyboardFocusableElement(element: Element): boolean {
  if (!(element instanceof HTMLElement)) {
    return false;
  }
  if (element.hasAttribute("disabled")) {
    return false;
  }
  const tag = element.tagName.toLowerCase();
  if (tag === "a") {
    return element.hasAttribute("href");
  }
  if (NATIVE_FOCUSABLE_TAGS.has(tag)) {
    return true;
  }
  const tabIndex = element.getAttribute("tabindex");
  if (tabIndex === null || tabIndex === "") {
    return false;
  }
  const parsed = Number(tabIndex);
  return Number.isFinite(parsed) && parsed >= 0;
}

/**
 * Heuristic pointer-only interactive: looks clickable (role=button / onclick /
 * data-action) but is not keyboard focusable.
 */
export function isPointerOnlyInteractiveElement(element: Element): boolean {
  if (isKeyboardFocusableElement(element)) {
    return false;
  }
  if (!(element instanceof HTMLElement)) {
    return false;
  }
  const role = element.getAttribute("role");
  const hasButtonRole = role === "button" || role === "link";
  const hasClickHandler = element.hasAttribute("onclick");
  const claimsAction =
    element.hasAttribute("data-action") ||
    element.hasAttribute("data-pointer-only-action");
  return hasButtonRole || hasClickHandler || claimsAction;
}

export function listReferenceKeyboardControlsForRoute(
  routeId: ReferenceSurfaceRouteId,
): ReferenceKeyboardControlSpec[] {
  return REFERENCE_KEYBOARD_CONTROLS.filter((entry) =>
    entry.routeIds.includes(routeId),
  );
}

export function listRequiredReferenceKeyboardControls(
  routeId: ReferenceSurfaceRouteId,
): ReferenceKeyboardControlSpec[] {
  return listReferenceKeyboardControlsForRoute(routeId).filter(
    (entry) => entry.required,
  );
}

/**
 * Probes one control spec under a root. Required controls missing from the
 * tree report `found: false` so callers can fail the gate.
 */
export function probeReferenceKeyboardControl(
  root: ParentNode,
  spec: ReferenceKeyboardControlSpec,
): ReferenceKeyboardControlProbe {
  const hits = Array.from(root.querySelectorAll(spec.selector));
  // Disabled matches (for example filter-clear before a query) stay in the
  // tree but are not required to be Tab-reachable until enabled.
  const activeHits = hits.filter(
    (hit) => !(hit instanceof HTMLElement && hit.hasAttribute("disabled")),
  );
  let pointerOnlyHitCount = 0;
  let keyboardOk = true;
  let focusRingOk = true;

  for (const hit of activeHits) {
    if (!isKeyboardFocusableElement(hit)) {
      keyboardOk = false;
      // Non-focusable match counts as a pointer-only defect for an interactive
      // selector (for example a bare <div role="button">).
      pointerOnlyHitCount += 1;
    }
    if (!(hit instanceof HTMLElement)) {
      focusRingOk = false;
      continue;
    }
    if (!hasReferenceVisibleFocusRingClass(hit.className)) {
      focusRingOk = false;
    }
  }

  return {
    id: spec.id,
    kind: spec.kind,
    selector: spec.selector,
    label: spec.label,
    required: spec.required,
    found: hits.length > 0,
    hitCount: hits.length,
    allHitsKeyboardFocusable:
      activeHits.length === 0 ? hits.length > 0 : keyboardOk,
    allHitsHaveFocusRing:
      activeHits.length === 0 ? hits.length > 0 : focusRingOk,
    pointerOnlyHitCount,
  };
}

export function probeReferenceKeyboardControlsForRoute(
  root: ParentNode,
  routeId: ReferenceSurfaceRouteId,
): ReferenceKeyboardControlProbe[] {
  return listReferenceKeyboardControlsForRoute(routeId).map((spec) =>
    probeReferenceKeyboardControl(root, spec),
  );
}

/**
 * Asserts required keyboard chrome for a representative route. Throws with a
 * readable message when a required control is missing, pointer-only, or lacks
 * a visible focus-ring class.
 */
export function expectReferenceKeyboardChrome(
  root: ParentNode,
  routeId: ReferenceSurfaceRouteId,
): ReferenceKeyboardControlProbe[] {
  const route = REFERENCE_SURFACE_ROUTES.find((entry) => entry.id === routeId);
  const routeLabel = route?.path ?? routeId;
  const probes = probeReferenceKeyboardControlsForRoute(root, routeId);

  for (const probe of probes) {
    if (!probe.required) {
      if (
        probe.found &&
        (probe.pointerOnlyHitCount > 0 || !probe.allHitsKeyboardFocusable)
      ) {
        throw new Error(
          `${routeLabel}: optional control "${probe.label}" (${probe.selector}) is pointer-only / not keyboard focusable`,
        );
      }
      if (probe.found && !probe.allHitsHaveFocusRing) {
        throw new Error(
          `${routeLabel}: optional control "${probe.label}" (${probe.selector}) is missing a visible focus-visible ring class`,
        );
      }
      continue;
    }

    if (!probe.found) {
      throw new Error(
        `${routeLabel}: required keyboard control "${probe.label}" (${probe.selector}) was not found`,
      );
    }
    if (probe.pointerOnlyHitCount > 0 || !probe.allHitsKeyboardFocusable) {
      throw new Error(
        `${routeLabel}: required control "${probe.label}" (${probe.selector}) is pointer-only / not keyboard focusable`,
      );
    }
    if (!probe.allHitsHaveFocusRing) {
      throw new Error(
        `${routeLabel}: required control "${probe.label}" (${probe.selector}) is missing a visible focus-visible ring class`,
      );
    }
  }

  return probes;
}
