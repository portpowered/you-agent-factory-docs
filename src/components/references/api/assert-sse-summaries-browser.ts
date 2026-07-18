/**
 * Browser probe for W08 story 008: hybrid SSE summaries on the API harness.
 * Run with plain `bun` from repo cwd. Kills the harness server on exit.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { launchPlaywrightBrowser } from "@/lib/verify/launch-playwright-browser";

const PORT = Number(process.env.API_RENDERER_HARNESS_PROBE_PORT ?? "3538");
const HARNESS_PATH = "/api-renderer-harness";
const READY_TIMEOUT_MS = 120_000;

const SSE_OPS = [
  {
    operationId: "getEventsBySessionId",
    role: "canonical",
    eventsAnchor: "components-schemas-FactoryEvent",
  },
  {
    operationId: "getFactoryResponseEventsBySessionId",
    role: "ephemeral",
    eventsAnchor: "components-schemas-FactoryResponseEvent",
  },
  {
    operationId: "getEvents",
    role: "compatibility-only",
    eventsAnchor: "components-schemas-FactoryEvent",
  },
] as const;

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
  throw new Error(`Harness not ready within ${timeoutMs}ms at ${url}`);
}

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

  const baseUrl = `http://localhost:${PORT}`;
  await waitForReady(baseUrl, READY_TIMEOUT_MS);

  const browser = await launchPlaywrightBrowser();
  try {
    const results: Record<string, unknown> = {};

    for (const viewport of [
      { name: "desktop", width: 1440, height: 900 },
      { name: "phone", width: 390, height: 844 },
    ] as const) {
      const page = await browser.newPage({
        viewport: { width: viewport.width, height: viewport.height },
      });
      await page.goto(`${baseUrl}${HARNESS_PATH}`, {
        waitUntil: "networkidle",
        timeout: 60_000,
      });

      const probe = await page.evaluate((ops) => {
        const summaries = ops.map((op) => {
          const panel = document.querySelector(
            `[data-api-sse-summary="${op.operationId}"]`,
          );
          const link = panel?.querySelector(
            `[data-api-sse-events-link="${op.eventsAnchor}"]`,
          );
          return {
            operationId: op.operationId,
            present: Boolean(panel),
            role: panel?.getAttribute("data-api-sse-role") ?? null,
            liveConnection:
              panel?.getAttribute("data-api-sse-live-connection") ?? null,
            fullCatalog:
              panel?.getAttribute("data-api-sse-full-catalog") ?? null,
            preferred: panel?.getAttribute("data-api-sse-preferred") ?? null,
            hasTransport: Boolean(
              panel?.querySelector(
                '[data-api-sse-semantics-field="transport"]',
              ),
            ),
            hasReconnect: Boolean(
              panel?.querySelector(
                '[data-api-sse-semantics-field="reconnect"]',
              ),
            ),
            hasCursor: Boolean(
              panel?.querySelector(
                '[data-api-sse-semantics-field="cursorPrecedence"]',
              ),
            ),
            hasHandshake: Boolean(
              panel?.querySelector(
                '[data-api-sse-semantics-field="handshakeHeaders"]',
              ),
            ),
            hasDualAccept: Boolean(
              panel?.querySelector(
                '[data-api-sse-semantics-field="dualAccept"]',
              ),
            ),
            hasReplay: Boolean(
              panel?.querySelector(
                '[data-api-sse-semantics-field="replayRetainedHistory"]',
              ),
            ),
            hasCompatibility: Boolean(
              panel?.querySelector(
                '[data-api-sse-semantics-field="compatibilityOnlyStatus"]',
              ),
            ),
            eventsHref: link?.getAttribute("href") ?? null,
            neverPreferred: Boolean(
              panel?.querySelector("[data-api-sse-never-preferred]"),
            ),
          };
        });

        const eventSourceOpen =
          typeof (window as { EventSource?: unknown }).EventSource ===
          "function"
            ? document.querySelectorAll("[data-api-sse-live-connection='true']")
                .length
            : 0;

        const nonSseHasSummary = Boolean(
          document.querySelector(
            '[data-api-operation-id="submitWorkBySessionId"] [data-api-sse-summary]',
          ),
        );

        return {
          summaries,
          summaryCount: document.querySelectorAll("[data-api-sse-summary]")
            .length,
          catalogSpikeMarkers: document.querySelectorAll(
            "[data-sse-catalog-section],[data-event-catalog-envelope]",
          ).length,
          liveConnectionTrueCount: eventSourceOpen,
          nonSseHasSummary,
        };
      }, SSE_OPS);

      const failures: string[] = [];
      if (probe.summaryCount !== 3) {
        failures.push(
          `${viewport.name}: expected 3 SSE summaries, got ${probe.summaryCount}`,
        );
      }
      if (probe.catalogSpikeMarkers !== 0) {
        failures.push(
          `${viewport.name}: unexpected event catalog UI markers (${probe.catalogSpikeMarkers})`,
        );
      }
      if (probe.nonSseHasSummary) {
        failures.push(
          `${viewport.name}: non-SSE submitWorkBySessionId unexpectedly has SSE summary`,
        );
      }

      for (const expected of SSE_OPS) {
        const actual = probe.summaries.find(
          (s) => s.operationId === expected.operationId,
        );
        if (!actual?.present) {
          failures.push(
            `${viewport.name}: missing SSE summary for ${expected.operationId}`,
          );
          continue;
        }
        if (actual.role !== expected.role) {
          failures.push(
            `${viewport.name}: ${expected.operationId} role=${actual.role} expected ${expected.role}`,
          );
        }
        if (actual.liveConnection !== "false") {
          failures.push(
            `${viewport.name}: ${expected.operationId} must stay static (liveConnection=${actual.liveConnection})`,
          );
        }
        if (actual.fullCatalog !== "false") {
          failures.push(
            `${viewport.name}: ${expected.operationId} must not embed full catalog`,
          );
        }
        for (const flag of [
          "hasTransport",
          "hasReconnect",
          "hasCursor",
          "hasHandshake",
          "hasDualAccept",
          "hasReplay",
          "hasCompatibility",
        ] as const) {
          if (!actual[flag]) {
            failures.push(
              `${viewport.name}: ${expected.operationId} missing ${flag}`,
            );
          }
        }
        const expectedHref = `/docs/references/events#${expected.eventsAnchor}`;
        if (actual.eventsHref !== expectedHref) {
          failures.push(
            `${viewport.name}: ${expected.operationId} events href=${actual.eventsHref} expected ${expectedHref}`,
          );
        }
        if (
          expected.role === "compatibility-only" &&
          (!actual.neverPreferred || actual.preferred === "true")
        ) {
          failures.push(
            `${viewport.name}: compatibility-only must be never preferred`,
          );
        }
        if (expected.role === "canonical" && actual.preferred !== "true") {
          failures.push(`${viewport.name}: canonical must be preferred`);
        }
      }

      results[viewport.name] = { probe, failures };
      await page.close();

      if (failures.length > 0) {
        console.error(
          JSON.stringify({ viewport: viewport.name, failures, probe }, null, 2),
        );
        cleanup();
        process.exit(1);
      }
    }

    console.log(JSON.stringify({ ok: true, results }, null, 2));
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
