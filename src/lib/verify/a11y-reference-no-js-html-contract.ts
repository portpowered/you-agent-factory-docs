/**
 * W19 no-JavaScript / static HTML readability contract for representative
 * Factory reference surfaces.
 *
 * Essential contract facts (API method/path/summary, event type + payload /
 * envelope headings, schema field names/types, authored schema embeds) must
 * remain present in static HTML without executing client bundles. Probes work
 * against a DOM built from script-stripped export HTML or SSR fixtures.
 */

import {
  REFERENCE_SURFACE_ROUTES,
  type ReferenceSurfaceRouteId,
} from "./a11y-reference-surface-contract";

export type ReferenceNoJsFactKind =
  | "api-operation"
  | "event-identity"
  | "event-heading"
  | "schema-field"
  | "schema-type";

export type ReferenceNoJsFactSpec = {
  id: string;
  kind: ReferenceNoJsFactKind;
  label: string;
  /**
   * When true, every matching representative route must expose at least one
   * readable hit with non-empty essential text.
   */
  required: boolean;
  routeIds: readonly ReferenceSurfaceRouteId[];
  /**
   * CSS selector for the fact container or text node. Probes may also read
   * data attributes listed in {@link attributeKeys}.
   */
  selector: string;
  /** Optional data-attribute keys that contribute readable text when present. */
  attributeKeys?: readonly string[];
  /**
   * Minimum number of readable hits required when `required` is true.
   * Defaults to 1.
   */
  minHits?: number;
};

/**
 * Essential static-HTML facts for W19 story 010. Selectors prefer production
 * data attrs already used by W08/W09 chrome and authored SchemaReference embeds.
 */
export const REFERENCE_NO_JS_FACTS: readonly ReferenceNoJsFactSpec[] = [
  {
    id: "api-operation-method-path-summary",
    kind: "api-operation",
    label: "API operation method, path, and summary",
    required: true,
    routeIds: ["references-api"],
    selector: "[data-api-operation-section]",
    attributeKeys: ["data-api-operation-method", "data-api-operation-path"],
    minHits: 1,
  },
  {
    id: "event-type-identity",
    kind: "event-identity",
    label: "Event type / kind identity",
    required: true,
    routeIds: ["references-events"],
    selector: "[data-event-type], [data-event-payload-only][data-event-type]",
    attributeKeys: ["data-event-type"],
    minHits: 1,
  },
  {
    id: "event-envelope-heading",
    kind: "event-heading",
    label: "Event envelope heading",
    required: true,
    routeIds: ["references-events"],
    selector: "[data-event-envelope] h2, [data-event-envelope] h3",
    minHits: 1,
  },
  {
    id: "event-payload-heading",
    kind: "event-heading",
    label: "Event payload heading",
    required: true,
    routeIds: ["references-events"],
    selector:
      '[data-event-payload-only] h3, [data-event-payload-only] [id*="heading"]',
    minHits: 1,
  },
  {
    id: "schema-field-name",
    kind: "schema-field",
    label: "Schema field name",
    required: true,
    routeIds: [
      "references-factory-schema",
      "authored-factory",
      "authored-worker",
      "authored-workstation",
    ],
    selector: "[data-schema-field-name]",
    minHits: 1,
  },
  {
    id: "schema-field-type",
    kind: "schema-type",
    label: "Schema field type summary",
    required: true,
    routeIds: [
      "references-factory-schema",
      "authored-factory",
      "authored-worker",
      "authored-workstation",
    ],
    selector: '[data-schema-type="summary"]',
    minHits: 1,
  },
] as const;

export function listReferenceNoJsFactsForRoute(
  routeId: ReferenceSurfaceRouteId,
): ReferenceNoJsFactSpec[] {
  return REFERENCE_NO_JS_FACTS.filter((spec) =>
    spec.routeIds.includes(routeId),
  );
}

export function listRequiredReferenceNoJsFacts(
  routeId: ReferenceSurfaceRouteId,
): ReferenceNoJsFactSpec[] {
  return listReferenceNoJsFactsForRoute(routeId).filter(
    (spec) => spec.required,
  );
}

/**
 * Routes that must prove essential static-HTML readability (all six W19
 * representatives).
 */
export const REFERENCE_NO_JS_ROUTE_IDS = REFERENCE_SURFACE_ROUTES.map(
  (route) => route.id,
) as readonly ReferenceSurfaceRouteId[];

/**
 * Removes executable script bodies and external script tags so a static HTML
 * document can be probed without client hydration.
 */
export function stripScriptsFromHtml(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<script\b[^>]*\/>/gi, "");
}

function textOf(element: Element): string {
  return (element.textContent ?? "").replace(/\s+/g, " ").trim();
}

