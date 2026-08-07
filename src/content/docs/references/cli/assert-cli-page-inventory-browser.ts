/**
 * Browser verify for the grouped, contract-backed `/docs/references/cli`.
 *
 * Proves in a real browser: no What It Covers / Key Concepts / folded opening
 * summary and no restated section preamble; inventory success with commands
 * grouped under family headings; published flags and arguments rendered as
 * tables; inherited globals pointed at rather than repeated; and a right-rail
 * table of contents that actually links to the command anchors.
 *
 * Run with plain `bun` from repo cwd. Kills the local server on exit.
 *
 * Worktree note: Claude worktrees often resolve `next` from a parent
 * `node_modules`. Turbopack rejects that layout, so this probe starts
 * `next dev --webpack`. Prefer `CLI_INVENTORY_PROBE_BASE_URL` when a server
 * is already warm.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { launchPlaywrightBrowser } from "@/lib/verify/launch-playwright-browser";

const PORT = Number(process.env.CLI_INVENTORY_PROBE_PORT ?? "3578");
const PAGE_PATH = "/docs/references/cli";
const READY_TIMEOUT_MS = 180_000;
const PAGE_TIMEOUT_MS = 180_000;
const EXISTING_BASE_URL = process.env.CLI_INVENTORY_PROBE_BASE_URL?.trim();

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

async function warmCliPage(baseUrl: string): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < PAGE_TIMEOUT_MS) {
    try {
      const response = await fetch(`${baseUrl}${PAGE_PATH}`, {
        signal: AbortSignal.timeout(120_000),
      });
      if (response.ok) {
        const html = await response.text();
        if (
          html.includes("data-cli-command-inventory") &&
          html.includes('data-inventory-state="success"')
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
    `CLI page did not warm with inventory success markers within ${PAGE_TIMEOUT_MS}ms`,
  );
}

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

  await warmCliPage(baseUrl);

  const browser = await launchPlaywrightBrowser();
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    await page.goto(`${baseUrl}${PAGE_PATH}`, {
      waitUntil: "domcontentloaded",
      timeout: PAGE_TIMEOUT_MS,
    });

    await page.waitForFunction(
      () => {
        const root = document.querySelector("[data-cli-command-inventory]");
        return root?.getAttribute("data-inventory-state") === "success";
      },
      { timeout: PAGE_TIMEOUT_MS },
    );

    await page.waitForSelector("[data-cli-command-reference]#you-run", {
      timeout: 60_000,
    });

    const probe = await page.evaluate(() => {
      const headingText = (name: string) => {
        const headings = Array.from(
          document.querySelectorAll("h1, h2, h3, h4, h5, h6"),
        );
        return headings.some((el) =>
          new RegExp(`^\\s*${name}\\s*$`, "i").test(el.textContent ?? ""),
        );
      };

      const inventory = document.querySelector("[data-cli-command-inventory]");
      const commandCard = document.querySelector(
        "[data-cli-command-reference]#you-run",
      );
      const toc = document.querySelector("#nd-toc");
      const tocHrefs = Array.from(
        toc?.querySelectorAll("a[href^='#']") ?? [],
      ).map((link) => link.getAttribute("href") ?? "");

      return {
        hasWhatItCoversHeading: headingText("What It Covers"),
        hasKeyConceptsHeading: headingText("Key Concepts"),
        hasCommandInventoryHeading: headingText("Command Inventory"),
        whatItCoversIdPresent: Boolean(
          document.getElementById("what-it-covers"),
        ),
        keyConceptsIdPresent: Boolean(document.getElementById("key-concepts")),
        commandInventoryIdPresent: Boolean(
          document.getElementById("command-inventory"),
        ),
        verbosePreamblePresent: /Scan the published CLI commands/i.test(
          document.body.textContent ?? "",
        ),
        foldedSummaryPresent: Boolean(
          document.querySelector('[data-testid="folded-summary"]'),
        ),
        openingSummaryPresent: Boolean(
          document.querySelector('[data-opening-summary="folded"]'),
        ),
        inventoryState: inventory?.getAttribute("data-inventory-state") ?? null,
        commandCount: Number(
          inventory?.getAttribute("data-cli-command-count") ?? "0",
        ),
        groupPaths: Array.from(
          document.querySelectorAll("[data-cli-command-group]"),
        ).map((group) => group.getAttribute("data-cli-command-group") ?? ""),
        filterPresent: Boolean(
          document.querySelector("[data-reference-inventory-filter]"),
        ),
        cardPresent: Boolean(commandCard),
        cardHasHeading: /you run/i.test(
          commandCard?.querySelector("h3")?.textContent ?? "",
        ),
        cardDescriptionRepeated: (() => {
          const summary =
            commandCard?.querySelector("header p")?.textContent?.trim() ?? "";
          if (summary.length === 0) return false;
          const body = commandCard?.textContent ?? "";
          return body.split(summary).length - 1 > 1;
        })(),
        cardHasFlagsTable: Boolean(
          commandCard?.querySelector("[data-cli-flags] table"),
        ),
        cardHasArgumentsTable: Boolean(
          commandCard?.querySelector("[data-cli-arguments] table"),
        ),
        cardHasNamedFlagRow: Boolean(
          commandCard?.querySelector('[data-cli-flag="named"]'),
        ),
        cardRepeatsInheritedGlobals: Boolean(
          commandCard?.querySelector('[data-cli-flag="json"]'),
        ),
        cardHasInheritedNote: Boolean(
          commandCard?.querySelector("[data-cli-inherited-flags]"),
        ),
        cardHasCopyableAnchor: Boolean(
          commandCard?.querySelector("[data-reference-copyable-anchor]"),
        ),
        cardHasExample: Boolean(
          commandCard?.querySelector("[data-cli-example-code]"),
        ),
        cardHasContractSourceBadge: Boolean(
          commandCard?.querySelector("[data-contract-source-badge]"),
        ),
        underConstructionPresent: Boolean(
          document.querySelector(
            '[data-cli-capability="structured-options-under-construction"]',
          ),
        ),
        tocPresent: Boolean(toc),
        tocCommandLinks: tocHrefs.filter((href) => href === "#you-run").length,
        tocGroupLinks: tocHrefs.filter((href) => href.startsWith("#commands-"))
          .length,
        tocLinkCount: tocHrefs.length,
        tocDanglingLinks: tocHrefs.filter(
          (href) => href.length > 1 && !document.getElementById(href.slice(1)),
        ),
      };
    });

    const failures: string[] = [];
    if (probe.hasWhatItCoversHeading || probe.whatItCoversIdPresent) {
      failures.push("What It Covers intro still present");
    }
    if (probe.hasKeyConceptsHeading || probe.keyConceptsIdPresent) {
      failures.push("Key Concepts intro still present");
    }
    if (probe.foldedSummaryPresent || probe.openingSummaryPresent) {
      failures.push("folded Opening summary chrome still present");
    }
    if (probe.hasCommandInventoryHeading || probe.commandInventoryIdPresent) {
      failures.push("retired Command Inventory section heading still present");
    }
    if (probe.verbosePreamblePresent) {
      failures.push("retired inventory preamble prose still present");
    }
    if (probe.inventoryState !== "success") {
      failures.push(`expected inventory success, got ${probe.inventoryState}`);
    }
    if (probe.commandCount < 5) {
      failures.push(
        `expected package-backed command count >= 5, got ${probe.commandCount}`,
      );
    }
    if (!probe.groupPaths.includes("you factory")) {
      failures.push(
        `expected a "you factory" family group, got ${probe.groupPaths.join(", ")}`,
      );
    }
    if (!probe.filterPresent) {
      failures.push("expected inventory filter chrome");
    }
    if (!probe.cardPresent) {
      failures.push("representative you run card missing");
    }
    if (!probe.cardHasHeading) {
      failures.push("command card missing header");
    }
    if (probe.cardDescriptionRepeated) {
      failures.push("command card prints its description more than once");
    }
    if (!probe.cardHasFlagsTable || !probe.cardHasNamedFlagRow) {
      failures.push("expected published flags table on you run");
    }
    if (!probe.cardHasArgumentsTable) {
      failures.push("expected published arguments table on you run");
    }
    if (probe.cardRepeatsInheritedGlobals || !probe.cardHasInheritedNote) {
      failures.push(
        "expected inherited globals summarised in one note, not repeated as rows",
      );
    }
    if (!probe.cardHasCopyableAnchor) {
      failures.push("command card missing copyable anchor");
    }
    if (!probe.cardHasExample) {
      failures.push("command card missing example keep-list content");
    }
    if (probe.cardHasContractSourceBadge) {
      failures.push("command card still shows contract-source badge chrome");
    }
    if (probe.underConstructionPresent) {
      failures.push("retired under-construction flags notice still present");
    }
    if (!probe.tocPresent || probe.tocCommandLinks < 1) {
      failures.push("right-rail TOC missing per-command links");
    }
    if (probe.tocGroupLinks < 2) {
      failures.push(
        `expected family group links in the TOC, got ${probe.tocGroupLinks}`,
      );
    }
    if (probe.tocDanglingLinks.length > 0) {
      failures.push(
        `TOC links resolve to no heading: ${probe.tocDanglingLinks.join(", ")}`,
      );
    }

    if (failures.length > 0) {
      console.error(JSON.stringify({ failures, probe }, null, 2));
      cleanup();
      process.exit(1);
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          baseUrl,
          port: EXISTING_BASE_URL ? null : PORT,
          probe,
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
  }

  cleanup();
  process.exit(0);
} catch (error) {
  console.error(error);
  cleanup();
  process.exit(1);
}
