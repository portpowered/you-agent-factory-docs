/**
 * Browser verify for Documentation Program ops/platform intro strip
 * (and Opening summary chrome retirement).
 *
 * Proves each owned route has no What It Covers / Key Concepts / #what-it-covers
 * / #key-concepts, no multi-heading Summary overview block, no bordered Opening
 * summary chrome ([data-opening-summary] / [data-testid="folded-summary"]), and
 * at least one remaining operational teaching marker.
 *
 * Routes: logs, metrics, resources, petri, packaged-documents,
 * dashboard-ui-overview, security-trust-boundaries, throttling-and-limits,
 * replays-records.
 *
 * Run with plain `bun` from repo cwd. Kills the local server on exit.
 *
 * Worktree note: Claude worktrees often resolve `next` from a parent
 * `node_modules`. Turbopack rejects that layout, so this probe starts
 * `next dev --webpack`. Prefer `OPS_INTRO_STRIP_PROBE_BASE_URL` when a server
 * is already warm.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { launchPlaywrightBrowser } from "@/lib/verify/launch-playwright-browser";

const PORT = Number(process.env.OPS_INTRO_STRIP_PROBE_PORT ?? "3681");
const READY_TIMEOUT_MS = 180_000;
const PAGE_TIMEOUT_MS = 180_000;
const EXISTING_BASE_URL = process.env.OPS_INTRO_STRIP_PROBE_BASE_URL?.trim();

const ROUTES: Array<{
  path: string;
  warmNeedle: string;
  teaching: {
    sectionId?: string;
    textIncludes: string[];
  };
}> = [
  {
    path: "/docs/documentation/logs",
    warmNeedle: "how-to-use",
    teaching: {
      sectionId: "how-to-use",
      textIncludes: ["retention"],
    },
  },
  {
    path: "/docs/documentation/metrics",
    warmNeedle: "status-read",
    teaching: {
      sectionId: "status-read",
      textIncludes: ["factoryState", "runtimeStatus"],
    },
  },
  {
    path: "/docs/documentation/resources",
    warmNeedle: "where-requirements-belong",
    teaching: {
      sectionId: "where-requirements-belong",
      textIncludes: ["resource pool", "concurrency"],
    },
  },
  {
    path: "/docs/documentation/petri",
    warmNeedle: "how-to-use",
    teaching: {
      sectionId: "how-to-use",
      textIncludes: ["task:init"],
    },
  },
  {
    path: "/docs/documentation/packaged-documents",
    warmNeedle: "how-to-use",
    teaching: {
      sectionId: "how-to-use",
      textIncludes: ["you docs"],
    },
  },
  {
    path: "/docs/documentation/dashboard-ui-overview",
    warmNeedle: "how-to-use",
    teaching: {
      sectionId: "how-to-use",
      textIncludes: ["localhost:7437/dashboard/ui"],
    },
  },
  {
    path: "/docs/documentation/security-trust-boundaries",
    warmNeedle: "how-to-use",
    teaching: {
      sectionId: "how-to-use",
      textIncludes: ["localhost:7437"],
    },
  },
  {
    path: "/docs/documentation/throttling-and-limits",
    warmNeedle: "how-to-use",
    teaching: {
      sectionId: "how-to-use",
      textIncludes: ["Configured resource capacity"],
    },
  },
  {
    path: "/docs/documentation/replays-records",
    warmNeedle: "how-to-use",
    teaching: {
      sectionId: "how-to-use",
      textIncludes: ["--replay"],
    },
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

async function warmPage(
  baseUrl: string,
  path: string,
  warmNeedle: string,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < PAGE_TIMEOUT_MS) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        signal: AbortSignal.timeout(120_000),
      });
      if (response.ok) {
        const html = await response.text();
        if (html.includes(warmNeedle) && !html.includes("Application error")) {
          return;
        }
      }
    } catch {
      // still compiling
    }
    await Bun.sleep(2_000);
  }
  throw new Error(
    `${path} did not warm with needle "${warmNeedle}" within ${PAGE_TIMEOUT_MS}ms`,
  );
}

type RouteProbe = {
  path: string;
  hasWhatItCoversHeading: boolean;
  hasKeyConceptsHeading: boolean;
  hasSummarySectionHeading: boolean;
  whatItCoversIdPresent: boolean;
  keyConceptsIdPresent: boolean;
  openingSummaryPresent: boolean;
  foldedSummaryPresent: boolean;
  teachingSectionPresent: boolean;
  teachingMarkersPresent: boolean;
  teachingSnippet: string;
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

  for (const route of ROUTES) {
    await warmPage(baseUrl, route.path, route.warmNeedle);
  }

  const browser = await launchPlaywrightBrowser();
  const routeResults: RouteProbe[] = [];
  const failures: string[] = [];

  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });

    for (const route of ROUTES) {
      await page.goto(`${baseUrl}${route.path}`, {
        waitUntil: "domcontentloaded",
        timeout: PAGE_TIMEOUT_MS,
      });

      if (route.teaching.sectionId) {
        await page.waitForSelector(`#${route.teaching.sectionId}`, {
          timeout: 60_000,
        });
      }

      const probe = await page.evaluate(
        ({ path, teaching }) => {
          const headingText = (name: string) => {
            const headings = Array.from(
              document.querySelectorAll("h1, h2, h3, h4, h5, h6"),
            );
            return headings.some((el) =>
              new RegExp(`^\\s*${name}\\s*$`, "i").test(el.textContent ?? ""),
            );
          };

          const teachingSection = teaching.sectionId
            ? document.getElementById(teaching.sectionId)
            : document.body;
          const teachingText = teachingSection?.textContent ?? "";
          const teachingMarkersPresent = teaching.textIncludes.every((needle) =>
            teachingText.toLowerCase().includes(needle.toLowerCase()),
          );

          return {
            path,
            hasWhatItCoversHeading: headingText("What It Covers"),
            hasKeyConceptsHeading: headingText("Key Concepts"),
            // A visible "Summary" section heading would be leftover informational chrome.
            hasSummarySectionHeading: headingText("Summary"),
            whatItCoversIdPresent: Boolean(
              document.getElementById("what-it-covers"),
            ),
            keyConceptsIdPresent: Boolean(
              document.getElementById("key-concepts"),
            ),
            openingSummaryPresent: Boolean(
              document.querySelector('[data-opening-summary="folded"]') ||
                document.querySelector('[aria-label="Opening summary"]'),
            ),
            foldedSummaryPresent: Boolean(
              document.querySelector('[data-testid="folded-summary"]'),
            ),
            teachingSectionPresent: teaching.sectionId
              ? Boolean(document.getElementById(teaching.sectionId))
              : true,
            teachingMarkersPresent,
            teachingSnippet: teachingText.slice(0, 160).replace(/\s+/g, " "),
          };
        },
        {
          path: route.path,
          teaching: route.teaching,
        },
      );

      routeResults.push(probe);

      if (probe.hasWhatItCoversHeading || probe.whatItCoversIdPresent) {
        failures.push(`${route.path}: What It Covers intro still present`);
      }
      if (probe.hasKeyConceptsHeading || probe.keyConceptsIdPresent) {
        failures.push(`${route.path}: Key Concepts intro still present`);
      }
      if (probe.hasSummarySectionHeading) {
        failures.push(
          `${route.path}: visible Summary section heading still present`,
        );
      }
      if (probe.openingSummaryPresent || probe.foldedSummaryPresent) {
        failures.push(
          `${route.path}: folded Opening summary chrome still present`,
        );
      }
      if (!probe.teachingSectionPresent || !probe.teachingMarkersPresent) {
        failures.push(
          `${route.path}: operational teaching marker missing (${route.teaching.textIncludes.join(", ")})`,
        );
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
        routesChecked: ROUTES.length,
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
