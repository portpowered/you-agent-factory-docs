/**
 * W01 OpenAPI spike — page-local operation navigation contract for phone widths.
 *
 * The spike keeps shared site nav inventories untouched; this module only
 * describes the in-page operation deep-link chrome (collapse / reachability).
 */

/** Phone viewport used for W01 mobile probes (matches CRITICAL_VIEWPORTS.mobile). */
export const SPIKE_PHONE_VIEWPORT = {
  id: "mobile",
  label: "Mobile",
  width: 390,
  height: 844,
} as const;

/** Marker attribute on the collapsible operation-nav host. */
export const SPIKE_MOBILE_NAV_ATTR = "data-openapi-spike-mobile-nav";

/** Marker attribute on the operation deep-link list (scroll region when open). */
export const SPIKE_MOBILE_NAV_LIST_ATTR = "data-openapi-spike-mobile-nav-list";

/** Accessible name for the page-local operation navigation. */
export const SPIKE_OPERATION_NAV_ARIA_LABEL = "Operation deep links";

export type SpikeMobileNavContract = {
  phoneViewport: typeof SPIKE_PHONE_VIEWPORT;
  /** Host uses a native disclosure widget (no client drawer dependency). */
  collapseMechanism: "details-summary";
  /** Collapsed by default so phone readers reach API content without scrolling past 45 links. */
  defaultOpen: false;
  /** When open, the link list scrolls inside a capped height instead of stretching the page. */
  openListMaxHeightClass: "max-h-[50vh]";
  /** Page chrome must not introduce page-level horizontal overflow at phone width. */
  pageOverflowPolicy: "no-unintended-page-overflow";
};

export const SPIKE_MOBILE_NAV_CONTRACT: SpikeMobileNavContract = {
  phoneViewport: SPIKE_PHONE_VIEWPORT,
  collapseMechanism: "details-summary",
  defaultOpen: false,
  openListMaxHeightClass: "max-h-[50vh]",
  pageOverflowPolicy: "no-unintended-page-overflow",
};

export type SpikeMobileNavHtmlProbe = {
  hasDetailsHost: boolean;
  hasSummary: boolean;
  detailsOpenByDefault: boolean;
  navAriaLabelPresent: boolean;
  deepLinkCount: number;
  listMarkerPresent: boolean;
};

/**
 * Pure HTML probe for the collapsible operation-nav markup (no DOM required).
 */
export function probeSpikeMobileNavHtml(html: string): SpikeMobileNavHtmlProbe {
  const detailsMatch = html.match(
    new RegExp(`<details[^>]*\\b${SPIKE_MOBILE_NAV_ATTR}\\b[^>]*>`, "i"),
  );
  const hasDetailsHost = detailsMatch !== null;
  const detailsOpenByDefault = Boolean(
    detailsMatch?.[0]?.match(/\bopen(?:="[^"]*")?\b/i),
  );
  const hasSummary = /<summary\b/i.test(html);
  const navAriaLabelPresent = html.includes(
    `aria-label="${SPIKE_OPERATION_NAV_ARIA_LABEL}"`,
  );
  const listMarkerPresent = html.includes(SPIKE_MOBILE_NAV_LIST_ATTR);
  const deepLinkCount = [
    ...html.matchAll(/data-openapi-spike-nav-link="([^"]+)"/g),
  ].length;

  return {
    hasDetailsHost,
    hasSummary,
    detailsOpenByDefault,
    navAriaLabelPresent,
    deepLinkCount,
    listMarkerPresent,
  };
}

export function isSpikeMobileNavMarkupReady(
  probe: SpikeMobileNavHtmlProbe,
  expectedDeepLinks: number,
): boolean {
  return (
    probe.hasDetailsHost &&
    probe.hasSummary &&
    !probe.detailsOpenByDefault &&
    probe.navAriaLabelPresent &&
    probe.listMarkerPresent &&
    probe.deepLinkCount === expectedDeepLinks
  );
}
