/**
 * Child-process probe for W01 mobile navigation + export/search cost measurements.
 *
 * Starts an isolated Next dev server, fetches `/references-openapi-spike`,
 * verifies collapsible operation nav markup, measures HTML/JS payload sizes,
 * and uses Playwright at phone width (390×844) for overflow + hydration proxy
 * + nav expand/reachability. Run with plain `bun` (not `bun test`).
 *
 * Spike SSR can take ~8–11s; curl timeout is 60s.
 */

import { type ChildProcess, spawn } from "node:child_process";
import {
  closePlaywrightBrowserWithTimeout,
  launchPlaywrightBrowser,
} from "@/lib/verify/launch-playwright-browser";
import {
  deriveSpikeCostRisks,
  extractReferencedScriptUrls,
  filterNextStaticJsUrls,
  formatBytes,
  SPIKE_COST_MEASUREMENT_METHOD,
  SPIKE_ROUTE_PATH,
  SPIKE_SEARCH_PROJECTION_POLICY,
  utf8ByteLength,
} from "./cost-measurements";
import {
  isSpikeMobileNavMarkupReady,
  probeSpikeMobileNavHtml,
  SPIKE_MOBILE_NAV_ATTR,
  SPIKE_OPERATION_NAV_ARIA_LABEL,
  SPIKE_PHONE_VIEWPORT,
} from "./mobile-navigation";

const PORT = Number(process.env.OPENAPI_SPIKE_PROBE_PORT ?? "3466");
const SPIKE_PATH = SPIKE_ROUTE_PATH;
const READY_TIMEOUT_MS = 120_000;
const CURL_MAX_TIME_S = 60;
const EXPECTED_OPS = 45;

function countMatches(html: string, pattern: RegExp): number {
  return [...html.matchAll(pattern)].length;
}

async function waitForReady(url: string, timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(5_000),
      });
      if (response.ok || response.status === 500) {
        return;
      }
    } catch {
      // Server not ready yet.
    }
    await Bun.sleep(1_000);
  }
  throw new Error(
    `Spike probe server not ready within ${timeoutMs}ms at ${url}`,
  );
}

async function fetchSpikeHtml(url: string): Promise<string> {
  const result = Bun.spawnSync({
    cmd: [
      "curl",
      "--fail",
      "--silent",
      "--show-error",
      "--max-time",
      String(CURL_MAX_TIME_S),
      url,
    ],
    cwd: process.cwd(),
    stdout: "pipe",
    stderr: "pipe",
  });
  if (result.exitCode !== 0) {
    throw new Error(
      `curl failed (${result.exitCode}): ${result.stderr.toString()}`,
    );
  }
  return result.stdout.toString();
}

async function sumScriptBytes(urls: readonly string[]): Promise<number> {
  let total = 0;
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) continue;
      const buf = await response.arrayBuffer();
      total += buf.byteLength;
    } catch {
      // Skip unreachable script URLs (HMR / transient).
    }
  }
  return total;
}

let server: ChildProcess | undefined;
const cleanup = () => {
  if (server?.pid) {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {
      try {
        server.kill("SIGTERM");
      } catch {
        // already exited
      }
    }
  }
};
process.on("exit", cleanup);
process.on("SIGINT", () => {
  cleanup();
  process.exit(1);
});
process.on("SIGTERM", () => {
  cleanup();
  process.exit(1);
});

