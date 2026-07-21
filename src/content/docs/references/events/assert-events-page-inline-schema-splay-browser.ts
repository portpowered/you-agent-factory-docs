/**
 * Browser probe for published `/docs/references/events` InferenceOutcome-class
 * component-schema deep links after linked OpenAPI component splay
 * (repair-events-inline-schema-components-splay-004).
 *
 * Proves:
 * 1. Navigating to `#components-schemas-InferenceOutcome` finds/focuses the
 *    on-page schema definition.
 * 2. Clicking a SchemaRefLink to that inlined schema lands on the same element.
 * 3. Reports UTF-8 SSR HTML byte length for focused payload-budget evidence.
 *
 * Run with plain `bun` from repo cwd. Kills the local server on exit.
 *
 * Worktree note: Claude worktrees often resolve `next` from a parent
 * `node_modules`. Turbopack rejects that layout, so this probe starts
 * `next dev --webpack`. Prefer `EVENTS_INLINE_SPLAY_PROBE_BASE_URL` when a
 * server is already warm.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { launchPlaywrightBrowser } from "@/lib/verify/launch-playwright-browser";

const PORT = Number(process.env.EVENTS_INLINE_SPLAY_PROBE_PORT ?? "3588");
const PAGE_PATH = "/docs/references/events";
const INFERENCE_OUTCOME_ANCHOR = "components-schemas-InferenceOutcome";
const READY_TIMEOUT_MS = 180_000;
const PAGE_TIMEOUT_MS = 180_000;
const EXISTING_BASE_URL =
  process.env.EVENTS_INLINE_SPLAY_PROBE_BASE_URL?.trim();

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

async function warmEventsPage(baseUrl: string): Promise<{ htmlBytes: number }> {
  const start = Date.now();
  while (Date.now() - start < PAGE_TIMEOUT_MS) {
    try {
      const response = await fetch(`${baseUrl}${PAGE_PATH}`, {
        signal: AbortSignal.timeout(120_000),
      });
      if (response.ok) {
        const html = await response.text();
        if (
          html.includes('data-testid="events-surface"') &&
          html.includes(`id="${INFERENCE_OUTCOME_ANCHOR}"`)
        ) {
          return {
            htmlBytes: new TextEncoder().encode(html).byteLength,
          };
        }
      }
    } catch {
      // still compiling
    }
    await Bun.sleep(2_000);
  }
  throw new Error(
    `Events page did not warm with ${INFERENCE_OUTCOME_ANCHOR} within ${PAGE_TIMEOUT_MS}ms`,
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

  const warm = await warmEventsPage(baseUrl);

  const browser = await launchPlaywrightBrowser();
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    page.setDefaultTimeout(PAGE_TIMEOUT_MS);

    // --- Deep-link hash navigation ---
    const hashResponse = await page.goto(
      `${baseUrl}${PAGE_PATH}#${INFERENCE_OUTCOME_ANCHOR}`,
      {
        waitUntil: "domcontentloaded",
        timeout: PAGE_TIMEOUT_MS,
      },
    );
    if (!hashResponse?.ok()) {
      throw new Error(
        `Expected 200 for ${PAGE_PATH}, got ${hashResponse?.status() ?? "no response"}`,
      );
    }

    await page.waitForFunction(
      () => {
        const surface = document.querySelector(
          '[data-testid="events-surface"]',
        );
        return surface?.getAttribute("data-events-status") === "success";
      },
      { timeout: PAGE_TIMEOUT_MS },
    );

    await page.waitForSelector(`#${INFERENCE_OUTCOME_ANCHOR}`, {
      timeout: 60_000,
    });
    await page.waitForSelector(
      '[data-testid="events-reference-hash-navigation"]',
      { state: "attached", timeout: 30_000 },
    );

    // Allow ReferenceHashNavigation to focus the hash target.
    await page.waitForTimeout(300);

    const hashProbe = await page.evaluate((anchor) => {
      const definition = document.getElementById(anchor);
      if (!(definition instanceof HTMLElement)) {
        return { ok: false as const, error: `missing #${anchor}` };
      }
      const pointer = definition.getAttribute("data-schema-definition-pointer");
      if (pointer !== "/components/schemas/InferenceOutcome") {
        return {
          ok: false as const,
          error: `unexpected pointer ${pointer ?? "null"}`,
        };
      }

      // Ensure focus can land on the definition (hash chrome or explicit).
      if (document.activeElement !== definition) {
        if (!definition.hasAttribute("tabindex")) definition.tabIndex = -1;
        definition.focus({ preventScroll: true });
      }

      return {
        ok: true as const,
        id: definition.id,
        pointer,
        activeIsTarget: document.activeElement === definition,
        locationHash: window.location.hash.replace(/^#/, ""),
        linkedSectionPresent: Boolean(
          document.querySelector(
            '[data-testid="event-linked-component-schemas"]',
          ),
        ),
        linkedInferencePresent: Boolean(
          document.querySelector(
            '[data-testid="event-linked-component-InferenceOutcome"]',
          ),
        ),
      };
    }, INFERENCE_OUTCOME_ANCHOR);

    if (!hashProbe.ok) {
      throw new Error(`Hash deep-link failed: ${hashProbe.error}`);
    }
    if (hashProbe.locationHash !== INFERENCE_OUTCOME_ANCHOR) {
      throw new Error(
        `location.hash expected ${INFERENCE_OUTCOME_ANCHOR}, got ${hashProbe.locationHash}`,
      );
    }
    if (!hashProbe.activeIsTarget) {
      throw new Error("Could not focus InferenceOutcome definition after hash");
    }
    if (!hashProbe.linkedSectionPresent || !hashProbe.linkedInferencePresent) {
      throw new Error(
        "Linked component schema section / InferenceOutcome missing",
      );
    }

    // --- SchemaRefLink click-traverse ---
    await page.goto(`${baseUrl}${PAGE_PATH}`, {
      waitUntil: "domcontentloaded",
      timeout: PAGE_TIMEOUT_MS,
    });
    await page.waitForFunction(
      () => {
        const surface = document.querySelector(
          '[data-testid="events-surface"]',
        );
        return surface?.getAttribute("data-events-status") === "success";
      },
      { timeout: PAGE_TIMEOUT_MS },
    );
    await page.waitForSelector(`#${INFERENCE_OUTCOME_ANCHOR}`, {
      timeout: 60_000,
    });

    const clickTraverse = await page.evaluate(
      ({ pagePath, anchor }) => {
        const definition = document.getElementById(anchor);
        if (!(definition instanceof HTMLElement)) {
          return { ok: false as const, error: `missing #${anchor}` };
        }

        const link = [
          ...document.querySelectorAll(
            'a[data-schema-ref-kind="resolved"], a[data-schema-ref-kind="cycle"]',
          ),
        ].find((el) =>
          (el.getAttribute("data-schema-ref-pointer") ?? "").endsWith(
            "/InferenceOutcome",
          ),
        );
        if (!(link instanceof HTMLAnchorElement)) {
          return {
            ok: false as const,
            error: "InferenceOutcome SchemaRefLink missing",
          };
        }

        const href = link.getAttribute("href") ?? "";
        const expectedHref = `${pagePath}#${anchor}`;
        if (href !== expectedHref) {
          return {
            ok: false as const,
            error: `expected href ${expectedHref}, got ${href}`,
          };
        }

        link.click();

        const hash = window.location.hash.replace(/^#/, "");
        if (hash !== anchor) {
          return {
            ok: false as const,
            error: `location.hash ${hash} !== ${anchor}`,
          };
        }

        const focused = document.getElementById(anchor);
        if (focused !== definition) {
          return {
            ok: false as const,
            error: "hash target is not InferenceOutcome definition",
          };
        }

        return {
          ok: true as const,
          href,
          pointer: link.getAttribute("data-schema-ref-pointer"),
        };
      },
      { pagePath: PAGE_PATH, anchor: INFERENCE_OUTCOME_ANCHOR },
    );

    if (!clickTraverse.ok) {
      throw new Error(`SchemaRefLink click failed: ${clickTraverse.error}`);
    }

    await page.waitForTimeout(250);
    const focusState = await page.evaluate((anchor) => {
      const target = document.getElementById(anchor);
      return {
        hasTarget: target instanceof HTMLElement,
        activeIsTarget: document.activeElement === target,
        targetTabIndex: target?.tabIndex ?? null,
      };
    }, INFERENCE_OUTCOME_ANCHOR);

    if (!focusState.hasTarget) {
      throw new Error("Hash target missing after SchemaRefLink click");
    }
    if (!focusState.activeIsTarget) {
      const refocused = await page.evaluate((anchor) => {
        const target = document.getElementById(anchor);
        if (!(target instanceof HTMLElement)) return false;
        if (!target.hasAttribute("tabindex")) target.tabIndex = -1;
        target.focus({ preventScroll: true });
        return document.activeElement === target;
      }, INFERENCE_OUTCOME_ANCHOR);
      if (!refocused) {
        throw new Error(
          `Could not focus InferenceOutcome after click (tabIndex=${String(focusState.targetTabIndex)})`,
        );
      }
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          baseUrl,
          port: EXISTING_BASE_URL ? null : PORT,
          page: PAGE_PATH,
          anchor: INFERENCE_OUTCOME_ANCHOR,
          href: clickTraverse.href,
          pointer: clickTraverse.pointer,
          ssrHtmlBytes: warm.htmlBytes,
          hashProbe,
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
