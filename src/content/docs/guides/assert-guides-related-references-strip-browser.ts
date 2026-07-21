/**
 * Browser verify for guides collection PF-L-strip (Related / References footer).
 *
 * Proves Getting Started and one other representative guide render teaching
 * content without trailing Related / References / RelatedDocs footer chrome,
 * while install / teaching section markers and common-pitfalls teaching links
 * remain visible.
 *
 * Run with plain `bun` from repo cwd. Kills the local server on exit.
 *
 * Worktree note: Claude worktrees often resolve `next` from a parent
 * `node_modules`. Turbopack rejects that layout, so this probe starts
 * `next dev --webpack`. Prefer `GUIDES_RELATED_STRIP_PROBE_BASE_URL` when a
 * server is already warm.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { launchPlaywrightBrowser } from "@/lib/verify/launch-playwright-browser";

const PORT = Number(process.env.GUIDES_RELATED_STRIP_PROBE_PORT ?? "3571");
const READY_TIMEOUT_MS = 180_000;
const PAGE_TIMEOUT_MS = 180_000;
const EXISTING_BASE_URL =
  process.env.GUIDES_RELATED_STRIP_PROBE_BASE_URL?.trim();

type RouteProbe = {
  path: string;
  warmNeedle: string;
  requiredHeadingNames: readonly string[];
  requiredSectionIds: readonly string[];
  teachingLink?: { href: string; namePattern: string };
};

const ROUTES: readonly RouteProbe[] = [
  {
    path: "/docs/guides/getting-started",
    warmNeedle: 'id="install"',
    requiredHeadingNames: ["Install", "First You", "First Submit"],
    requiredSectionIds: [
      "install",
      "first-you",
      "first-submit",
      "common-pitfalls",
    ],
    teachingLink: {
      href: "/docs/documentation/cli",
      namePattern: "CLI",
    },
  },
  {
    path: "/docs/guides/write-review-loops",
    warmNeedle: 'id="steps-or-workflow"',
    requiredHeadingNames: ["Steps Or Workflow", "Common Pitfalls"],
    requiredSectionIds: ["steps-or-workflow", "common-pitfalls"],
    teachingLink: {
      href: "/docs/techniques/writer-reviewer",
      namePattern: "Writer-reviewer",
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

async function warmRoute(
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

type PageProbeResult = {
  path: string;
  hasRelatedToHeading: boolean;
  hasRelatedHeading: boolean;
  hasReferencesHeading: boolean;
  relatedIdPresent: boolean;
  referencesIdPresent: boolean;
  curatedRelatedDocsPresent: boolean;
  derivedRelatedDocsPresent: boolean;
  requiredHeadingsPresent: string[];
  requiredSectionIdsPresent: string[];
  teachingLinkHref: string | null;
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
    await warmRoute(baseUrl, route.path, route.warmNeedle);
  }

  const browser = await launchPlaywrightBrowser();
  const routeResults: PageProbeResult[] = [];
  const failures: string[] = [];

  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });

    for (const route of ROUTES) {
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
      await page.waitForSelector(`#${route.requiredSectionIds[0]}`, {
        timeout: 60_000,
      });

      const probe = await page.evaluate(
        ({ requiredHeadingNames, requiredSectionIds, teachingLink }) => {
          const headingText = (name: string) => {
            const headings = Array.from(
              document.querySelectorAll("h1, h2, h3, h4, h5, h6"),
            );
            return headings.some((el) =>
              new RegExp(`^\\s*${name}\\s*$`, "i").test(el.textContent ?? ""),
            );
          };

          const requiredHeadingsPresent = requiredHeadingNames.filter((name) =>
            headingText(name),
          );
          const requiredSectionIdsPresent = requiredSectionIds.filter((id) =>
            Boolean(document.getElementById(id)),
          );

          let teachingLinkHref: string | null = null;
          if (teachingLink) {
            const links = Array.from(
              document.querySelectorAll<HTMLAnchorElement>("a[href]"),
            );
            const nameRe = new RegExp(teachingLink.namePattern, "i");
            const match = links.find(
              (a) =>
                a.getAttribute("href") === teachingLink.href &&
                nameRe.test(a.textContent ?? ""),
            );
            teachingLinkHref = match?.getAttribute("href") ?? null;
          }

          return {
            hasRelatedToHeading: headingText("Related To"),
            hasRelatedHeading: headingText("Related"),
            hasReferencesHeading: headingText("References"),
            relatedIdPresent: Boolean(document.getElementById("related")),
            referencesIdPresent: Boolean(document.getElementById("references")),
            curatedRelatedDocsPresent: Boolean(
              document.querySelector('[data-testid="curated-related-docs"]'),
            ),
            derivedRelatedDocsPresent: Boolean(
              document.querySelector('[data-testid="derived-related-docs"]'),
            ),
            requiredHeadingsPresent,
            requiredSectionIdsPresent,
            teachingLinkHref,
          };
        },
        {
          requiredHeadingNames: [...route.requiredHeadingNames],
          requiredSectionIds: [...route.requiredSectionIds],
          teachingLink: route.teachingLink
            ? { ...route.teachingLink }
            : undefined,
        },
      );

      const result: PageProbeResult = { path: route.path, ...probe };
      routeResults.push(result);

      if (
        probe.hasRelatedToHeading ||
        probe.hasRelatedHeading ||
        probe.relatedIdPresent ||
        probe.curatedRelatedDocsPresent ||
        probe.derivedRelatedDocsPresent
      ) {
        failures.push(
          `${route.path}: Related / RelatedDocs footer chrome still present`,
        );
      }
      if (probe.hasReferencesHeading || probe.referencesIdPresent) {
        failures.push(`${route.path}: References footer chrome still present`);
      }
      if (
        probe.requiredHeadingsPresent.length !==
        route.requiredHeadingNames.length
      ) {
        failures.push(
          `${route.path}: missing teaching headings among [${route.requiredHeadingNames.join(", ")}] (found: ${probe.requiredHeadingsPresent.join(", ") || "none"})`,
        );
      }
      if (
        probe.requiredSectionIdsPresent.length !==
        route.requiredSectionIds.length
      ) {
        failures.push(
          `${route.path}: missing teaching sections among [${route.requiredSectionIds.join(", ")}] (found: ${probe.requiredSectionIdsPresent.join(", ") || "none"})`,
        );
      }
      if (
        route.teachingLink &&
        probe.teachingLinkHref !== route.teachingLink.href
      ) {
        failures.push(
          `${route.path}: expected teaching link ${route.teachingLink.href} (pattern /${route.teachingLink.namePattern}/i)`,
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
