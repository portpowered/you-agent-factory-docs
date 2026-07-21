/**
 * Browser close-out for shared schema pointer-path chrome default flip
 * (repair-schema-field-hide-pointer-path-chrome-003).
 *
 * Proves:
 * - `/docs/references/mock-workers-schema` field chrome hides long OpenAPI
 *   pointer trails by default, keeps leaf names readable, and retains copyable
 *   deep-link controls when addresses exist.
 * - `/docs/references/events` catalog listings still suppress verbose
 *   `components/schemas/.../properties/...` pointer-path chrome (no regression).
 *
 * Run with plain `bun` from repo cwd. Kills the local server on exit.
 * Prefer `SCHEMA_POINTER_PATH_CHROME_PROBE_BASE_URL` when a server is warm.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { launchPlaywrightBrowser } from "@/lib/verify/launch-playwright-browser";

const PORT = Number(
  process.env.SCHEMA_POINTER_PATH_CHROME_PROBE_PORT ?? "3587",
);
const MOCK_WORKERS_PATH = "/docs/references/mock-workers-schema";
const EVENTS_PATH = "/docs/references/events";
const READY_TIMEOUT_MS = 180_000;
const PAGE_TIMEOUT_MS = 180_000;
const EXISTING_BASE_URL =
  process.env.SCHEMA_POINTER_PATH_CHROME_PROBE_BASE_URL?.trim();

const VERBOSE_POINTER_PATH =
  /(?:\$defs|components\/schemas)\/[^/\s]+\/properties\/[^/\s]+/;

let server: ChildProcess | undefined;

function cleanup() {
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
}

process.on("exit", cleanup);
process.on("SIGINT", () => {
  cleanup();
  process.exit(1);
});
process.on("SIGTERM", () => {
  cleanup();
  process.exit(1);
});

async function waitForReady(url: string, timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(5_000),
      });
      if (response.ok || response.status === 500) return;
    } catch {
      // not ready
    }
    await Bun.sleep(1_000);
  }
  throw new Error(`Dev server not ready within ${timeoutMs}ms at ${url}`);
}

async function warmPage(
  baseUrl: string,
  path: string,
  marker: string,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < PAGE_TIMEOUT_MS) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        signal: AbortSignal.timeout(120_000),
      });
      if (response.ok) {
        const html = await response.text();
        if (html.includes(marker)) return;
      }
    } catch {
      // still compiling
    }
    await Bun.sleep(2_000);
  }
  throw new Error(
    `${path} did not warm with marker ${marker} within ${PAGE_TIMEOUT_MS}ms`,
  );
}

try {
  const baseUrl =
    EXISTING_BASE_URL && EXISTING_BASE_URL.length > 0
      ? EXISTING_BASE_URL.replace(/\/$/, "")
      : `http://127.0.0.1:${PORT}`;

  if (!EXISTING_BASE_URL) {
    // Worktrees often hoist node_modules at the parent checkout. Turbopack
    // rejects that layout; webpack resolves ancestor node_modules.
    server = spawn(
      "bun",
      ["./scripts/run-next.ts", "dev", "--webpack", "-p", String(PORT)],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          PORT: String(PORT),
          NODE_ENV: "development",
        },
        stdio: ["ignore", "pipe", "pipe"],
        detached: true,
      },
    );
    await waitForReady(baseUrl, READY_TIMEOUT_MS);
  }

  await warmPage(
    baseUrl,
    MOCK_WORKERS_PATH,
    'data-testid="mock-workers-schema-reference"',
  );
  await warmPage(baseUrl, EVENTS_PATH, 'data-testid="events-surface"');

  const browser = await launchPlaywrightBrowser();
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    page.setDefaultTimeout(PAGE_TIMEOUT_MS);

    // --- mock-workers-schema: quiet shared default ---
    const mockResponse = await page.goto(`${baseUrl}${MOCK_WORKERS_PATH}`, {
      waitUntil: "domcontentloaded",
      timeout: PAGE_TIMEOUT_MS,
    });
    if (!mockResponse?.ok()) {
      throw new Error(
        `Expected 200 for ${MOCK_WORKERS_PATH}, got ${mockResponse?.status() ?? "no response"}`,
      );
    }

    await page.waitForSelector(
      '[data-testid="mock-workers-schema-reference"][data-schema-status="ready"]',
      { timeout: PAGE_TIMEOUT_MS },
    );
    await page.waitForSelector('[data-testid="schema-field-row"]', {
      timeout: 60_000,
    });

    const mockProbe = await page.evaluate((verbosePointerPathSource) => {
      const verbosePointerPath = new RegExp(verbosePointerPathSource);
      const surface = document.querySelector(
        '[data-testid="mock-workers-schema-reference"]',
      );
      const rows = Array.from(
        surface?.querySelectorAll('[data-testid="schema-field-row"]') ?? [],
      );
      const fieldTexts = rows.map((row) => (row.textContent ?? "").trim());
      const leafNames = rows
        .map((row) => {
          const path = row.getAttribute("data-schema-field-path") ?? "";
          const leaf = path.includes(".")
            ? (path.split(".").pop() ?? path)
            : path.includes("/")
              ? (path.split("/").pop() ?? path)
              : path;
          return leaf.replace(/\[\]/g, "");
        })
        .filter(Boolean);

      const breadcrumbSegments = surface?.querySelectorAll(
        "[data-schema-breadcrumb-segment]",
      ).length;
      const pathSegmentsFalse = surface?.querySelectorAll(
        '[data-schema-path-segments="false"]',
      ).length;
      const pathSegmentsTrue = surface?.querySelectorAll(
        '[data-schema-path-segments="true"]',
      ).length;
      const copyControls = surface?.querySelectorAll(
        '[data-schema-breadcrumb="copy"]',
      ).length;
      const deepLinkAnchors = surface?.querySelectorAll(
        "[data-schema-deep-link]",
      ).length;

      const verboseTrailInFieldChrome = fieldTexts.some((text) =>
        verbosePointerPath.test(text),
      );

      const readableLeafCount = leafNames.filter((leaf) =>
        fieldTexts.some((text) => text.includes(leaf)),
      ).length;

      return {
        schemaStatus: surface?.getAttribute("data-schema-status") ?? null,
        fieldRowCount: rows.length,
        breadcrumbSegmentCount: breadcrumbSegments ?? 0,
        pathSegmentsFalseCount: pathSegmentsFalse ?? 0,
        pathSegmentsTrueCount: pathSegmentsTrue ?? 0,
        copyControlCount: copyControls ?? 0,
        deepLinkAnchorCount: deepLinkAnchors ?? 0,
        verboseTrailInFieldChrome,
        readableLeafCount,
        sampleLeafNames: leafNames.slice(0, 5),
      };
    }, VERBOSE_POINTER_PATH.source);

    const failures: string[] = [];
    if (mockProbe.schemaStatus !== "ready") {
      failures.push(
        `mock-workers: expected ready schema, got ${mockProbe.schemaStatus}`,
      );
    }
    if (mockProbe.fieldRowCount < 1) {
      failures.push("mock-workers: expected at least one schema field row");
    }
    if (mockProbe.verboseTrailInFieldChrome) {
      failures.push(
        "mock-workers: verbose $defs|components/.../properties/... trail visible in field chrome",
      );
    }
    if (mockProbe.breadcrumbSegmentCount > 0) {
      failures.push(
        `mock-workers: expected no breadcrumb path segments, got ${mockProbe.breadcrumbSegmentCount}`,
      );
    }
    if (mockProbe.pathSegmentsTrueCount > 0) {
      failures.push(
        `mock-workers: expected data-schema-path-segments=true count 0, got ${mockProbe.pathSegmentsTrueCount}`,
      );
    }
    if (mockProbe.pathSegmentsFalseCount < 1) {
      failures.push(
        "mock-workers: expected at least one data-schema-path-segments=false breadcrumb",
      );
    }
    if (mockProbe.copyControlCount < 1 || mockProbe.deepLinkAnchorCount < 1) {
      failures.push(
        "mock-workers: expected copyable deep-link controls for addressed fields",
      );
    }
    if (mockProbe.readableLeafCount < 1) {
      failures.push(
        `mock-workers: expected readable leaf field names (sample: ${mockProbe.sampleLeafNames.join(", ")})`,
      );
    }

    // Copyable deep-link / addressability: breadcrumb navs publish fragment
    // deep links and expose an enabled copy control (click/clipboard success
    // is covered by schema-definition / schema-field-tree RTL tests; headless
    // clipboard is flaky across Chrome versions).
    const copyAddressability = await page.evaluate(() => {
      const navs = Array.from(
        document.querySelectorAll(
          '[data-testid="mock-workers-schema-reference"] [data-schema-path-segments="false"][data-schema-deep-link]',
        ),
      );
      const withFragment = navs.filter((nav) =>
        (nav.getAttribute("data-schema-deep-link") ?? "").includes("#"),
      );
      const copyButtons = withFragment
        .map((nav) =>
          nav.querySelector<HTMLButtonElement>(
            'button[data-schema-breadcrumb="copy"]',
          ),
        )
        .filter((button): button is HTMLButtonElement => Boolean(button));
      const enabledCopyButtons = copyButtons.filter(
        (button) =>
          !button.disabled &&
          /copy deep link/i.test(button.getAttribute("aria-label") ?? ""),
      );
      return {
        navCount: navs.length,
        fragmentNavCount: withFragment.length,
        enabledCopyCount: enabledCopyButtons.length,
        sampleDeepLink:
          withFragment[0]?.getAttribute("data-schema-deep-link") ?? null,
      };
    });
    if (
      copyAddressability.fragmentNavCount < 1 ||
      copyAddressability.enabledCopyCount < 1
    ) {
      failures.push(
        `mock-workers: expected addressable copy controls with # deep links (navs=${copyAddressability.navCount}, fragments=${copyAddressability.fragmentNavCount}, enabledCopy=${copyAddressability.enabledCopyCount}, sample=${JSON.stringify(copyAddressability.sampleDeepLink)})`,
      );
    }

    // --- events: no-regression on suppressed pointer chrome ---
    const eventsResponse = await page.goto(`${baseUrl}${EVENTS_PATH}`, {
      waitUntil: "domcontentloaded",
      timeout: PAGE_TIMEOUT_MS,
    });
    if (!eventsResponse?.ok()) {
      throw new Error(
        `Expected 200 for ${EVENTS_PATH}, got ${eventsResponse?.status() ?? "no response"}`,
      );
    }

    await page.waitForFunction(
      () => {
        const surface = document.querySelector(
          '[data-testid="events-surface"]',
        );
        return surface?.getAttribute("data-events-status") === "success";
      },
      { timeout: PAGE_TIMEOUT_MS },
    );
    await page.waitForSelector(
      '[data-testid="factory-event-catalog-section"]',
      { timeout: 60_000 },
    );

    const eventsProbe = await page.evaluate(() => {
      const factoryCatalog = document.querySelector(
        '[data-testid="factory-event-catalog-section"]',
      );
      const responseCatalog = document.querySelector(
        '[data-testid="factory-response-event-catalog-section"]',
      );
      const pointerPath = /components\/schemas\/[^/\s]+\/properties\/[^/\s]+/;
      const factoryText = factoryCatalog?.textContent ?? "";
      const responseText = responseCatalog?.textContent ?? "";
      return {
        hasPointerPathChrome:
          pointerPath.test(factoryText) || pointerPath.test(responseText),
        breadcrumbComponentsCount: document.querySelectorAll(
          '[data-schema-breadcrumb-segment="components"]',
        ).length,
        factoryCatalogPresent: Boolean(factoryCatalog),
        responseCatalogPresent: Boolean(responseCatalog),
      };
    });

    if (
      !eventsProbe.factoryCatalogPresent ||
      !eventsProbe.responseCatalogPresent
    ) {
      failures.push("events: expected both FactoryEvent catalogs");
    }
    if (
      eventsProbe.hasPointerPathChrome ||
      eventsProbe.breadcrumbComponentsCount > 0
    ) {
      failures.push(
        "events: verbose components/schemas/.../properties/... chrome visible (regression)",
      );
    }

    if (failures.length > 0) {
      console.error("schema pointer-path chrome quiet browser assert FAILED:");
      for (const failure of failures) {
        console.error(`  - ${failure}`);
      }
      process.exitCode = 1;
    } else {
      console.log(
        "schema pointer-path chrome quiet browser assert PASSED (mock-workers quiet + events suppressed)",
      );
    }
  } finally {
    await browser.close();
  }
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  cleanup();
}