function attributeText(element: Element, keys: readonly string[]): string {
  const parts: string[] = [];
  for (const key of keys) {
    const value = element.getAttribute(key)?.trim();
    if (value) {
      parts.push(value);
    }
  }
  return parts.join(" ").trim();
}

/**
 * True when an API operation section exposes method, path, and summary as
 * readable static text / data attributes (no client-only rendering required).
 */
export function isReadableApiOperationSection(section: Element): boolean {
  const method =
    section.getAttribute("data-api-operation-method")?.trim() ||
    section.querySelector("[data-api-method-badge]")?.textContent?.trim() ||
    "";
  const path =
    section.getAttribute("data-api-operation-path")?.trim() ||
    section.querySelector("h2 code, h2")?.textContent?.trim() ||
    "";
  const summary =
    section
      .querySelector("[data-api-operation-summary]")
      ?.textContent?.trim() || "";
  return method.length > 0 && path.length > 0 && summary.length > 0;
}

/**
 * Collects non-empty readable text for a no-JS fact hit.
 */
export function readableTextForNoJsFact(
  element: Element,
  spec: ReferenceNoJsFactSpec,
): string {
  if (spec.kind === "api-operation") {
    if (!isReadableApiOperationSection(element)) {
      return "";
    }
    const method =
      element.getAttribute("data-api-operation-method")?.trim() ?? "";
    const path = element.getAttribute("data-api-operation-path")?.trim() ?? "";
    const summary =
      element
        .querySelector("[data-api-operation-summary]")
        ?.textContent?.trim() ?? "";
    return `${method} ${path} ${summary}`.trim();
  }

  const fromAttrs = spec.attributeKeys
    ? attributeText(element, spec.attributeKeys)
    : "";
  if (fromAttrs.length > 0) {
    return fromAttrs;
  }
  return textOf(element);
}

export type ReferenceNoJsFactProbe = {
  id: string;
  kind: ReferenceNoJsFactKind;
  label: string;
  required: boolean;
  found: boolean;
  readableHitCount: number;
  sampleTexts: string[];
  minHits: number;
  ok: boolean;
};

export function probeReferenceNoJsFact(
  root: ParentNode,
  spec: ReferenceNoJsFactSpec,
): ReferenceNoJsFactProbe {
  const minHits = spec.minHits ?? 1;
  let hits: Element[] = [];
  try {
    hits = Array.from(root.querySelectorAll(spec.selector));
  } catch {
    hits = [];
  }

  const sampleTexts: string[] = [];
  let readableHitCount = 0;
  for (const hit of hits) {
    const text = readableTextForNoJsFact(hit, spec);
    if (text.length === 0) {
      continue;
    }
    readableHitCount += 1;
    if (sampleTexts.length < 3) {
      sampleTexts.push(text.slice(0, 120));
    }
  }

  const found = readableHitCount > 0;
  const ok = !spec.required || readableHitCount >= minHits;

  return {
    id: spec.id,
    kind: spec.kind,
    label: spec.label,
    required: spec.required,
    found,
    readableHitCount,
    sampleTexts,
    minHits,
    ok,
  };
}

export function probeReferenceNoJsFactsForRoute(
  root: ParentNode,
  routeId: ReferenceSurfaceRouteId,
): ReferenceNoJsFactProbe[] {
  return listReferenceNoJsFactsForRoute(routeId).map((spec) =>
    probeReferenceNoJsFact(root, spec),
  );
}

export type ReferenceNoJsHtmlProbe = {
  routeId: ReferenceSurfaceRouteId;
  facts: ReferenceNoJsFactProbe[];
  ok: boolean;
  error: string | null;
  /** True when the probed document had no remaining script tags. */
  scriptsAbsent: boolean;
};

function countScriptTags(root: ParentNode): number {
  try {
    return root.querySelectorAll("script").length;
  } catch {
    return 0;
  }
}

/**
 * Asserts required essential facts are readable in static HTML. Optional facts
 * are reported but do not fail when absent.
 */
export function expectReferenceNoJsHtmlReadability(
  root: ParentNode,
  routeId: ReferenceSurfaceRouteId,
): ReferenceNoJsHtmlProbe {
  const facts = probeReferenceNoJsFactsForRoute(root, routeId);
  const scriptsAbsent = countScriptTags(root) === 0;

  for (const probe of facts) {
    if (!probe.required) {
      continue;
    }
    if (!probe.ok) {
      throw new Error(
        `required no-JS fact "${probe.label}" (${probe.id}) missing or empty on ${routeId} (readableHits=${probe.readableHitCount}, min=${probe.minHits})`,
      );
    }
  }

  return {
    routeId,
    facts,
    ok: true,
    error: null,
    scriptsAbsent,
  };
}

