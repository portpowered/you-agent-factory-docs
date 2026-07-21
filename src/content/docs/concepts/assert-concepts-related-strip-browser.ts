/**
 * Browser verify for concepts collection Related / References footer strip
 * (repair-docs-strip-related-concepts story 004).
 *
 * Proves on representative routes:
 * - bottlenecks: teaching section headings/ids present; Related To / References
 *   footer headings and `#related` / `#references` absent; Tags still present.
 * - statistical-process-control-graphs: same footer absence, plus teaching-
 *   section LocalizedLinkList links (Metrics documentation / Bottlenecks /
 *   Tokens) still visible under `#where-it-appears`.
 *
 * Run with plain `bun` from repo cwd. Kills the local server on exit.
 *
 * Worktree note: Claude worktrees often resolve `next` from a parent
 * `node_modules`. Turbopack rejects that layout, so this probe starts
 * `next dev --webpack`. Prefer `CONCEPTS_RELATED_STRIP_PROBE_BASE_URL` when a
 * server is already warm.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { launchPlaywrightBrowser } from "@/lib/verify/launch-playwright-browser";

const PORT = Number(process.env.CONCEPTS_RELATED_STRIP_PROBE_PORT ?? "3591");
const READY_TIMEOUT_MS = 180_000;
const PAGE_TIMEOUT_MS = 180_000;
const EXISTING_BASE_URL =
  process.env.CONCEPTS_RELATED_STRIP_PROBE_BASE_URL?.trim();

type RouteProbe = {
  path: string;
  teachingSectionIds: readonly string[];
  teachingLinkLabels?: readonly string[];
};

const ROUTES: readonly RouteProbe[] = [
  {
    path: "/docs/concepts/bottlenecks",
    teachingSectionIds: [
      "what-it-is",
      "why-it-matters",
      "simple-example",
      "where-it-appears",
      "common-confusions",
      "tags",
    ],
  },
  {
    path: "/docs/concepts/statistical-process-control-graphs",
    teachingSectionIds: [
      "what-it-is",
      "why-it-matters",
      "simple-example",
      "where-it-appears",
      "common-confusions",
      "tags",
    ],
    teachingLinkLabels: ["Metrics documentation", "Bottlenecks", "Tokens"],
  },
];

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

async function warmRoute(
  baseUrl: string,
  path: string,
  teachingSectionIds: readonly string[],
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < PAGE_TIMEOUT_MS) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        signal: AbortSignal.timeout(120_000),
      });
      if (response.ok) {
        const html = await response.text();
        if (
          !html.includes("Application error") &&
          teachingSectionIds.some((id) => html.includes(`id="${id}"`))
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
    `${path} did not warm with teaching section among [${teachingSectionIds.join(", ")}] within ${PAGE_TIMEOUT_MS}ms`,
  );
}

type PageProbeResult = {
  path: string;
  hasRelatedToHeading: boolean;
  hasReferencesHeading: boolean;
  relatedIdPresent: boolean;
  referencesIdPresent: boolean;
  hasTagsHeading: boolean;
  teachingSectionIdsPresent: string[];
  teachingLinksPresent: string[];
};

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

  const browser = await launchPlaywrightBrowser();
  const routeResults: PageProbeResult[] = [];
  const failures: string[] = [];

  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });

    for (const route of ROUTES) {
      await warmRoute(baseUrl, route.path, route.teachingSectionIds);

      const response = await page.goto(`${baseUrl}${route.path}`, {
        waitUntil: "domcontentloaded",
        timeout: PAGE_TIMEOUT_MS,
      });
      if (!response?.ok()) {
        failures.push(
          `${route.path}: expected HTTP 200, got ${response?.status() ?? "no response"}`,
        );
        continue;
      }

      await page.waitForSelector("h1", { timeout: 60_000 });

      const probe = await page.evaluate(
        ({ teachingSectionIds, teachingLinkLabels }) => {
          const headingText = (name: string) => {
            const headings = Array.from(
              document.querySelectorAll("h1, h2, h3, h4, h5, h6"),
            );
            return headings.some((el) =>
              new RegExp(`^\\s*${name}\\s*$`, "i").test(el.textContent ?? ""),
            );
          };

          const linkPresent = (label: string) => {
            const links = Array.from(document.querySelectorAll("a"));
            return links.some((el) =>
              new RegExp(`^\\s*${label}\\s*$`, "i").test(el.textContent ?? ""),
            );
          };

          return {
            hasRelatedToHeading: headingText("Related To"),
            hasReferencesHeading: headingText("References"),
            relatedIdPresent: Boolean(document.getElementById("related")),
            referencesIdPresent: Boolean(document.getElementById("references")),
            hasTagsHeading: headingText("Tags"),
            teachingSectionIdsPresent: teachingSectionIds.filter((id) =>
              Boolean(document.getElementById(id)),
            ),
            teachingLinksPresent: teachingLinkLabels.filter((label) =>
              linkPresent(label),
            ),
          };
        },
        {
          teachingSectionIds: [...route.teachingSectionIds],
          teachingLinkLabels: [...(route.teachingLinkLabels ?? [])],
        },
      );

      const result: PageProbeResult = { path: route.path, ...probe };
      routeResults.push(result);

      if (probe.hasRelatedToHeading || probe.relatedIdPresent) {
        failures.push(`${route.path}: Related To footer chrome still present`);
      }
      if (probe.hasReferencesHeading || probe.referencesIdPresent) {
        failures.push(`${route.path}: References footer chrome still present`);
      }
      if (!probe.hasTagsHeading) {
        failures.push(`${route.path}: Tags heading missing`);
      }
      if (
        probe.teachingSectionIdsPresent.length < route.teachingSectionIds.length
      ) {
        failures.push(
          `${route.path}: expected teaching sections [${route.teachingSectionIds.join(", ")}], found [${probe.teachingSectionIdsPresent.join(", ")}]`,
        );
      }
      if (route.teachingLinkLabels) {
        const missing = route.teachingLinkLabels.filter(
          (label) => !probe.teachingLinksPresent.includes(label),
        );
        if (missing.length > 0) {
          failures.push(
            `${route.path}: teaching-section links missing: [${missing.join(", ")}]`,
          );
        }
      }
    }
  } finally {
    await browser.close();
  }

  if (failures.length > 0) {
    console.error(JSON.stringify({ failures, routeResults }, null, 2));
    cleanup();
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        baseUrl,
        port: EXISTING_BASE_URL ? null : PORT,
        routeCount: routeResults.length,
        routeResults,
      },
      null,
      2,
    ),
  );

  cleanup();
  process.exit(0);
} catch (error) {
  console.error(error);
  cleanup();
  process.exit(1);
}
