/**
 * W19 screen-reader / non-color status contract for representative Factory
 * reference surfaces. Extends existing page-structure + axe harnesses — does
 * not invent a parallel a11y framework.
 *
 * Keep selectors mirrored from the components layer (do not import
 * `@/components` into verify/).
 */

import {
  REFERENCE_SURFACE_ROUTES,
  type ReferenceSurfaceRouteId,
} from "./a11y-reference-surface-contract";

export type ReferenceLabeledControlKind =
  | "filter"
  | "filter-clear"
  | "nav-link"
  | "copy"
  | "mobile-nav"
  | "schema-link"
  | "status-region";

export type ReferenceLabeledControlSpec = {
  id: string;
  kind: ReferenceLabeledControlKind;
  /** CSS selector matching the interactive control (or status region). */
  selector: string;
  label: string;
  /**
   * When true, every matching representative route must expose at least one
   * hit with a non-empty accessible name.
   */
  required: boolean;
  routeIds: readonly ReferenceSurfaceRouteId[];
  /** Optional accessible-name pattern (case-insensitive substring match). */
  namePattern?: RegExp;
};

export type ReferenceNonColorStatusKind =
  | "http-method"
  | "required-optional"
  | "lifecycle"
  | "canonicality";

export type ReferenceNonColorStatusSpec = {
  id: string;
  kind: ReferenceNonColorStatusKind;
  /** CSS selector for the status chrome that must carry a text cue. */
  selector: string;
  label: string;
  /**
   * Visible / accessible text pattern that proves meaning is not color-only.
   * Matched against normalized textContent (and title/aria-label when present).
   */
  textPattern: RegExp;
  required: boolean;
  routeIds: readonly ReferenceSurfaceRouteId[];
};

/**
 * Primary interactive chrome that must expose accessible names for AT.
 * Aligns with the keyboard contract selectors where those controls exist.
 */
export const REFERENCE_LABELED_CONTROLS: readonly ReferenceLabeledControlSpec[] =
  [
    {
      id: "api-filter-input",
      kind: "filter",
      selector: '[data-api-operation-filter="input"]',
      label: "API operation filter input",
      required: true,
      routeIds: ["references-api"],
      namePattern: /filter|operation/i,
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
      namePattern: /copy|link|anchor/i,
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
      namePattern: /copy|link|anchor/i,
    },
    {
      id: "schema-filter-input",
      kind: "filter",
      selector: '[data-schema-filter="input"]',
      label: "Schema filter input",
      required: true,
      routeIds: ["references-factory-schema"],
      namePattern: /filter|definition|field/i,
    },
    {
      id: "schema-ref-link",
      kind: "schema-link",
      selector: "a[data-schema-ref-kind]",
      label: "Schema $ref link",
      required: true,
      routeIds: ["references-factory-schema"],
    },
  ] as const;

/**
 * Status distinctions that must remain understandable without color alone.
 * Production chrome already ships text labels; this contract fails when a
 * matching marker is present but empty / color-only.
 */
export const REFERENCE_NON_COLOR_STATUS: readonly ReferenceNonColorStatusSpec[] =
  [
    {
      id: "api-http-method",
      kind: "http-method",
      selector: "[data-api-method-badge]",
      label: "HTTP method badge",
      // Match method token inside combined text + title cues (title is
      // "HTTP method POST", so a full-string ^…$ pattern would false-fail).
      textPattern: /\b(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS|TRACE)\b/i,
      required: true,
      routeIds: ["references-api"],
    },
    {
      id: "schema-required-optional",
      kind: "required-optional",
      selector: "[data-schema-required]",
      label: "Schema required/optional badge",
      textPattern: /required|optional/i,
      required: true,
      routeIds: ["references-factory-schema"],
    },
    {
      id: "events-canonicality",
      kind: "canonicality",
      selector: '[data-testid="event-canonicality-badge"]',
      label: "Event stream canonicality badge",
      textPattern:
        /canonical|ephemeral|compatibility|preferred|not preferred|non-canonical|not canonical replay/i,
      required: true,
      routeIds: ["references-events"],
    },
    {
      id: "lifecycle-chrome",
      kind: "lifecycle",
      selector: "[data-lifecycle-state]",
      label: "Reference lifecycle status chrome",
      textPattern: /lifecycle|active|deprecated|removed/i,
      // Lifecycle chips appear on CLI/MCP/JS inventories and shared chrome
      // fixtures — not always on the three primary reference routes.
      required: false,
      routeIds: [
        "references-api",
        "references-events",
        "references-factory-schema",
        "authored-factory",
        "authored-worker",
        "authored-workstation",
      ],
    },
  ] as const;

export type ReferenceLabeledControlProbe = {
  id: string;
  kind: ReferenceLabeledControlKind;
  selector: string;
  label: string;
  required: boolean;
  found: boolean;
  hitCount: number;
  unnamedHitCount: number;
  sampleNames: string[];
  namePatternMatched: boolean;
};