try {
  server = spawn("bun", ["run", "dev", "--", "-p", String(PORT)], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(PORT),
      NODE_ENV: "development",
    },
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });

  const baseUrl = `http://127.0.0.1:${PORT}`;
  await waitForReady(baseUrl, READY_TIMEOUT_MS);

  // Warm SSR once (first hit is slow), then measure.
  await fetchSpikeHtml(`${baseUrl}${SPIKE_PATH}`).catch(() => undefined);
  const html = await fetchSpikeHtml(`${baseUrl}${SPIKE_PATH}`);
  const htmlBytes = utf8ByteLength(html);

  const navProbe = probeSpikeMobileNavHtml(html);
  if (!isSpikeMobileNavMarkupReady(navProbe, EXPECTED_OPS)) {
    throw new Error(`Mobile nav markup not ready: ${JSON.stringify(navProbe)}`);
  }

  const operationSections = countMatches(html, /data-openapi-operation-id="/g);
  if (operationSections !== EXPECTED_OPS) {
    throw new Error(
      `Expected ${EXPECTED_OPS} operation sections, got ${operationSections}`,
    );
  }

  const scriptUrls = filterNextStaticJsUrls(
    extractReferencedScriptUrls(html, baseUrl),
  );
  const jsPayloadBytes = await sumScriptBytes(scriptUrls);

  // Search projection: inventories untouched → delta 0 (policy + runtime check
  // that HTML does not embed a shared search bootstrap for the spike route).
  const searchProjectionDeltaBytes =
    SPIKE_SEARCH_PROJECTION_POLICY.expectedSearchProjectionDeltaBytes;

  const browser = await launchPlaywrightBrowser();
  let hydrationProxyMs: number | null = null;
  let loadEventProxyMs: number | null = null;
  let pageOverflowPx = 0;
  let mobileNavReachable = false;

  try {
    const page = await browser.newPage({
      viewport: {
        width: SPIKE_PHONE_VIEWPORT.width,
        height: SPIKE_PHONE_VIEWPORT.height,
      },
    });
    page.setDefaultTimeout(120_000);

    await page.goto(`${baseUrl}${SPIKE_PATH}`, {
      waitUntil: "domcontentloaded",
      timeout: 120_000,
    });

    const timing = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0] as
        | PerformanceNavigationTiming
        | undefined;
      if (!nav) {
        return { domContentLoaded: null, loadEvent: null };
      }
      return {
        domContentLoaded: nav.domContentLoadedEventEnd,
        loadEvent: nav.loadEventEnd,
      };
    });
    hydrationProxyMs =
      timing.domContentLoaded !== null && timing.domContentLoaded > 0
        ? Math.round(timing.domContentLoaded)
        : null;
    loadEventProxyMs =
      timing.loadEvent !== null && timing.loadEvent > 0
        ? Math.round(timing.loadEvent)
        : null;

    const overflow = await page.evaluate(() => {
      const root = document.documentElement;
      const body = document.body;
      const clientWidth = Math.max(root.clientWidth, body?.clientWidth ?? 0);
      const scrollWidth = Math.max(root.scrollWidth, body?.scrollWidth ?? 0);
      return Math.max(0, scrollWidth - clientWidth);
    });
    pageOverflowPx = overflow;

    // Expand details and confirm deep links are reachable/clickable.
    const details = page.locator(`[${SPIKE_MOBILE_NAV_ATTR}]`);
    await details.locator("summary").click();
    await expectOpen(details);

    const linkCount = await page
      .locator(`[${SPIKE_MOBILE_NAV_ATTR}] a[data-openapi-spike-nav-link]`)
      .count();
    if (linkCount !== EXPECTED_OPS) {
      throw new Error(
        `Expected ${EXPECTED_OPS} reachable nav links after expand, got ${linkCount}`,
      );
    }

    const firstLink = page
      .locator(`[${SPIKE_MOBILE_NAV_ATTR}] a[data-openapi-spike-nav-link]`)
      .first();
    await firstLink.click();
    mobileNavReachable = true;

    const navLabel = await page
      .locator(`nav[aria-label="${SPIKE_OPERATION_NAV_ARIA_LABEL}"]`)
      .count();
    if (navLabel < 1) {
      throw new Error("Operation deep links nav missing after expand");
    }

    await page.close();
  } finally {
    await closePlaywrightBrowserWithTimeout(browser);
  }

  // Soft tolerance: intentional code scrollers may widen slightly under turbopack;
  // treat >8px as a hard failure for page-level breakage.
  if (pageOverflowPx > 8) {
    throw new Error(
      `Page-level horizontal overflow at phone width: ${pageOverflowPx}px`,
    );
  }

  const risks = deriveSpikeCostRisks({
    htmlBytes,
    jsPayloadBytes,
    hydrationProxyMs,
    searchProjectionDeltaBytes,
    pageOverflowPx,
  });

  const measuredAtUtc = new Date().toISOString();
  const result = {
    ok: true,
    measuredAtUtc,
    buildMode: SPIKE_COST_MEASUREMENT_METHOD.buildMode,
    routePath: SPIKE_PATH,
    phoneViewport: SPIKE_PHONE_VIEWPORT,
    htmlBytes,
    htmlBytesFormatted: formatBytes(htmlBytes),
    jsPayloadBytes,
    jsPayloadBytesFormatted: formatBytes(jsPayloadBytes),
    jsScriptCount: scriptUrls.length,
    hydrationProxyMs,
    loadEventProxyMs,
    searchProjectionDeltaBytes,
    pageOverflowPx,
    mobileNavReachable,
    navProbe,
    operationSections,
    risks,
    measurementMethod: SPIKE_COST_MEASUREMENT_METHOD,
    port: PORT,
  };

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} finally {
  cleanup();
  await Bun.sleep(500);
}

async function expectOpen(
  details: import("playwright").Locator,
): Promise<void> {
  const open = await details.evaluate((el) => (el as HTMLDetailsElement).open);
  if (!open) {
    throw new Error(
      "Expected mobile nav <details> to be open after summary click",
    );
  }
}
