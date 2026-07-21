/**
 * End-to-end browser gate for published `/docs/references/api` after the
 * Fumadocs OpenAPI switch (repair-api-fumadocs-openapi-components story 006).
 *
 * Consolidates reader-facing outcomes that earlier story probes proved in
 * isolation: Fumadocs operations, static-only (no try-it), schema/component
 * fields, thin SSE notes, projection-first MDX (no removed boilerplate), and
 * readable method/path/summary markers for no-JS/a11y contracts.
 *
 * Run with plain `bun` from repo cwd. Kills the local server on exit.
 */

import { type ChildProcess, spawn } from "node:child_process";
import {
  API_SCHEMA_COMPONENT_PROBE,
  API_SCHEMA_SLOT_ATTR,
  API_SSE_OPERATIONS,
} from "@/features/references/api";
import { launchPlaywrightBrowser } from "@/lib/verify/launch-playwright-browser";

const PORT = Number(process.env.API_REFERENCE_GATES_PROBE_PORT ?? "3572");
const PAGE_PATH = "/docs/references/api";
const READY_TIMEOUT_MS = 180_000;

const REMOVED_SECTION_IDS = [
  "how-to-use",
  "limits-and-assumptions",
  "related",
  "tags",
  "references",
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

  const base = `http://127.0.0.1:${PORT}`;
  await waitForReady(base, READY_TIMEOUT_MS);

  const browser = await launchPlaywrightBrowser();
  const page = await browser.newPage();
  page.setDefaultTimeout(120_000);

  const response = await page.goto(`${base}${PAGE_PATH}`, {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });
  if (!response?.ok()) {
    throw new Error(
      `Expected 200 for ${PAGE_PATH}, got ${response?.status() ?? "no response"}`,
    );
  }

  await page.waitForFunction(
    () => {
      const statuses = Array.from(
        document.querySelectorAll("[data-api-status]"),
      ).map((el) => el.getAttribute("data-api-status"));
      return (
        statuses.includes("ready") ||
        statuses.includes("empty") ||
        (statuses.includes("invalid") && !statuses.includes("loading"))
      );
    },
    { timeout: 120_000 },
  );

  const status = await page.evaluate(() => {
    const statuses = Array.from(
      document.querySelectorAll("[data-api-status]"),
    ).map((el) => el.getAttribute("data-api-status"));
    if (statuses.includes("ready")) return "ready";
    if (statuses.includes("empty")) return "empty";
    if (statuses.includes("invalid")) return "invalid";
    return statuses[0] ?? null;
  });
  if (status !== "ready") {
    throw new Error(`Expected ready API surface, got status=${status}`);
  }

  const fumadocsOps = await page
    .locator("[data-api-fumadocs-operation]")
    .count();
  if (fumadocsOps < 1) {
    throw new Error(
      "Expected Fumadocs-rendered operations on the published page",
    );
  }

  const suppressed = await page
    .locator("[data-api-playground-suppressed='true']")
    .count();
  if (suppressed < 1) {
    throw new Error("Expected data-api-playground-suppressed=true");
  }

  const sendCount = await page.evaluate(() => {
    return Array.from(
      document.querySelectorAll("button, [role='button']"),
    ).filter((el) => /^\s*Send\s*$/i.test(el.textContent ?? "")).length;
  });
  const tryItCount = await page.evaluate(() => {
    return Array.from(
      document.querySelectorAll("button, [role='button'], a"),
    ).filter((el) => /try\s*it/i.test(el.textContent ?? "")).length;
  });
  if (sendCount > 0 || tryItCount > 0) {
    throw new Error(
      `Expected no try-it / Send controls, got send=${sendCount} tryIt=${tryItCount}`,
    );
  }

  for (const sectionId of REMOVED_SECTION_IDS) {
    const present = await page.locator(`#${sectionId}`).count();
    if (present > 0) {
      throw new Error(`Expected removed boilerplate section #${sectionId}`);
    }
  }

  const readable = await page.evaluate(() => {
    const sections = Array.from(
      document.querySelectorAll("[data-api-operation-section]"),
    );
    let readableCount = 0;
    for (const section of sections) {
      const method =
        section.getAttribute("data-api-operation-method")?.trim() || "";
      const path =
        section.getAttribute("data-api-operation-path")?.trim() || "";
      const summary =
        section.getAttribute("data-api-operation-summary")?.trim() ||
        section.querySelector("h2, h3")?.textContent?.trim() ||
        "";
      if (method && path && summary) {
        readableCount += 1;
      }
    }
    const pathTokens = document.querySelectorAll(
      "[data-api-operation-path-token] code",
    ).length;
    return { sectionCount: sections.length, readableCount, pathTokens };
  });
  if (readable.readableCount < 1) {
    throw new Error(
      `Expected readable method/path/summary on Fumadocs sections; got ${JSON.stringify(readable)}`,
    );
  }
  if (readable.pathTokens < 1) {
    throw new Error(
      "Expected data-api-operation-path-token code markers for long-token a11y",
    );
  }

  const sampleReadable = await page.evaluate(() => {
    const section = document.querySelector("[data-api-operation-section]");
    if (!section) return false;
    const method =
      section.getAttribute("data-api-operation-method")?.trim() || "";
    const path = section.getAttribute("data-api-operation-path")?.trim() || "";
    const summary =
      section.getAttribute("data-api-operation-summary")?.trim() || "";
    return method.length > 0 && path.length > 0 && summary.length > 0;
  });
  if (!sampleReadable) {
    throw new Error(
      "Sample operation section missing method/path/summary data attributes",
    );
  }

  const sseOpIds = API_SSE_OPERATIONS.map((op) => op.operationId);
  await page.waitForSelector("[data-api-sse-summary]", { timeout: 60_000 });
  const sseProbe = await page.evaluate((ids) => {
    const summaries = Array.from(
      document.querySelectorAll("[data-api-sse-summary]"),
    );
    const eventsLinks = Array.from(
      document.querySelectorAll('a[href^="/docs/references/events"]'),
    ).length;
    const insideFumadocs = summaries.filter((el) =>
      el.closest("[data-api-fumadocs-operation]"),
    ).length;
    const matchedIds = ids.filter(
      (id) =>
        document.querySelector(
          `[data-api-fumadocs-operation="${id}"] [data-api-sse-summary]`,
        ) !== null,
    );
    return {
      summaryCount: summaries.length,
      insideFumadocs,
      eventsLinks,
      matchedIds,
    };
  }, sseOpIds);
  if (sseProbe.summaryCount < 3 || sseProbe.insideFumadocs < 3) {
    throw new Error(
      `Expected 3 SSE summaries inside Fumadocs ops, got ${JSON.stringify(sseProbe)}`,
    );
  }
  if (sseProbe.eventsLinks < 1) {
    throw new Error("Expected events catalog links from SSE transport notes");
  }

  const { operationId, expectedFieldNames } = API_SCHEMA_COMPONENT_PROBE;
  const schemaSection = page.locator(
    `[data-api-fumadocs-operation="${operationId}"]`,
  );
  await schemaSection.scrollIntoViewIfNeeded();
  await page.waitForFunction(
    ({ opId, slotAttr, fields }) => {
      const op = document.querySelector(
        `[data-api-fumadocs-operation="${opId}"]`,
      );
      const requestSlot = op?.querySelector(`[${slotAttr}="request"]`);
      const text = requestSlot?.textContent ?? "";
      return (
        Boolean(requestSlot) && fields.every((field) => text.includes(field))
      );
    },
    {
      opId: operationId,
      slotAttr: API_SCHEMA_SLOT_ATTR,
      fields: [...expectedFieldNames],
    },
    { timeout: 60_000 },
  );

  await browser.close();

  process.stdout.write(
    `${JSON.stringify({
      ok: true,
      path: PAGE_PATH,
      fumadocsOperationCount: fumadocsOps,
      readableOperationCount: readable.readableCount,
      pathTokenCount: readable.pathTokens,
      sseSummaries: sseProbe.summaryCount,
      schemaOperationId: operationId,
      schemaFields: expectedFieldNames,
      playgroundSuppressed: true,
      removedBoilerplateAbsent: true,
    })}\n`,
  );
  cleanup();
  process.exit(0);
} catch (error) {
  cleanup();
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
}
