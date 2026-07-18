/**
 * Story 008 — placement comparison evidence (integrated / separate / hybrid)
 * with desktop + phone width cost observations.
 *
 * Pure helpers classify HTML/structural signals. Viewport-specific notes are
 * recorded from browser probes; SSR HTML byte size is width-independent.
 */

export const PLACEMENT_OPTIONS = [
  "integrated-only",
  "separate-catalog",
  "hybrid",
] as const;

export type PlacementOption = (typeof PLACEMENT_OPTIONS)[number];

export const PLACEMENT_VIEWPORTS = [
  { id: "desktop", width: 1280, height: 800 },
  { id: "phone", width: 390, height: 844 },
] as const;

export type PlacementViewportId = (typeof PLACEMENT_VIEWPORTS)[number]["id"];

export const PLACEMENT_SPIKE_ROUTES = {
  "integrated-only": "/spikes/sse-openapi",
  "separate-catalog": "/spikes/sse-catalog",
  hybrid: "/spikes/sse-placement-hybrid",
} as const satisfies Record<PlacementOption, string>;

export type PlacementHtmlCostSignals = {
  htmlByteLength: number;
  headingCount: number;
  landmarkMainCount: number;
  sectionCount: number;
  /** Distinct h2/h3 stops — proxy for keyboard/landmark navigation length. */
  navigationStopCount: number;
  catalogEnvelopeMarkerCount: number;
  catalogVariantMarkerCount: number;
  openApiOperationMarkerCount: number;
  hasMainLandmark: boolean;
  hasAriaLabelledSections: boolean;
};

export type PlacementViewportObservation = {
  viewport: PlacementViewportId;
  width: number;
  height: number;
  /**
   * Horizontal overflow risk note from the browser probe (or structural
   * expectation when only SSR HTML is available).
   */
  overflowNote: string;
  /**
   * Keyboard / screen-reader notes sufficient for the decision gate.
   */
  a11yNote: string;
};

export type PlacementOptionEvidence = {
  option: PlacementOption;
  route: string;
  html: PlacementHtmlCostSignals;
  viewports: PlacementViewportObservation[];
  /** Short summary of reader experience cost for the decision gate. */
  costSummary: string;
};

export type PlacementComparisonEvidence = {
  options: PlacementOptionEvidence[];
  /**
   * Relative ranking by HTML payload (smallest first). Useful for decision
   * gate cost comparisons; not alone decisive.
   */
  htmlPayloadRanking: PlacementOption[];
};

function countOccurrences(haystack: string, needle: string): number {
  if (needle.length === 0) return 0;
  let count = 0;
  let index = 0;
  while (true) {
    const found = haystack.indexOf(needle, index);
    if (found === -1) return count;
    count += 1;
    index = found + needle.length;
  }
}

function countTagMatches(html: string, tagName: string): number {
  const re = new RegExp(`<${tagName}\\b`, "gi");
  return html.match(re)?.length ?? 0;
}

/**
 * Derive payload / navigation cost signals from spike HTML.
 */
export function measurePlacementHtmlCostSignals(
  html: string,
): PlacementHtmlCostSignals {
  const headingCount =
    countTagMatches(html, "h1") +
    countTagMatches(html, "h2") +
    countTagMatches(html, "h3");
  const landmarkMainCount = countTagMatches(html, "main");
  const sectionCount = countTagMatches(html, "section");
  const navigationStopCount =
    countTagMatches(html, "h2") + countTagMatches(html, "h3");

  return {
    htmlByteLength: Buffer.byteLength(html, "utf8"),
    headingCount,
    landmarkMainCount,
    sectionCount,
    navigationStopCount,
    catalogEnvelopeMarkerCount: countOccurrences(
      html,
      "data-sse-catalog-envelope=",
    ),
    catalogVariantMarkerCount: countOccurrences(
      html,
      "data-sse-catalog-variant=",
    ),
    openApiOperationMarkerCount: Math.max(
      countOccurrences(html, "data-sse-spike-operation="),
      countOccurrences(html, "data-sse-hybrid-operation="),
    ),
    hasMainLandmark: landmarkMainCount >= 1,
    hasAriaLabelledSections: html.includes("aria-labelledby="),
  };
}