/** Plain args for Playwright `page.evaluate` (no Node closures). */
export function referenceNoJsHtmlEvaluateArgs(
  routeId: ReferenceSurfaceRouteId,
): {
  routeId: ReferenceSurfaceRouteId;
  facts: Array<{
    id: string;
    kind: ReferenceNoJsFactKind;
    selector: string;
    label: string;
    required: boolean;
    attributeKeys: readonly string[];
    minHits: number;
  }>;
} {
  return {
    routeId,
    facts: listReferenceNoJsFactsForRoute(routeId).map((spec) => ({
      id: spec.id,
      kind: spec.kind,
      selector: spec.selector,
      label: spec.label,
      required: spec.required,
      attributeKeys: spec.attributeKeys ?? [],
      minHits: spec.minHits ?? 1,
    })),
  };
}

export type ReferenceNoJsHtmlEvaluateResult = {
  ok: boolean;
  error: string | null;
  routeId: string;
  scriptsAbsent: boolean;
  facts: Array<{
    id: string;
    kind: string;
    label: string;
    required: boolean;
    found: boolean;
    readableHitCount: number;
    sampleTexts: string[];
    minHits: number;
    ok: boolean;
  }>;
};

/**
 * Self-contained browser probe for Playwright `page.evaluate`. Do not close
 * over module imports — Playwright serializes only this function body.
 */
export function evaluateReferenceNoJsHtmlInBrowser(args: {
  routeId: string;
  facts: ReadonlyArray<{
    id: string;
    kind: string;
    selector: string;
    label: string;
    required: boolean;
    attributeKeys: readonly string[];
    minHits: number;
  }>;
}): ReferenceNoJsHtmlEvaluateResult {
  const root = document.documentElement;
  const scriptsAbsent = document.querySelectorAll("script").length === 0;

  function textOfEl(element: Element): string {
    return (element.textContent ?? "").replace(/\s+/g, " ").trim();
  }

  function isReadableApi(section: Element): boolean {
    const method =
      section.getAttribute("data-api-operation-method")?.trim() ||
      section.querySelector("[data-api-method-badge]")?.textContent?.trim() ||
      "";
    const path =
      section.getAttribute("data-api-operation-path")?.trim() ||
      section.querySelector("h2 code, h2")?.textContent?.trim() ||
      "";
    const summary =
      section
        .querySelector("[data-api-operation-summary]")
        ?.textContent?.trim() || "";
    return method.length > 0 && path.length > 0 && summary.length > 0;
  }

  function readableText(
    element: Element,
    kind: string,
    attributeKeys: readonly string[],
  ): string {
    if (kind === "api-operation") {
      if (!isReadableApi(element)) {
        return "";
      }
      const method =
        element.getAttribute("data-api-operation-method")?.trim() ?? "";
      const path =
        element.getAttribute("data-api-operation-path")?.trim() ?? "";
      const summary =
        element
          .querySelector("[data-api-operation-summary]")
          ?.textContent?.trim() ?? "";
      return `${method} ${path} ${summary}`.trim();
    }
    const parts: string[] = [];
    for (const key of attributeKeys) {
      const value = element.getAttribute(key)?.trim();
      if (value) {
        parts.push(value);
      }
    }
    if (parts.length > 0) {
      return parts.join(" ");
    }
    return textOfEl(element);
  }

  const facts = args.facts.map((spec) => {
    let hits: Element[] = [];
    try {
      hits = Array.from(root.querySelectorAll(spec.selector));
    } catch {
      hits = [];
    }
    const sampleTexts: string[] = [];
    let readableHitCount = 0;
    for (const hit of hits) {
      const text = readableText(hit, spec.kind, spec.attributeKeys);
      if (text.length === 0) {
        continue;
      }
      readableHitCount += 1;
      if (sampleTexts.length < 3) {
        sampleTexts.push(text.slice(0, 120));
      }
    }
    const found = readableHitCount > 0;
    const ok = !spec.required || readableHitCount >= spec.minHits;
    return {
      id: spec.id,
      kind: spec.kind,
      label: spec.label,
      required: spec.required,
      found,
      readableHitCount,
      sampleTexts,
      minHits: spec.minHits,
      ok,
    };
  });

  for (const probe of facts) {
    if (probe.required && !probe.ok) {
      return {
        ok: false,
        error: `required no-JS fact "${probe.label}" (${probe.id}) missing or empty on ${args.routeId} (readableHits=${probe.readableHitCount}, min=${probe.minHits})`,
        routeId: args.routeId,
        scriptsAbsent,
        facts,
      };
    }
  }

  return {
    ok: true,
    error: null,
    routeId: args.routeId,
    scriptsAbsent,
    facts,
  };
}
