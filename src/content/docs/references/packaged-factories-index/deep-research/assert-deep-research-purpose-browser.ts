/**
 * Browser verify for `/docs/references/packaged-factories-index/deep-research`
 * after publishing the minimal nested purpose page (story 001).
 *
 * Proves: nested route resolves; Purpose heading and purpose body are visible;
 * no teaching-chrome headings; no replay/visualizer markers.
 *
 * Run with plain `bun` from repo cwd. Kills the local server on exit.
 *
 * Worktree note: Claude worktrees often resolve `next` from a parent
 * `node_modules`. Turbopack rejects that layout, so this probe starts
 * `next dev --webpack`. Prefer `DEEP_RESEARCH_PAGE_PROBE_BASE_URL` when a
 * server is already warm.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { launchPlaywrightBrowser } from "@/lib/verify/launch-playwright-browser";

const PORT = Number(process.env.DEEP_RESEARCH_PAGE_PROBE_PORT ?? "3611");
const PAGE_PATH = "/docs/references/packaged-factories-index/deep-research";
const READY_TIMEOUT_MS = 180_000;
const PAGE_TIMEOUT_MS = 180_000;
const EXISTING_BASE_URL = process.env.DEEP_RESEARCH_PAGE_PROBE_BASE_URL?.trim();

const PURPOSE_SNIPPET =
  "@you/deep-research investigates a research topic with a lead research pass";

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

async function warmPage(baseUrl: string): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < PAGE_TIMEOUT_MS) {
    try {
      const response = await fetch(`${baseUrl}${PAGE_PATH}`, {
        signal: AbortSignal.timeout(10_000),
      });
      if (response.ok) {
        const html = await response.text();
        if (html.includes("Purpose") && html.includes(PURPOSE_SNIPPET)) {
          return;
        }
      }
    } catch {
      // still compiling
    }
    await Bun.sleep(1_000);
  }
  throw new Error(`Page not ready within ${PAGE_TIMEOUT_MS}ms at ${PAGE_PATH}`);
}

async function main() {
  const baseUrl = EXISTING_BASE_URL || `http://127.0.0.1:${PORT}`;

  if (!EXISTING_BASE_URL) {
    server = spawn(
      "bun",
      [
        "./scripts/run-next.ts",
        "dev",
        "--webpack",
        "-p",
        String(PORT),
        "-H",
        "127.0.0.1",
      ],
      {
        cwd: process.cwd(),
        stdio: ["ignore", "pipe", "pipe"],
        detached: true,
        env: {
          ...process.env,
          PORT: String(PORT),
        },
      },
    );

    await waitForReady(baseUrl, READY_TIMEOUT_MS);
  }

  await warmPage(baseUrl);

  const browser = await launchPlaywrightBrowser();
  try {
    const page = await browser.newPage();
    await page.goto(`${baseUrl}${PAGE_PATH}`, {
      waitUntil: "domcontentloaded",
      timeout: PAGE_TIMEOUT_MS,
    });

    const purposeHeading = page.getByRole("heading", { name: "Purpose" });
    await purposeHeading.waitFor({ state: "visible", timeout: 30_000 });

    const purposeText = page.getByText(PURPOSE_SNIPPET, { exact: false });
    await purposeText.waitFor({ state: "visible", timeout: 30_000 });

    const forbiddenHeadings = [
      "What It Covers",
      "Key Concepts",
      "How To Use",
      "Limits And Assumptions",
      "Related To",
      "References",
    ];
    for (const name of forbiddenHeadings) {
      const count = await page.getByRole("heading", { name }).count();
      if (count !== 0) {
        throw new Error(`Unexpected heading present: ${name}`);
      }
    }

    const replayCount = await page.locator("[data-factory-replay]").count();
    const visualizerCount = await page
      .locator("[data-factory-visualizer]")
      .count();
    if (replayCount !== 0 || visualizerCount !== 0) {
      throw new Error(
        "Unexpected replay/visualizer markers on deep-research page",
      );
    }

    console.log("deep-research nested purpose page browser verify: ok");
  } finally {
    await browser.close();
  }
}

main()
  .then(() => {
    cleanup();
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error(error);
    cleanup();
    process.exit(1);
  });
