/**
 * W01 OpenAPI spike — reproducible cost / payload measurement helpers.
 *
 * Pure analysis of HTML + script URLs + search-inventory membership. IO
 * (fetching bytes, Playwright timing) lives in assert-mobile-and-costs.ts.
 */

/** Spike route under measurement (not the shipped /docs/references/api surface). */
export const SPIKE_ROUTE_PATH = "/references-openapi-spike";

/**
 * Search / sitemap inventories must stay free of the spike route so W01 does
 * not inflate production search bootstrap size.
 */
export const SPIKE_SEARCH_PROJECTION_POLICY = {
  includedInSharedSearchInventory: false,
  includedInSharedSitemapInventory: false,
  /** Expected search-projection size impact while inventories stay untouched. */
  expectedSearchProjectionDeltaBytes: 0,
} as const;

export type SpikeCostMeasurementMethod = {
  /** Build / serve mode used when collecting numbers. */
  buildMode: "next-dev-ssr" | "next-production-start" | "static-export-out";
  /** Commands that reproduce the measurement. */
  reproductionCommands: readonly string[];
  /** What each recorded number means. */
  definitions: {
    htmlBytes: string;
    jsPayloadBytes: string;
    hydrationProxyMs: string;
    searchProjectionDeltaBytes: string;
  };
};

export const SPIKE_COST_MEASUREMENT_METHOD: SpikeCostMeasurementMethod = {
  buildMode: "next-dev-ssr",
  reproductionCommands: [
    "OPENAPI_SPIKE_PROBE_PORT=3466 bun src/lib/references-openapi-spike/assert-mobile-and-costs.ts",
  ],
  definitions: {
    htmlBytes:
      "UTF-8 byte length of the HTML document returned for /references-openapi-spike (SSR / exported page body).",
    jsPayloadBytes:
      "Sum of unique /_next/static/**/*.js script bodies referenced by that HTML (Content-Length or downloaded bytes).",
    hydrationProxyMs:
      "PerformanceNavigationTiming.domContentLoadedEventEnd as a hydration readiness proxy (not React commit timing).",
    searchProjectionDeltaBytes:
      "Change in shared search bootstrap attributable to the spike route; 0 while inventories exclude the spike.",
  },
};

export type SpikeCostMeasurement = {
  measuredAtUtc: string;
  buildMode: SpikeCostMeasurementMethod["buildMode"];
  routePath: typeof SPIKE_ROUTE_PATH;
  htmlBytes: number;
  jsPayloadBytes: number;
  jsScriptCount: number;
  /** Hydration readiness proxy in milliseconds (DOMContentLoaded). */
  hydrationProxyMs: number | null;
  /** loadEventEnd proxy when available. */
  loadEventProxyMs: number | null;
  searchProjectionDeltaBytes: number;
  phoneViewportWidth: number;
  pageOverflowPx: number;
  mobileNavReachable: boolean;
  risks: readonly string[];
};

const SCRIPT_SRC_RE =
  /<script\b[^>]*\bsrc=["']([^"']+\.js(?:\?[^"']*)?)["'][^>]*>/gi;

/**
 * Collect unique absolute or root-relative JS script URLs from an HTML document.
 */
export function extractReferencedScriptUrls(
  html: string,
  origin: string,
): string[] {
  const urls = new Set<string>();
  for (const match of html.matchAll(SCRIPT_SRC_RE)) {
    const raw = match[1];
    if (!raw) continue;
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      urls.add(raw);
      continue;
    }
    if (raw.startsWith("/")) {
      urls.add(new URL(raw, origin).toString());
      continue;
    }
    urls.add(new URL(raw, origin).toString());
  }
  return [...urls].sort();
}

/**
 * Keep only Next static JS chunks (ignore third-party / HMR noise when possible).
 */
export function filterNextStaticJsUrls(urls: readonly string[]): string[] {
  return urls.filter((url) => {
    try {
      const pathname = new URL(url).pathname;
      return pathname.includes("/_next/static/") && pathname.endsWith(".js");
    } catch {
      return false;
    }
  });
}

export function utf8ByteLength(text: string): number {
  return new TextEncoder().encode(text).byteLength;
}

/**
 * True when a URL or path string refers to the spike route (search/sitemap guard).
 */
export function pathMentionsOpenApiSpike(value: string): boolean {
  return (
    value.includes(SPIKE_ROUTE_PATH) ||
    value.includes("references-openapi-spike")
  );
}

/**
 * Productionization risks derived from measured magnitudes (thresholds are
 * advisory for W08 budgeting, not hard CI gates).
 */
export function deriveSpikeCostRisks(input: {
  htmlBytes: number;
  jsPayloadBytes: number;
  hydrationProxyMs: number | null;
  searchProjectionDeltaBytes: number;
  pageOverflowPx: number;
}): string[] {
  const risks: string[] = [];

  if (input.htmlBytes >= 5_000_000) {
    risks.push(
      `Exported/SSR HTML is very large (${input.htmlBytes} bytes). W08 should split operations or paginate rather than ship one multi-megabyte page.`,
    );
  } else if (input.htmlBytes >= 1_000_000) {
    risks.push(
      `HTML payload exceeds 1 MiB (${input.htmlBytes} bytes). Budget carefully before productionizing the single-page shape.`,
    );
  }

  if (input.jsPayloadBytes >= 1_000_000) {
    risks.push(
      `Next static JS referenced by the spike exceeds 1 MiB (${input.jsPayloadBytes} bytes).`,
    );
  }

  if (input.hydrationProxyMs !== null && input.hydrationProxyMs >= 5_000) {
    risks.push(
      `DOMContentLoaded proxy is slow (${input.hydrationProxyMs} ms). Large HTML + client hydration may block interaction on phones.`,
    );
  }

  if (input.searchProjectionDeltaBytes !== 0) {
    risks.push(
      `Search projection delta is non-zero (${input.searchProjectionDeltaBytes} bytes); shared inventories may have been edited.`,
    );
  }

  if (input.pageOverflowPx > 1) {
    risks.push(
      `Page-level horizontal overflow at phone width (${input.pageOverflowPx}px). Fix layout before productionizing.`,
    );
  }

  return risks;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
}
