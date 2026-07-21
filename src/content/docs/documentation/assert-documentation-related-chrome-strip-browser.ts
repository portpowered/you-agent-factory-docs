/**
 * Browser verify for Documentation collection PF-L-strip of Related /
 * References footer chrome (minus FAQ).
 *
 * Proves on each owned stripped route: no Related / Related To / References
 * footer headings; no `#related` / `#references` section mounts; at least one
 * teaching section still present. FAQ is intentionally omitted (fenced for
 * #190 / PF-D2).
 *
 * Run with plain `bun` from repo cwd. Kills the local server on exit.
 *
 * Worktree note: Claude worktrees often resolve `next` from a parent
 * `node_modules`. Turbopack rejects that layout, so this probe starts
 * `next dev --webpack`. Prefer
 * `DOC_RELATED_CHROME_STRIP_PROBE_BASE_URL` when a server is already warm.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { launchPlaywrightBrowser } from "@/lib/verify/launch-playwright-browser";

const PORT = Number(process.env.DOC_RELATED_CHROME_STRIP_PROBE_PORT ?? "3591");
const READY_TIMEOUT_MS = 180_000;
const PAGE_TIMEOUT_MS = 180_000;
const EXISTING_BASE_URL =
  process.env.DOC_RELATED_CHROME_STRIP_PROBE_BASE_URL?.trim();

type RouteProbe = {
  path: string;
  /** At least one of these section ids must remain after the strip. */
  teachingSectionIds: readonly string[];
};

/** Representative stripped non-FAQ documentation routes (FAQ fenced). */
const ROUTES: readonly RouteProbe[] = [
  {
    path: "/docs/documentation/cli",
    teachingSectionIds: ["install", "commands"],
  },
  {
    path: "/docs/documentation/troubleshooting",
    teachingSectionIds: ["command-not-found"],
  },
  {
    path: "/docs/documentation/what-is-you-agent-factory",
    teachingSectionIds: ["limits-and-assumptions"],
  },
  {
    path: "/docs/documentation/mcp",
    teachingSectionIds: [
      "how-to-integrate",
      "serve-modes",
      "factory-session-tools",
    ],
  },
  {
    path: "/docs/documentation/api",
    teachingSectionIds: ["how-to-use"],
  },
];

const FORBIDDEN_FOOTER_HEADINGS = [
  "Related",
  "Related To",
  "References",
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
  forbiddenHeadingHits: string[];
  relatedIdPresent: boolean;
  referencesIdPresent: boolean;
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
        ({ teachingSectionIds, forbiddenHeadings }) => {
          const headings = Array.from(
            document.querySelectorAll("h1, h2, h3, h4, h5, h6"),
          ).map((el) => (el.textContent ?? "").trim());

          const forbiddenHeadingHits = forbiddenHeadings.filter((name) =>
            headings.some((text) =>
              new RegExp(`^\\s*${name}\\s*$`, "i").test(text),
            ),
          );

          return {
            forbiddenHeadingHits,
            relatedIdPresent: Boolean(document.getElementById("related")),
            referencesIdPresent: Boolean(document.getElementById("references")),
            teachingSectionIdsPresent: teachingSectionIds.filter((id) =>
              Boolean(document.getElementById(id)),
            ),
          };
        },
        {
          teachingSectionIds: [...route.teachingSectionIds],
          forbiddenHeadings: [...FORBIDDEN_FOOTER_HEADINGS],
        },
      );

      const result: PageProbeResult = { path: route.path, ...probe };
      routeResults.push(result);

      if (probe.forbiddenHeadingHits.length > 0) {
        failures.push(
          `${route.path}: Related/References footer headings still present: ${probe.forbiddenHeadingHits.join(", ")}`,
        );
      }
      if (probe.relatedIdPresent) {
        failures.push(`${route.path}: #related footer section still present`);
      }
      if (probe.referencesIdPresent) {
        failures.push(
          `${route.path}: #references footer section still present`,
        );
      }
      if (probe.teachingSectionIdsPresent.length === 0) {
        failures.push(
          `${route.path}: expected teaching section among [${route.teachingSectionIds.join(", ")}]`,
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
        forbiddenFooterHeadings: FORBIDDEN_FOOTER_HEADINGS,
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