export type ReferenceNonColorStatusProbe = {
  id: string;
  kind: ReferenceNonColorStatusKind;
  selector: string;
  label: string;
  required: boolean;
  found: boolean;
  hitCount: number;
  colorOnlyHitCount: number;
  sampleTexts: string[];
};

export type ReferenceHeadingHierarchyProbe = {
  levels: number[];
  h1Count: number;
  firstLevel: number | null;
  hasSkippedLevel: boolean;
};

/** Accessible name for AT — mirrors `a11y-page-structure` without exporting it. */
export function accessibleNameOf(element: Element): string {
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

function normalizeTextCue(element: Element): string {
  const ariaLabel = element.getAttribute("aria-label")?.trim() ?? "";
  const title = element.getAttribute("title")?.trim() ?? "";
  const text = (element.textContent ?? "").replace(/\s+/g, " ").trim();
  return [text, ariaLabel, title].filter(Boolean).join(" ");
}

function headingLevel(element: Element): number | null {
  const match = /^H([1-6])$/i.exec(element.tagName);
  if (!match) {
    return null;
  }
  return Number(match[1]);
}

export function listReferenceLabeledControlsForRoute(
  routeId: ReferenceSurfaceRouteId,
): ReferenceLabeledControlSpec[] {
  return REFERENCE_LABELED_CONTROLS.filter((entry) =>
    entry.routeIds.includes(routeId),
  );
}

export function listRequiredReferenceLabeledControls(
  routeId: ReferenceSurfaceRouteId,
): ReferenceLabeledControlSpec[] {
  return listReferenceLabeledControlsForRoute(routeId).filter(
    (entry) => entry.required,
  );
}

export function listReferenceNonColorStatusForRoute(
  routeId: ReferenceSurfaceRouteId,
): ReferenceNonColorStatusSpec[] {
  return REFERENCE_NON_COLOR_STATUS.filter((entry) =>
    entry.routeIds.includes(routeId),
  );
}

export function listRequiredReferenceNonColorStatus(
  routeId: ReferenceSurfaceRouteId,
): ReferenceNonColorStatusSpec[] {
  return listReferenceNonColorStatusForRoute(routeId).filter(
    (entry) => entry.required,
  );
}

export function probeReferenceLabeledControl(
  root: ParentNode,
  spec: ReferenceLabeledControlSpec,
): ReferenceLabeledControlProbe {
  const hits = Array.from(root.querySelectorAll(spec.selector));
  const sampleNames: string[] = [];
  let unnamedHitCount = 0;
  let namePatternMatched = hits.length === 0;

  for (const hit of hits) {
    const name = accessibleNameOf(hit);
    if (sampleNames.length < 5) {
      sampleNames.push(name);
    }
    if (!name) {
      unnamedHitCount += 1;
      continue;
    }
    if (spec.namePattern) {
      if (spec.namePattern.test(name)) {
        namePatternMatched = true;
      }
    } else {
      namePatternMatched = true;
    }
  }

  if (hits.length > 0 && !spec.namePattern) {
    namePatternMatched = unnamedHitCount === 0;
  }
  if (hits.length > 0 && spec.namePattern) {
    namePatternMatched = sampleNames.some((name) =>
      spec.namePattern?.test(name),
    );
  }

  return {
    id: spec.id,
    kind: spec.kind,
    selector: spec.selector,
    label: spec.label,
    required: spec.required,
    found: hits.length > 0,
    hitCount: hits.length,
    unnamedHitCount,
    sampleNames,
    namePatternMatched,
  };
}

export function probeReferenceNonColorStatus(
  root: ParentNode,
  spec: ReferenceNonColorStatusSpec,
): ReferenceNonColorStatusProbe {
  const hits = Array.from(root.querySelectorAll(spec.selector));
  const sampleTexts: string[] = [];
  let colorOnlyHitCount = 0;

  for (const hit of hits) {
    const cue = normalizeTextCue(hit);
    if (sampleTexts.length < 5) {
      sampleTexts.push(cue);
    }
    if (!cue || !spec.textPattern.test(cue)) {
      colorOnlyHitCount += 1;
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
    colorOnlyHitCount,
    sampleTexts,
  };
}

/**
 * Heading outline probe. A skip is a forward jump greater than 1 from the
 * previous heading level (for example h1 → h3).
 */
export function probeReferenceHeadingHierarchy(
  root: ParentNode,
): ReferenceHeadingHierarchyProbe {
  const headings = Array.from(root.querySelectorAll("h1, h2, h3, h4, h5, h6"));
  const levels = headings
    .map((el) => headingLevel(el))
    .filter((level): level is number => level !== null);
  let hasSkippedLevel = false;
  for (let index = 1; index < levels.length; index += 1) {
    const previous = levels[index - 1];
    const current = levels[index];
    if (
      previous !== undefined &&
      current !== undefined &&
      current > previous + 1
    ) {
      hasSkippedLevel = true;
      break;
    }
  }
  const h1Count = levels.filter((level) => level === 1).length;
  return {
    levels,
    h1Count,
    firstLevel: levels[0] ?? null,
    hasSkippedLevel,
  };
}

/**
 * Asserts coherent headings for a reference surface fixture or served page.
 * Component fixtures may start at h2/h3; full pages should set `requireH1`.
 */
export function expectCoherentReferenceHeadingHierarchy(
  root: ParentNode,
  options: { requireH1?: boolean; context?: string } = {},
): ReferenceHeadingHierarchyProbe {
  const probe = probeReferenceHeadingHierarchy(root);
  const context = options.context ?? "reference surface";

  if (probe.levels.length === 0) {
    throw new Error(`${context}: expected at least one heading`);
  }
  if (options.requireH1 && probe.h1Count < 1) {
    throw new Error(`${context}: expected at least one h1`);
  }
  if (probe.hasSkippedLevel) {
    throw new Error(
      `${context}: heading hierarchy skips a level (${probe.levels.join(" → ")})`,
    );
  }
  return probe;
}

/**
 * Asserts required labeled chrome for a representative route. Throws when a
 * required control is missing or lacks an accessible name / pattern match.
 */
export function expectReferenceLabeledChrome(
  root: ParentNode,
  routeId: ReferenceSurfaceRouteId,
): ReferenceLabeledControlProbe[] {
  const route = REFERENCE_SURFACE_ROUTES.find((entry) => entry.id === routeId);
  const routeLabel = route?.path ?? routeId;
  const probes = listReferenceLabeledControlsForRoute(routeId).map((spec) =>
    probeReferenceLabeledControl(root, spec),
  );

  for (const probe of probes) {
    if (!probe.required) {
      if (probe.found && probe.unnamedHitCount > 0) {
        throw new Error(
          `${routeLabel}: optional control "${probe.label}" (${probe.selector}) is missing an accessible name`,
        );
      }
      continue;
    }
    if (!probe.found) {
      throw new Error(
        `${routeLabel}: required labeled control "${probe.label}" (${probe.selector}) was not found`,
      );
    }
    if (probe.unnamedHitCount > 0) {
      throw new Error(
        `${routeLabel}: required control "${probe.label}" (${probe.selector}) is missing an accessible name`,
      );
    }
    if (!probe.namePatternMatched) {
      throw new Error(
        `${routeLabel}: required control "${probe.label}" (${probe.selector}) accessible name did not match expected pattern; samples: ${probe.sampleNames.join(" | ") || "(none)"}`,
      );
    }
  }

  return probes;
}

/**
 * Asserts non-color status chrome for a representative route. Required kinds
 * must be present with text cues; optional kinds fail only when present but
 * color-only.
 */
export function expectReferenceNonColorStatus(
  root: ParentNode,
  routeId: ReferenceSurfaceRouteId,
): ReferenceNonColorStatusProbe[] {
  const route = REFERENCE_SURFACE_ROUTES.find((entry) => entry.id === routeId);
  const routeLabel = route?.path ?? routeId;
  const probes = listReferenceNonColorStatusForRoute(routeId).map((spec) =>
    probeReferenceNonColorStatus(root, spec),
  );

  for (const probe of probes) {
    if (!probe.required) {
      if (probe.found && probe.colorOnlyHitCount > 0) {
        throw new Error(
          `${routeLabel}: optional status "${probe.label}" (${probe.selector}) appears color-only / missing text cue; samples: ${probe.sampleTexts.join(" | ") || "(none)"}`,
        );
      }
      continue;
    }
    if (!probe.found) {
      throw new Error(
        `${routeLabel}: required non-color status "${probe.label}" (${probe.selector}) was not found`,
      );
    }
    if (probe.colorOnlyHitCount > 0) {
      throw new Error(
        `${routeLabel}: required status "${probe.label}" (${probe.selector}) appears color-only / missing text cue; samples: ${probe.sampleTexts.join(" | ") || "(none)"}`,
      );
    }
  }

  return probes;
}

/**
 * Combined screen-reader chrome gate: labeled controls + non-color status.
 * Heading hierarchy stays a separate call so fixtures can choose `requireH1`.
 */
export function expectReferenceScreenReaderChrome(
  root: ParentNode,
  routeId: ReferenceSurfaceRouteId,
): {
  labeled: ReferenceLabeledControlProbe[];
  nonColor: ReferenceNonColorStatusProbe[];
} {
  return {
    labeled: expectReferenceLabeledChrome(root, routeId),
    nonColor: expectReferenceNonColorStatus(root, routeId),
  };
}
