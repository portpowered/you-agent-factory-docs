/**
 * Browser verify for MCP reference route + display rename on
 * `/docs/references/mcp-reference`: visible title reads MCP Reference, URL
 * path is `/docs/references/mcp-reference`, inventory content loads, the legacy
 * product title is not live H1/title chrome, and the old inventory path
 * `/docs/references/mcp` is not silently serving this page.
 *
 * Run with plain `bun` from repo cwd. Kills the local server on exit.
 * Prefer `MCP_REFERENCE_RENAME_PROBE_BASE_URL` when a server is already warm.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { launchPlaywrightBrowser } from "@/lib/verify/launch-playwright-browser";

const PORT = Number(process.env.MCP_REFERENCE_RENAME_PROBE_PORT ?? "3588");
const PAGE_PATH = "/docs/references/mcp-reference";
const OLD_PAGE_PATH = "/docs/references/mcp";
const DISPLAY_TITLE = "MCP Reference";
const LEGACY_TITLE = "You Agent Factory MCP";
const READY_TIMEOUT_MS = 180_000;
const EXISTING_BASE_URL =
  process.env.MCP_REFERENCE_RENAME_PROBE_BASE_URL?.trim();

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
  let base = EXISTING_BASE_URL;
  if (!base) {
    // Worktrees often hoist node_modules at the parent checkout. Turbopack
    // rejects that layout; webpack resolves ancestor node_modules and can serve
    // the renamed page for browser verify.
    server = spawn(
      "bun",
      ["run", "dev", "--", "--webpack", "-p", String(PORT)],
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
    base = `http://127.0.0.1:${PORT}`;
    await waitForReady(`${base}${PAGE_PATH}`, READY_TIMEOUT_MS);
  }

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

  await page.waitForSelector("[data-mcp-tool-inventory]", {
    timeout: 120_000,
  });
  await page.waitForFunction(
    () => {
      const root = document.querySelector("[data-mcp-tool-inventory]");
      return root?.getAttribute("data-inventory-state") === "success";
    },
    { timeout: 120_000 },
  );

  const probe = await page.evaluate(
    ({ displayTitle, legacyTitle }) => {
      const h1 = document.querySelector("h1")?.textContent?.trim() ?? "";
      const documentTitle = document.title.trim();
      const pathname = window.location.pathname;
      const bodyText = document.body.textContent ?? "";
      const inventory = document.querySelector("[data-mcp-tool-inventory]");
      const sidebarLink = Array.from(document.querySelectorAll("a[href]")).find(
        (anchor) => {
          const href = anchor.getAttribute("href") ?? "";
          return (
            href === "/docs/references/mcp-reference" ||
            href.endsWith("/docs/references/mcp-reference")
          );
        },
      );

      return {
        h1,
        documentTitle,
        pathname,
        inventoryState: inventory?.getAttribute("data-inventory-state") ?? null,
        hasHowToInstall: Boolean(document.getElementById("how-to-install")),
        sidebarLabel: (sidebarLink?.textContent ?? "").trim(),
        legacyInH1: h1 === legacyTitle || h1.includes(legacyTitle),
        legacyAsDocumentTitle: documentTitle === legacyTitle,
        displayInH1: h1 === displayTitle || h1.includes(displayTitle),
        displayInDocumentTitle: documentTitle.includes(displayTitle),
        bodyMentionsYouMcpServe: /you mcp serve/i.test(bodyText),
      };
    },
    { displayTitle: DISPLAY_TITLE, legacyTitle: LEGACY_TITLE },
  );

  const failures: string[] = [];
  const requireTrue = (ok: boolean, label: string) => {
    if (!ok) failures.push(label);
  };

  requireTrue(
    probe.pathname === PAGE_PATH || probe.pathname.endsWith(PAGE_PATH),
    `URL path remains ${PAGE_PATH} (got ${probe.pathname})`,
  );
  requireTrue(probe.displayInH1, `visible H1 reads ${DISPLAY_TITLE}`);
  requireTrue(
    probe.displayInDocumentTitle,
    `document title includes ${DISPLAY_TITLE}`,
  );
  requireTrue(!probe.legacyInH1, `H1 is not ${LEGACY_TITLE}`);
  requireTrue(
    !probe.legacyAsDocumentTitle,
    `document title is not exactly ${LEGACY_TITLE}`,
  );
  requireTrue(probe.inventoryState === "success", "inventory state success");
  requireTrue(probe.hasHowToInstall, "#how-to-install present");
  requireTrue(probe.bodyMentionsYouMcpServe, "page mentions you mcp serve");
  if (probe.sidebarLabel.length > 0) {
    requireTrue(
      probe.sidebarLabel === DISPLAY_TITLE ||
        probe.sidebarLabel.includes(DISPLAY_TITLE),
      `explorer/nav label shows ${DISPLAY_TITLE}`,
    );
    requireTrue(
      probe.sidebarLabel !== LEGACY_TITLE,
      `explorer/nav label is not ${LEGACY_TITLE}`,
    );
  }

  // Old inventory slug must not silently 200 as this page (no forever
  // compatibility page / dual-slug under static export or next serve).
  const oldResponse = await page.goto(`${base}${OLD_PAGE_PATH}`, {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });
  const oldStatus = oldResponse?.status() ?? 0;
  const oldFinalUrl = page.url();
  const oldRedirectedToNew =
    oldFinalUrl.includes(PAGE_PATH) ||
    Boolean(oldResponse?.headers()?.location?.includes(PAGE_PATH));
  const oldInventoryStillLive = await page.evaluate(() => {
    const inventory = document.querySelector("[data-mcp-tool-inventory]");
    return inventory?.getAttribute("data-inventory-state") === "success";
  });
  requireTrue(
    oldStatus === 404 || (oldStatus >= 400 && !oldRedirectedToNew),
    `old inventory slug not published/redirected (status=${oldStatus}, url=${oldFinalUrl})`,
  );
  requireTrue(
    !oldRedirectedToNew,
    "old /docs/references/mcp does not redirect to /docs/references/mcp-reference",
  );
  requireTrue(
    !oldInventoryStillLive,
    "old /docs/references/mcp is not serving the MCP inventory page",
  );

  await browser.close();

  if (failures.length > 0) {
    console.error("MCP reference route rename browser verify failed:");
    for (const failure of failures) {
      console.error(`  - ${failure}`);
    }
    console.error(
      JSON.stringify(
        {
          probe,
          oldStatus,
          oldFinalUrl,
          oldRedirectedToNew,
          oldInventoryStillLive,
        },
        null,
        2,
      ),
    );
    process.exit(1);
  }

  console.log("PASS: mcp reference route rename browser verify");
  console.log(
    JSON.stringify(
      {
        pathname: probe.pathname,
        h1: probe.h1,
        documentTitle: probe.documentTitle,
        sidebarLabel: probe.sidebarLabel,
        inventoryState: probe.inventoryState,
        oldStatus,
        oldFinalUrl,
        oldInventoryStillLive,
      },
      null,
      2,
    ),
  );
} finally {
  cleanup();
}
