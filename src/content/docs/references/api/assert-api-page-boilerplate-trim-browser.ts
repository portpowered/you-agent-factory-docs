/**
 * Browser probe for published `/docs/references/api` projection-first MDX:
 * how-to-use, limits-and-assumptions, tags, related, and citations sections
 * must be absent while orientation + Fumadocs operations remain.
 * (repair-api-fumadocs-openapi-components story 004).
 *
 * Run with plain `bun` from repo cwd. Kills the local server on exit.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { launchPlaywrightBrowser } from "@/lib/verify/launch-playwright-browser";

const PORT = Number(
  process.env.API_REFERENCE_BOILERPLATE_TRIM_PROBE_PORT ?? "3562",
);
const PAGE_PATH = "/docs/references/api";
const READY_TIMEOUT_MS = 180_000;

const REMOVED_SECTION_IDS = [
  "how-to-use",
  "limits-and-assumptions",
  "related",
  "tags",
  "references",
] as const;

// Unambiguous MDX boilerplate titles only — avoid "Tags"/"References", which
// Fumadocs OpenAPI chrome may reuse as ordinary headings.
const REMOVED_HEADING_NAMES = [
  "How To Use",
  "Limits And Assumptions",
  "Related To",
] as const;

const KEPT_SECTION_IDS = [
  "what-it-covers",
  "key-concepts",
  "operations",
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

  await page.waitForSelector(
    '[data-api-status="ready"], [data-api-status="empty"], [data-api-status="invalid"]',
    { timeout: 120_000 },
  );

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

  const sectionProbe = await page.evaluate(
    ({ keptIds, removedIds, removedHeadings }) => {
      const kept = keptIds.map((id) => ({
        id,
        present: document.getElementById(id) !== null,
      }));
      const removed = removedIds.map((id) => ({
        id,
        present: document.getElementById(id) !== null,
      }));
      const headings = Array.from(
        document.querySelectorAll("h1, h2, h3, h4, h5, h6"),
      ).map((el) => (el.textContent ?? "").trim());
      const removedHeadingHits = removedHeadings.filter((name) =>
        headings.includes(name),
      );
      return { kept, removed, removedHeadingHits, headings };
    },
    {
      keptIds: [...KEPT_SECTION_IDS],
      removedIds: [...REMOVED_SECTION_IDS],
      removedHeadings: [...REMOVED_HEADING_NAMES],
    },
  );

  for (const entry of sectionProbe.kept) {
    if (!entry.present) {
      throw new Error(`Expected kept section #${entry.id} on ${PAGE_PATH}`);
    }
  }
  for (const entry of sectionProbe.removed) {
    if (entry.present) {
      throw new Error(
        `Expected removed boilerplate section #${entry.id} to be absent`,
      );
    }
  }
  if (sectionProbe.removedHeadingHits.length > 0) {
    throw new Error(
      `Expected removed boilerplate headings absent, found: ${sectionProbe.removedHeadingHits.join(", ")}`,
    );
  }

  const fumadocsOps = await page
    .locator("[data-api-fumadocs-operation]")
    .count();
  if (fumadocsOps < 1) {
    throw new Error("Expected at least one Fumadocs-rendered operation");
  }

  await browser.close();

  process.stdout.write(
    `${JSON.stringify({
      ok: true,
      path: PAGE_PATH,
      keptSections: KEPT_SECTION_IDS,
      removedSections: REMOVED_SECTION_IDS,
      fumadocsOperationCount: fumadocsOps,
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
