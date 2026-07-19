/**
 * Browser probe for published `/docs/references/events` catalog polish
 * (repair-events-catalog-examples-envelopes-007) plus intro-strip absence
 * (repair-events-reference-intro-strip-002). Run with plain `bun` from repo
 * cwd. Kills the local server on exit.
 *
 * Proves a reader can see: short "Event catalog" label, rendered envelope
 * components, suppressed pointer-path chrome, and concrete envelope/payload
 * JSON examples in a success corpus state — and that What It Covers / Key
 * Concepts / folded Opening summary intro chrome are absent.
 *
 * Worktree note: Claude worktrees often resolve `next` from a parent
 * `node_modules`. Turbopack rejects that layout, so this probe starts
 * `next dev --webpack`. Prefer `EVENTS_CATALOG_POLISH_PROBE_BASE_URL` when a
 * server is already warm.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { launchPlaywrightBrowser } from "@/lib/verify/launch-playwright-browser";

const PORT = Number(process.env.EVENTS_CATALOG_POLISH_PROBE_PORT ?? "3577");
const PAGE_PATH = "/docs/references/events";
const READY_TIMEOUT_MS = 180_000;
const PAGE_TIMEOUT_MS = 180_000;
const EXISTING_BASE_URL =
  process.env.EVENTS_CATALOG_POLISH_PROBE_BASE_URL?.trim();

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
        signal: AbortSignal.timeout(10_000),
      });
      if (response.ok || response.status === 500) return;
    } catch {
      // not ready
    }
    await Bun.sleep(1_000);
  }
  throw new Error(`Dev server not ready within ${timeoutMs}ms at ${url}`);
}

async function warmEventsPage(baseUrl: string): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < PAGE_TIMEOUT_MS) {
    try {
      const response = await fetch(`${baseUrl}${PAGE_PATH}`, {
        signal: AbortSignal.timeout(120_000),
      });
      if (response.ok) {
        const html = await response.text();
        if (
          html.includes('data-testid="events-surface"') &&
          html.includes('data-testid="event-envelope-json-example"')
        ) {
          return;
        }
      }
    } catch {
      // still compiling
    }
    await Bun.sleep(2_000);
  }
  throw new Error(
    `Events page did not warm with catalog polish markers within ${PAGE_TIMEOUT_MS}ms`,
  );
}

try {
  const baseUrl =
    EXISTING_BASE_URL && EXISTING_BASE_URL.length > 0
      ? EXISTING_BASE_URL.replace(/\/$/, "")
      : `http://127.0.0.1:${PORT}`;

  if (!EXISTING_BASE_URL) {
    // Webpack avoids Turbopack's worktree node_modules root restriction.
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

  await warmEventsPage(baseUrl);

  const browser = await launchPlaywrightBrowser();
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    await page.goto(`${baseUrl}${PAGE_PATH}`, {
      waitUntil: "domcontentloaded",
      timeout: PAGE_TIMEOUT_MS,
    });

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
    await page.waitForSelector('[data-testid="event-envelope-json-example"]', {
      timeout: 60_000,
    });
    await page.waitForSelector(
      '[data-testid="event-envelope-component-FactoryEventType"]',
      { timeout: 60_000 },
    );

    const probe = await page.evaluate(() => {
      const surface = document.querySelector('[data-testid="events-surface"]');
      const factoryCatalog = document.querySelector(
        '[data-testid="factory-event-catalog-section"]',
      );
      const responseCatalog = document.querySelector(
        '[data-testid="factory-response-event-catalog-section"]',
      );

      const verbosePayloadOnly =
        /Payload only — not a complete FactoryEvent envelope|Payload only — ephemeral; not a complete FactoryResponseEvent envelope/i;
      const pointerPath = /components\/schemas\/[^/\s]+\/properties\/[^/\s]+/;

      const factoryText = factoryCatalog?.textContent ?? "";
      const responseText = responseCatalog?.textContent ?? "";

      const factoryEnvelopeFields = factoryCatalog?.querySelector(
        '[aria-label="Fields for FactoryEvent"]',
      );
      const schemaVersionCount =
        factoryEnvelopeFields?.querySelectorAll(
          '[data-schema-field-path="schemaVersion"]',
        ).length ?? 0;

      const envelopeExampleCodes = Array.from(
        document.querySelectorAll(
          '[data-testid^="event-envelope-json-example-code-"]',
        ),
      ).map((el) => (el.textContent ?? "").trim());

      const payloadExampleCount = document.querySelectorAll(
        '[data-testid="event-payload-json-example"]',
      ).length;

      const headingTexts = Array.from(
        document.querySelectorAll("h1, h2, h3, h4, h5, h6"),
      ).map((el) => (el.textContent ?? "").trim());

      return {
        surfaceStatus: surface?.getAttribute("data-events-status") ?? null,
        ownership: surface?.getAttribute("data-events-ownership") ?? null,
        factoryCatalogPresent: Boolean(factoryCatalog),
        responseCatalogPresent: Boolean(responseCatalog),
        eventCatalogLabelCount: Array.from(
          document.querySelectorAll("*"),
        ).filter((el) => /^\s*Event catalog\s*$/i.test(el.textContent ?? ""))
          .length,
        hasVerbosePayloadOnlyDisclaimer:
          verbosePayloadOnly.test(factoryText) ||
          verbosePayloadOnly.test(responseText),
        hasPointerPathChrome:
          pointerPath.test(factoryText) || pointerPath.test(responseText),
        breadcrumbComponentsCount: document.querySelectorAll(
          '[data-schema-breadcrumb-segment="components"]',
        ).length,
        factoryEnvelopeExample: Boolean(
          factoryCatalog?.querySelector(
            '[data-testid="event-envelope-json-example"]',
          ),
        ),
        responseEnvelopeExample: Boolean(
          responseCatalog?.querySelector(
            '[data-testid="event-envelope-json-example"]',
          ),
        ),
        factoryEventType: Boolean(
          document.querySelector(
            '[data-testid="event-envelope-component-FactoryEventType"]',
          ),
        ),
        factoryEventContext: Boolean(
          document.querySelector(
            '[data-testid="event-envelope-component-FactoryEventContext"]',
          ),
        ),
        responseKindDef: Boolean(
          document.querySelector(
            '[data-testid="response-event-kind-schema-definition"]',
          ),
        ),
        responsePhaseDef: Boolean(
          document.querySelector(
            '[data-testid="response-event-phase-schema-definition"]',
          ),
        ),
        responseProvenanceDef: Boolean(
          document.querySelector(
            '[data-testid="response-event-provenance-schema-definition"]',
          ),
        ),
        schemaVersionFieldCount: schemaVersionCount,
        envelopeExampleCodeCount: envelopeExampleCodes.length,
        envelopeExampleHasEllipsis: envelopeExampleCodes.some((code) =>
          /[…]|\.\.\./.test(code),
        ),
        envelopeExampleHasSchemaVersion: envelopeExampleCodes.some((code) =>
          code.includes('"schemaVersion"'),
        ),
        payloadExampleCount,
        // Intro-strip absence (MCP #156 pattern)
        hasWhatItCoversHeading: headingTexts.some(
          (text) => text === "What It Covers",
        ),
        hasKeyConceptsHeading: headingTexts.some(
          (text) => text === "Key Concepts",
        ),
        whatItCoversIdPresent: Boolean(
          document.getElementById("what-it-covers"),
        ),
        keyConceptsIdPresent: Boolean(document.getElementById("key-concepts")),
        eventCorpusIdPresent: Boolean(document.getElementById("event-corpus")),
        hasFoldedOpeningSummary: Boolean(
          document.querySelector('[data-testid="folded-summary"]') ||
            document.querySelector('[data-opening-summary="folded"]'),
        ),
        streamOperationsPresent: Boolean(
          document.querySelector(
            '[data-testid="event-stream-operations-list"]',
          ),
        ),
        reconnectLifecyclePresent: Boolean(
          document.querySelector(
            '[data-testid="event-reconnect-lifecycle-section"]',
          ),
        ),
        sseExamplesPresent: Boolean(
          document.querySelector('[data-testid="sse-static-examples-section"]'),
        ),
      };
    });

    const failures: string[] = [];
    if (probe.surfaceStatus !== "success") {
      failures.push(`expected success surface, got ${probe.surfaceStatus}`);
    }
    if (probe.ownership !== "w09-production") {
      failures.push(
        `expected w09-production ownership, got ${probe.ownership}`,
      );
    }
    if (!probe.factoryCatalogPresent || !probe.responseCatalogPresent) {
      failures.push(
        "expected both FactoryEvent and FactoryResponseEvent catalogs",
      );
    }
    if (probe.eventCatalogLabelCount < 1) {
      failures.push("expected visible Event catalog label");
    }
    if (probe.hasVerbosePayloadOnlyDisclaimer) {
      failures.push("verbose payload-only disclaimer still visible");
    }
    if (probe.hasPointerPathChrome || probe.breadcrumbComponentsCount > 0) {
      failures.push(
        "verbose components/schemas/.../properties/... chrome visible",
      );
    }
    if (!probe.factoryEnvelopeExample || !probe.responseEnvelopeExample) {
      failures.push("expected full envelope JSON examples on both catalogs");
    }
    if (!probe.factoryEventType || !probe.factoryEventContext) {
      failures.push(
        "expected FactoryEventType and FactoryEventContext definitions",
      );
    }
    if (
      !probe.responseKindDef ||
      !probe.responsePhaseDef ||
      !probe.responseProvenanceDef
    ) {
      failures.push("expected response envelope component schema definitions");
    }
    if (probe.schemaVersionFieldCount !== 1) {
      failures.push(
        `expected schemaVersion listed once, got ${probe.schemaVersionFieldCount}`,
      );
    }
    if (probe.envelopeExampleCodeCount < 1) {
      failures.push("expected at least one envelope JSON example code block");
    }
    if (probe.envelopeExampleHasEllipsis) {
      failures.push(
        "envelope JSON example must not use ellipsis placeholder body",
      );
    }
    if (!probe.envelopeExampleHasSchemaVersion) {
      failures.push('envelope JSON example must include "schemaVersion"');
    }
    if (probe.payloadExampleCount < 1) {
      failures.push("expected payload-variant JSON examples");
    }
    if (probe.hasWhatItCoversHeading || probe.whatItCoversIdPresent) {
      failures.push("What It Covers intro chrome still present");
    }
    if (probe.hasKeyConceptsHeading || probe.keyConceptsIdPresent) {
      failures.push("Key Concepts intro chrome still present");
    }
    if (probe.hasFoldedOpeningSummary) {
      failures.push("folded Opening summary chrome still present");
    }
    if (!probe.eventCorpusIdPresent) {
      failures.push("expected #event-corpus as primary content");
    }
    if (!probe.streamOperationsPresent) {
      failures.push("expected event stream operations list");
    }
    if (!probe.reconnectLifecyclePresent) {
      failures.push("expected reconnect/lifecycle section");
    }
    if (!probe.sseExamplesPresent) {
      failures.push("expected static SSE examples section");
    }

    if (failures.length > 0) {
      console.error(JSON.stringify({ failures, probe }, null, 2));
      cleanup();
      process.exit(1);
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          baseUrl,
          port: EXISTING_BASE_URL ? null : PORT,
          probe,
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
  }

  cleanup();
  process.exit(0);
} catch (error) {
  console.error(error);
  cleanup();
  process.exit(1);
}