function defaultViewportObservations(
  option: PlacementOption,
): PlacementViewportObservation[] {
  const baseA11y =
    "Headings and aria-labelledby sections provide a keyboard/screen-reader outline; no live EventSource controls.";

  if (option === "integrated-only") {
    return PLACEMENT_VIEWPORTS.map((viewport) => ({
      viewport: viewport.id,
      width: viewport.width,
      height: viewport.height,
      overflowNote:
        viewport.id === "phone"
          ? "Native OpenAPI operation chrome may feel long on phone; event corpus still missing (x-event-schema ignored)."
          : "Desktop width fits operation chrome; event corpus still missing.",
      a11yNote: `${baseA11y} Event envelope/payload corpus is not discoverable on this layout.`,
    }));
  }

  if (option === "separate-catalog") {
    return PLACEMENT_VIEWPORTS.map((viewport) => ({
      viewport: viewport.id,
      width: viewport.width,
      height: viewport.height,
      overflowNote:
        viewport.id === "phone"
          ? "Catalog grid collapses to a single column; long variant lists increase scroll depth."
          : "Two-column variant grid on sm+; envelope cards stay within content column.",
      a11yNote: `${baseA11y} Catalog exposes envelope + payload variant lists with h2/h3 outline.`,
    }));
  }

  return PLACEMENT_VIEWPORTS.map((viewport) => ({
    viewport: viewport.id,
    width: viewport.width,
    height: viewport.height,
    overflowNote:
      viewport.id === "phone"
        ? "Hybrid stacks operation + injected catalog; phone scroll length is longest of the three."
        : "Hybrid keeps operation transport semantics with catalog beside responses via documented hook.",
    a11yNote: `${baseA11y} Hybrid preserves operation headings and adds catalog landmarks after responses.`,
  }));
}

function costSummaryFor(
  option: PlacementOption,
  html: PlacementHtmlCostSignals,
): string {
  if (option === "integrated-only") {
    return `Smallest HTML among layouts with OpenAPI chrome (${html.htmlByteLength} bytes) but zero catalog envelope markers — readers cannot discover payload variants.`;
  }
  if (option === "separate-catalog") {
    return `Catalog-only payload (${html.htmlByteLength} bytes) with ${html.catalogEnvelopeMarkerCount} envelopes and ${html.catalogVariantMarkerCount} variants; HTTP reconnect semantics absent (API-page concern).`;
  }
  return `Largest combined payload (${html.htmlByteLength} bytes): OpenAPI operations + ${html.catalogEnvelopeMarkerCount} catalog envelopes via documented renderOperationLayout.`;
}

/**
 * Build comparable evidence for one placement option from its rendered HTML.
 */
export function buildPlacementOptionEvidence(
  option: PlacementOption,
  html: string,
  viewports: PlacementViewportObservation[] = defaultViewportObservations(
    option,
  ),
): PlacementOptionEvidence {
  const signals = measurePlacementHtmlCostSignals(html);
  return {
    option,
    route: PLACEMENT_SPIKE_ROUTES[option],
    html: signals,
    viewports,
    costSummary: costSummaryFor(option, signals),
  };
}

/**
 * Combine the three placement options into a comparison report.
 */
export function buildPlacementComparisonEvidence(
  htmlByOption: Record<PlacementOption, string>,
): PlacementComparisonEvidence {
  const options = PLACEMENT_OPTIONS.map((option) =>
    buildPlacementOptionEvidence(option, htmlByOption[option]),
  );
  const htmlPayloadRanking = [...options]
    .sort((a, b) => a.html.htmlByteLength - b.html.htmlByteLength)
    .map((entry) => entry.option);

  return { options, htmlPayloadRanking };
}

/**
 * Assert minimum structural expectations for a placement HTML probe.
 */
export function assertPlacementHtmlProbe(
  option: PlacementOption,
  html: string,
): string[] {
  const signals = measurePlacementHtmlCostSignals(html);
  const failures: string[] = [];

  if (!signals.hasMainLandmark) {
    failures.push(`${option}: missing <main> landmark`);
  }
  if (!signals.hasAriaLabelledSections) {
    failures.push(`${option}: missing aria-labelledby sections`);
  }

  if (option === "integrated-only") {
    if (signals.catalogEnvelopeMarkerCount !== 0) {
      failures.push(
        `${option}: unexpected catalog envelope markers (integrated must stay OpenAPI-only)`,
      );
    }
  }

  if (option === "separate-catalog") {
    if (signals.catalogEnvelopeMarkerCount < 2) {
      failures.push(
        `${option}: expected preferred catalog envelopes (FactoryEvent + FactoryResponseEvent)`,
      );
    }
    if (signals.catalogVariantMarkerCount < 1) {
      failures.push(`${option}: expected payload variant markers`);
    }
  }

  if (option === "hybrid") {
    if (signals.catalogEnvelopeMarkerCount < 2) {
      failures.push(`${option}: expected catalog envelopes beside operations`);
    }
    if (signals.catalogVariantMarkerCount < 1) {
      failures.push(`${option}: expected payload variant markers`);
    }
  }

  return failures;
}
