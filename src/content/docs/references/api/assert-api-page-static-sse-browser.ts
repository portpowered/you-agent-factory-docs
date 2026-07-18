/**
 * Browser probe for published `/docs/references/api` static-only policy and
 * hybrid SSE summaries (W11 story 003). Run with plain `bun` from repo cwd.
 * Kills the local server on exit.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { launchPlaywrightBrowser } from "@/lib/verify/launch-playwright-browser";

const PORT = Number(process.env.API_REFERENCE_PAGE_PROBE_PORT ?? "3541");
const PAGE_PATH = "/docs/references/api";
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
  throw new Error(`Dev server not ready within ${timeoutMs}ms at ${url}`);
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
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    await page.goto(`${baseUrl}${PAGE_PATH}`, {
      waitUntil: "networkidle",
      timeout: 120_000,
    });

    const probe = await page.evaluate((ops) => {
      const surface = document.querySelector('[data-testid="api-surface"]');
      const statusPanel = document.querySelector('[data-testid="api-status"]');
      const root = document.querySelector("[data-api-reference-projection]");
      const notice = document.querySelector("[data-api-local-server-base-url]");
      const disclaimer = document.querySelector(
        "[data-api-local-server-docs-host-disclaimer]",
      );
      const sendButtons = Array.from(
        document.querySelectorAll("button, [role='button']"),
      ).filter((el) => /^\s*Send\s*$/i.test(el.textContent ?? ""));
      const tryIt = Array.from(
        document.querySelectorAll("button, [role='button'], a"),
      ).filter((el) => /try\s*it/i.test(el.textContent ?? ""));

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
          fullCatalog: panel?.getAttribute("data-api-sse-full-catalog") ?? null,
          preferred: panel?.getAttribute("data-api-sse-preferred") ?? null,
          hasTransport: Boolean(
            panel?.querySelector('[data-api-sse-semantics-field="transport"]'),
          ),
          hasReconnect: Boolean(
            panel?.querySelector('[data-api-sse-semantics-field="reconnect"]'),
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
            panel?.querySelector('[data-api-sse-semantics-field="dualAccept"]'),
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

      return {
        surfaceStatus: surface?.getAttribute("data-api-status") ?? null,
        hasStatusPanel: Boolean(statusPanel),
        sectionCount: document.querySelectorAll("[data-api-operation-section]")
          .length,
        suppressed: root?.getAttribute("data-api-playground-suppressed"),
        noticeUrl: notice?.getAttribute("data-api-local-server-base-url"),
        disclaimer: disclaimer?.textContent ?? null,
        sendButtons: sendButtons.length,
        tryIt: tryIt.length,
        summaryCount: document.querySelectorAll("[data-api-sse-summary]")
          .length,
        catalogSpikeMarkers: document.querySelectorAll(
          "[data-sse-catalog-section],[data-event-catalog-envelope]",
        ).length,
        liveConnectionTrueCount: document.querySelectorAll(
          "[data-api-sse-live-connection='true']",
        ).length,
        nonSseHasSummary: Boolean(
          document.querySelector(
            '[data-api-operation-id="submitWorkBySessionId"] [data-api-sse-summary]',
          ),
        ),
        summaries,
      };
    }, SSE_OPS);

    const failures: string[] = [];
    if (probe.surfaceStatus !== "ready") {
      failures.push(`expected ready API surface, got ${probe.surfaceStatus}`);
    }
    if (probe.hasStatusPanel) {
      failures.push("ready route must not show api-status panel");
    }
    if (probe.sectionCount < 1) {
      failures.push(`expected operation sections, got ${probe.sectionCount}`);
    }
    if (probe.suppressed !== "true") {
      failures.push(`expected playground suppressed, got ${probe.suppressed}`);
    }
    if (probe.noticeUrl !== "http://localhost:7437") {
      failures.push(`expected local-server notice, got ${probe.noticeUrl}`);
    }
    if (
      !probe.disclaimer?.includes("documentation site is not") ||
      !probe.disclaimer.includes("not at this docs host")
    ) {
      failures.push(`docs-host disclaimer missing: ${probe.disclaimer}`);
    }
    if (probe.sendButtons !== 0 || probe.tryIt !== 0) {
      failures.push(
        `live-execution affordances present: send=${probe.sendButtons} tryIt=${probe.tryIt}`,
      );
    }
    if (probe.summaryCount !== 3) {
      failures.push(`expected 3 SSE summaries, got ${probe.summaryCount}`);
    }
    if (probe.catalogSpikeMarkers !== 0) {
      failures.push(
        `unexpected event catalog UI markers (${probe.catalogSpikeMarkers})`,
      );
    }
    if (probe.liveConnectionTrueCount !== 0) {
      failures.push("live SSE connection marker must stay false");
    }
    if (probe.nonSseHasSummary) {
      failures.push(
        "non-SSE submitWorkBySessionId unexpectedly has SSE summary",
      );
    }

    for (const expected of SSE_OPS) {
      const actual = probe.summaries.find(
        (s) => s.operationId === expected.operationId,
      );
      if (!actual?.present) {
        failures.push(`missing SSE summary for ${expected.operationId}`);
        continue;
      }
      if (actual.role !== expected.role) {
        failures.push(
          `${expected.operationId} role=${actual.role} expected ${expected.role}`,
        );
      }
      if (actual.liveConnection !== "false" || actual.fullCatalog !== "false") {
        failures.push(`${expected.operationId} must stay static-only`);
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
          failures.push(`${expected.operationId} missing ${flag}`);
        }
      }
      const expectedHref = `/docs/references/events#${expected.eventsAnchor}`;
      if (actual.eventsHref !== expectedHref) {
        failures.push(
          `${expected.operationId} events href=${actual.eventsHref} expected ${expectedHref}`,
        );
      }
      if (
        expected.role === "compatibility-only" &&
        (!actual.neverPreferred || actual.preferred === "true")
      ) {
        failures.push("compatibility-only must be never preferred");
      }
      if (expected.role === "canonical" && actual.preferred !== "true") {
        failures.push("canonical must be preferred");
      }
    }

    if (failures.length > 0) {
      console.error(JSON.stringify({ failures, probe }, null, 2));
      cleanup();
      process.exit(1);
    }

    console.log(JSON.stringify({ ok: true, port: PORT, probe }, null, 2));
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
