/**
 * Browser verify for inventory-first `/docs/references/cli` after intro strip
 * (repair-cli-reference-intro-strip story 003).
 *
 * Proves: no What It Covers / Key Concepts / folded Opening summary; Command
 * Inventory success with package-backed cards; #153 keep-list including
 * under-construction Flags/arguments (no invented option rows).
 *
 * Run with plain `bun` from repo cwd. Kills the local server on exit.
 *
 * Worktree note: Claude worktrees often resolve `next` from a parent
 * `node_modules`. Turbopack rejects that layout, so this probe starts
 * `next dev --webpack`. Prefer `CLI_INTRO_STRIP_PROBE_BASE_URL` when a server
 * is already warm.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { launchPlaywrightBrowser } from "@/lib/verify/launch-playwright-browser";

const PORT = Number(process.env.CLI_INTRO_STRIP_PROBE_PORT ?? "3578");
const PAGE_PATH = "/docs/references/cli";
const READY_TIMEOUT_MS = 180_000;
const PAGE_TIMEOUT_MS = 180_000;
const EXISTING_BASE_URL = process.env.CLI_INTRO_STRIP_PROBE_BASE_URL?.trim();

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

    await page.waitForSelector("[data-cli-command-reference]#you-config-init", {
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
        "[data-cli-command-reference]#you-config-init",
      );
      const cardText = commandCard?.textContent ?? "";

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
        filterPresent: Boolean(
          document.querySelector("[data-reference-inventory-filter]"),
        ),
        cardPresent: Boolean(commandCard),
        cardHasHeading: Boolean(
          commandCard?.querySelector("h3") &&
            /you config init/i.test(
              commandCard?.querySelector("h3")?.textContent ?? "",
            ),
        ),
        cardHasDescription: Boolean(
          commandCard?.querySelector("header p, header [class*='text-sm']") ||
            (commandCard?.querySelector("header")?.textContent ?? "").length >
              "you config init".length + 5,
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
        cardHasUnderConstruction: Boolean(
          commandCard?.querySelector(
            '[data-cli-capability="structured-options-under-construction"]',
          ),
        ),
        cardHasFlagsAndArgumentsLabel: /Flags and arguments/i.test(cardText),
        cardHasInventedOptionRows: Boolean(
          commandCard?.querySelector(
            "[data-cli-flag-row], [data-cli-argument-row], table[data-cli-options]",
          ),
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
    if (!probe.hasCommandInventoryHeading || !probe.commandInventoryIdPresent) {
      failures.push("Command Inventory section missing");
    }
    if (probe.inventoryState !== "success") {
      failures.push(`expected inventory success, got ${probe.inventoryState}`);
    }
    if (probe.commandCount < 5) {
      failures.push(
        `expected package-backed command count >= 5, got ${probe.commandCount}`,
      );
    }
    if (!probe.filterPresent) {
      failures.push("expected inventory filter chrome");
    }
    if (!probe.cardPresent) {
      failures.push("representative you config init card missing");
    }
    if (!probe.cardHasHeading) {
      failures.push("command card missing header");
    }
    if (!probe.cardHasDescription) {
      failures.push("command card missing description keep-list content");
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
    if (
      !probe.cardHasUnderConstruction ||
      !probe.cardHasFlagsAndArgumentsLabel
    ) {
      failures.push(
        "expected under-construction Flags/arguments keep-list notice",
      );
    }
    if (probe.cardHasInventedOptionRows) {
      failures.push("invented flag/option rows must not appear");
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
