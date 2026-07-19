/**
 * Browser verify for Documentation Program **core product** pages after intro
 * strip (repair-documentation-program-intro-strip-core story 003).
 *
 * Proves on each owned route: no What It Covers / Key Concepts; purpose lead via
 * DocsOpeningSummary ([data-opening-summary] / [data-testid="folded-summary"]);
 * at least one teaching section still present; #how-to-use absent when it was
 * stripped as opening boilerplate.
 *
 * Run with plain `bun` from repo cwd. Kills the local server on exit.
 *
 * Worktree note: Claude worktrees often resolve `next` from a parent
 * `node_modules`. Turbopack rejects that layout, so this probe starts
 * `next dev --webpack`. Prefer
 * `DOC_PROGRAM_CORE_INTRO_STRIP_PROBE_BASE_URL` when a server is already warm.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { launchPlaywrightBrowser } from "@/lib/verify/launch-playwright-browser";

const PORT = Number(
  process.env.DOC_PROGRAM_CORE_INTRO_STRIP_PROBE_PORT ?? "3587",
);
const READY_TIMEOUT_MS = 180_000;
const PAGE_TIMEOUT_MS = 180_000;
const EXISTING_BASE_URL =
  process.env.DOC_PROGRAM_CORE_INTRO_STRIP_PROBE_BASE_URL?.trim();

type RouteProbe = {
  path: string;
  /** At least one of these section ids must remain after the purpose lead. */
  teachingSectionIds: readonly string[];
  /** True when opening how-to-use was stripped as meta reading guidance. */
  howToUseMustBeAbsent: boolean;
};

const ROUTES: readonly RouteProbe[] = [
  {
    path: "/docs/documentation/what-is-you-agent-factory",
    teachingSectionIds: ["limits-and-assumptions"],
    howToUseMustBeAbsent: true,
  },
  {
    path: "/docs/documentation/install",
    teachingSectionIds: ["how-to-use"],
    howToUseMustBeAbsent: false,
  },
  {
    path: "/docs/documentation/cli",
    teachingSectionIds: ["install", "commands"],
    howToUseMustBeAbsent: true,
  },
  {
    path: "/docs/documentation/mcp",
    teachingSectionIds: [
      "how-to-integrate",
      "serve-modes",
      "factory-session-tools",
    ],
    howToUseMustBeAbsent: false,
  },
  {
    path: "/docs/documentation/contributing-to-these-docs",
    teachingSectionIds: ["how-to-use"],
    howToUseMustBeAbsent: false,
  },
  {
    path: "/docs/documentation/faq",
    teachingSectionIds: ["what-is-you-agent-factory", "how-to-install"],
    howToUseMustBeAbsent: true,
  },
  {
    path: "/docs/documentation/troubleshooting",
    teachingSectionIds: ["command-not-found"],
    howToUseMustBeAbsent: true,
  },
  {
    path: "/docs/documentation/submitting-work",
    teachingSectionIds: ["work-batches"],
    howToUseMustBeAbsent: true,
  },
  {
    path: "/docs/documentation/harness-support",
    teachingSectionIds: ["support-matrix"],
    howToUseMustBeAbsent: false,
  },
  {
    path: "/docs/documentation/architecture-of-system",
    teachingSectionIds: ["system-diagram"],
    howToUseMustBeAbsent: false,
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

async function warmRoute(baseUrl: string, path: string): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < PAGE_TIMEOUT_MS) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        signal: AbortSignal.timeout(120_000),
      });
      if (response.ok) {
        const html = await response.text();
        if (
          html.includes('data-testid="folded-summary"') ||
          html.includes('data-opening-summary="folded"')
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
    `${path} did not warm with opening-summary markers within ${PAGE_TIMEOUT_MS}ms`,
  );
}

type PageProbeResult = {
  path: string;
  hasWhatItCoversHeading: boolean;
  hasKeyConceptsHeading: boolean;
  whatItCoversIdPresent: boolean;
  keyConceptsIdPresent: boolean;
  openingSummaryPresent: boolean;
  foldedSummaryPresent: boolean;
  howToUseIdPresent: boolean;
  teachingSectionIdsPresent: string[];
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
      await warmRoute(baseUrl, route.path);

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

      await page.waitForSelector(
        '[data-testid="folded-summary"], [data-opening-summary="folded"]',
        { timeout: 60_000 },
      );

      const probe = await page.evaluate(
        ({ teachingSectionIds }) => {
          const headingText = (name: string) => {
            const headings = Array.from(
              document.querySelectorAll("h1, h2, h3, h4, h5, h6"),
            );
            return headings.some((el) =>
              new RegExp(`^\\s*${name}\\s*$`, "i").test(el.textContent ?? ""),
            );
          };

          return {
            hasWhatItCoversHeading: headingText("What It Covers"),
            hasKeyConceptsHeading: headingText("Key Concepts"),
            whatItCoversIdPresent: Boolean(
              document.getElementById("what-it-covers"),
            ),
            keyConceptsIdPresent: Boolean(
              document.getElementById("key-concepts"),
            ),
            openingSummaryPresent: Boolean(
              document.querySelector('[data-opening-summary="folded"]'),
            ),
            foldedSummaryPresent: Boolean(
              document.querySelector('[data-testid="folded-summary"]'),
            ),
            howToUseIdPresent: Boolean(document.getElementById("how-to-use")),
            teachingSectionIdsPresent: teachingSectionIds.filter((id) =>
              Boolean(document.getElementById(id)),
            ),
          };
        },
        { teachingSectionIds: [...route.teachingSectionIds] },
      );

      const result: PageProbeResult = { path: route.path, ...probe };
      routeResults.push(result);

      if (probe.hasWhatItCoversHeading || probe.whatItCoversIdPresent) {
        failures.push(`${route.path}: What It Covers intro still present`);
      }
      if (probe.hasKeyConceptsHeading || probe.keyConceptsIdPresent) {
        failures.push(`${route.path}: Key Concepts intro still present`);
      }
      if (!probe.openingSummaryPresent || !probe.foldedSummaryPresent) {
        failures.push(
          `${route.path}: purpose openingSummary lead missing (DocsOpeningSummary)`,
        );
      }
      if (probe.teachingSectionIdsPresent.length === 0) {
        failures.push(
          `${route.path}: expected teaching section among [${route.teachingSectionIds.join(", ")}]`,
        );
      }
      if (route.howToUseMustBeAbsent && probe.howToUseIdPresent) {
        failures.push(
          `${route.path}: #how-to-use still present (opening boilerplate should be stripped)`,
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
