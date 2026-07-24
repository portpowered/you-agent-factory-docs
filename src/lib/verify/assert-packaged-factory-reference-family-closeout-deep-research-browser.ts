/**
 * Closeout story 002 browser verify — tip evidence that
 * `/docs/references/packaged-factories-index/deep-research` stays purpose +
 * one usage example + JavaScript Runtime / Dynamic Workflows links, with no
 * replay / visualizer / raw-source expansion surfaces.
 *
 * Reuses the Batch 4 deep-research purpose probe contract on a unique port.
 * Prefer `CLOSEOUT_DEEP_RESEARCH_PROBE_BASE_URL` (or
 * `DEEP_RESEARCH_PAGE_PROBE_BASE_URL`) when a server is already warm.
 *
 * Run with plain `bun` from repo cwd. Kills the local server on exit.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { launchPlaywrightBrowser } from "@/lib/verify/launch-playwright-browser";
import {
  PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_FORBIDDEN_SELECTORS,
  PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_REQUIRED_HREFS,
} from "./packaged-factory-reference-family-closeout-deep-research";

const PORT = Number(
  process.env.CLOSEOUT_DEEP_RESEARCH_PROBE_PORT ??
    process.env.DEEP_RESEARCH_PAGE_PROBE_PORT ??
    "3622",
);
const PAGE_PATH = "/docs/references/packaged-factories-index/deep-research";
const READY_TIMEOUT_MS = 180_000;
const PAGE_TIMEOUT_MS = 180_000;
const EXISTING_BASE_URL =
  process.env.CLOSEOUT_DEEP_RESEARCH_PROBE_BASE_URL?.trim() ||
  process.env.DEEP_RESEARCH_PAGE_PROBE_BASE_URL?.trim();

const PURPOSE_SNIPPET =
  "@you/deep-research investigates a research topic with a lead research pass";
const USAGE_EXAMPLE =
  'you run --named @you/deep-research "Compare event sourcing and state machines for workflow orchestration"';

const FORBIDDEN_BODY_PATTERNS = [
  /event history|timeline scrubber|playback|recording sample/i,
  /\bAST\b|abstract syntax|call graph/i,
  /\bstages\b|\bworkers\b/i,
  /"id":\s*"builtin-deep-research"|invocationSignature|scripts\/deep-research\.workflow\.js/i,
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

async function warmPage(baseUrl: string): Promise<void> {
  const url = `${baseUrl}${PAGE_PATH}`;
  const start = Date.now();
  while (Date.now() - start < PAGE_TIMEOUT_MS) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10_000),
      });
      if (response.ok) return;
    } catch {
      // compiling
    }
    await Bun.sleep(1_000);
  }
  throw new Error(`Page not ready within ${PAGE_TIMEOUT_MS}ms at ${url}`);
}

async function main(): Promise<void> {
  const baseUrl = EXISTING_BASE_URL || `http://127.0.0.1:${PORT}`;

  if (!EXISTING_BASE_URL) {
    server = spawn(
      "bun",
      ["./scripts/run-next.ts", "dev", "--webpack", "-p", String(PORT)],
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
    page.setDefaultTimeout(PAGE_TIMEOUT_MS);
    await page.goto(`${baseUrl}${PAGE_PATH}`, {
      waitUntil: "domcontentloaded",
      timeout: PAGE_TIMEOUT_MS,
    });

    const pageRoot = page.locator("#nd-page");
    await pageRoot.waitFor({ state: "visible", timeout: PAGE_TIMEOUT_MS });

    await pageRoot.getByRole("heading", { name: "Purpose" }).waitFor({
      state: "visible",
      timeout: 30_000,
    });
    const purposeText = await pageRoot.innerText();
    if (!purposeText.includes(PURPOSE_SNIPPET)) {
      throw new Error(
        `Expected purpose snippet on deep-research page; missing ${PURPOSE_SNIPPET}`,
      );
    }

    await pageRoot.getByRole("heading", { name: "Usage" }).waitFor({
      state: "visible",
      timeout: 30_000,
    });
    const usageVisible = await pageRoot
      .getByText(USAGE_EXAMPLE)
      .isVisible()
      .catch(() => false);
    if (!usageVisible) {
      throw new Error(`Expected usage example ${USAGE_EXAMPLE}`);
    }

    const javascriptRuntimeLink = pageRoot.getByRole("link", {
      name: "JavaScript Runtime",
    });
    const dynamicWorkflowsLink = pageRoot.getByRole("link", {
      name: "Dynamic Workflows",
    });
    await javascriptRuntimeLink.waitFor({ state: "visible", timeout: 30_000 });
    await dynamicWorkflowsLink.waitFor({ state: "visible", timeout: 30_000 });

    const javascriptRuntimeHref =
      await javascriptRuntimeLink.getAttribute("href");
    const dynamicWorkflowsHref =
      await dynamicWorkflowsLink.getAttribute("href");
    if (
      javascriptRuntimeHref !==
      PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_REQUIRED_HREFS.javascriptRuntime
    ) {
      throw new Error(
        `Expected JavaScript Runtime href ${PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_REQUIRED_HREFS.javascriptRuntime}, got ${javascriptRuntimeHref}`,
      );
    }
    if (
      dynamicWorkflowsHref !==
      PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_REQUIRED_HREFS.dynamicWorkflows
    ) {
      throw new Error(
        `Expected Dynamic Workflows href ${PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_REQUIRED_HREFS.dynamicWorkflows}, got ${dynamicWorkflowsHref}`,
      );
    }

    await javascriptRuntimeLink.focus();

    for (const selector of PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_FORBIDDEN_SELECTORS) {
      const count = await pageRoot.locator(selector).count();
      if (count > 0) {
        throw new Error(
          `Forbidden expansion surface ${selector} present on deep-research child (${count}).`,
        );
      }
    }

    const bodyText = await pageRoot.innerText();
    for (const pattern of FORBIDDEN_BODY_PATTERNS) {
      if (pattern.test(bodyText)) {
        throw new Error(
          `Forbidden expansion phrase ${pattern} matched on deep-research child body.`,
        );
      }
    }

    const playPause = await pageRoot
      .getByRole("button", { name: /play|pause/i })
      .count();
    if (playPause > 0) {
      throw new Error(
        "Deep-research child must not mount Play/Pause controls.",
      );
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          pagePath: PAGE_PATH,
          baseUrl,
          purposeVisible: true,
          usageExampleVisible: true,
          javascriptRuntimeHref,
          dynamicWorkflowsHref,
          forbiddenSelectorHits: 0,
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  cleanup();
  process.exit(1);
});
