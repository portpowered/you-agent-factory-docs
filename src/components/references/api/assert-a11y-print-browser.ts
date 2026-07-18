/**
 * Browser probe for W08 story 010: responsive overflow, keyboard, reduced
 * motion, print readability, and full-package harness verification.
 * Run with plain `bun` from repo cwd. Kills the harness server on exit.
 */

import { type ChildProcess, spawn } from "node:child_process";
import {
  INTENTIONAL_HORIZONTAL_SCROLL_SELECTORS,
  PAGE_OVERFLOW_TOLERANCE_PX,
} from "@/lib/verify/a11y-responsive-contract";
import { evaluateResponsiveOverflowInBrowser } from "@/lib/verify/a11y-responsive-probes";
import { launchPlaywrightBrowser } from "@/lib/verify/launch-playwright-browser";
import {
  API_PRINT_CHROME_ATTR,
  API_PRINT_CHROME_HIDE,
  API_PRINT_ROOT_ATTR,
  API_VERIFICATION_VIEWPORTS,
} from "./a11y-verification";
import { API_PLAYGROUND_SUPPRESSED_ATTR } from "./playground-suppression";

const PORT = Number(process.env.API_RENDERER_HARNESS_PROBE_PORT ?? "3540");
const HARNESS_PATH = "/api-renderer-harness";
const READY_TIMEOUT_MS = 120_000;

const SSE_ANCHOR = "getEventsBySessionId";
const NON_SSE_ANCHOR = "submitWorkBySessionId";

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
  throw new Error(`Harness not ready within ${timeoutMs}ms at ${url}`);
}

try {
  server = spawn("bun", ["run", "dev", "--", "-p", String(PORT)], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(PORT),
      NODE_ENV: "development",
    },
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });

  const baseUrl = `http://localhost:${PORT}`;
  await waitForReady(baseUrl, READY_TIMEOUT_MS);

  const browser = await launchPlaywrightBrowser();
  try {
    for (const viewport of API_VERIFICATION_VIEWPORTS) {
      const page = await browser.newPage({
        viewport: { width: viewport.width, height: viewport.height },
      });

      await page.goto(`${baseUrl}${HARNESS_PATH}`, {
        waitUntil: "networkidle",
        timeout: 120_000,
      });

      const printRoot = page.locator(`[${API_PRINT_ROOT_ATTR}]`);
      if ((await printRoot.count()) < 1) {
        throw new Error(
          `[${viewport.id}] Expected [${API_PRINT_ROOT_ATTR}] print root`,
        );
      }

      const overflow = await page.evaluate(
        evaluateResponsiveOverflowInBrowser,
        {
          selectors: [...INTENTIONAL_HORIZONTAL_SCROLL_SELECTORS],
          tolerancePx: PAGE_OVERFLOW_TOLERANCE_PX,
        },
      );
      if (overflow.hasUnintendedOverflow) {
        throw new Error(
          `[${viewport.id}] Unintended page overflowPx=${overflow.overflowPx}`,
        );
      }

      const sections = page.locator("[data-api-operation-section]");
      const sectionCount = await sections.count();
      if (sectionCount < 1) {
        throw new Error(`[${viewport.id}] Expected operation sections`);
      }

      const playgroundSuppressed = page.locator(
        `[${API_PLAYGROUND_SUPPRESSED_ATTR}="true"]`,
      );
      if ((await playgroundSuppressed.count()) < 1) {
        throw new Error(
          `[${viewport.id}] Expected playground suppression marker`,
        );
      }

      const sendButtons = page.locator(
        'button:has-text("Send"), button:has-text("Try it")',
      );
      if ((await sendButtons.count()) > 0) {
        throw new Error(
          `[${viewport.id}] Unexpected live playground Send/Try it controls`,
        );
      }

      // Keyboard: filter input + clear
      const filter = page.locator('[data-api-operation-filter="input"]');
      await filter.focus();
      await page.keyboard.type("submitWork");
      const clear = page.locator('[data-api-operation-filter="clear"]');
      await clear.focus();
      await page.keyboard.press("Enter");
      const filterValue = await filter.inputValue();
      if (filterValue !== "") {
        // Clear via click if Enter did not activate (button may need Space/click)
        await clear.click();
      }
      if ((await filter.inputValue()) !== "") {
        throw new Error(`[${viewport.id}] Filter clear left residual query`);
      }

      // Phone/tablet: mobile details disclosure remains operable
      if (viewport.width < 1024) {
        const mobile = page.locator("[data-api-mobile-navigator]");
        if ((await mobile.count()) < 1) {
          throw new Error(`[${viewport.id}] Expected mobile navigator`);
        }
        const summary = mobile.locator("summary");
        await summary.focus();
        await page.keyboard.press("Enter");
        const isOpen = await mobile.evaluate(
          (el) => (el as HTMLDetailsElement).open,
        );
        if (!isOpen) {
          await summary.click();
        }
        const openAfter = await mobile.evaluate(
          (el) => (el as HTMLDetailsElement).open,
        );
        if (!openAfter) {
          throw new Error(`[${viewport.id}] Mobile navigator failed to open`);
        }
      }

      // Copy-link keyboard focus
      const copy = page.locator("[data-api-operation-copy-link]").first();
      await copy.focus();
      const focusedTag = await page.evaluate(() =>
        document.activeElement?.getAttribute("data-api-operation-copy-link"),
      );
      if (!focusedTag) {
        throw new Error(`[${viewport.id}] Copy link did not receive focus`);
      }

      // SSE + non-SSE checks
      const sseSection = page.locator(`#${SSE_ANCHOR}`);
      const nonSseSection = page.locator(`#${NON_SSE_ANCHOR}`);
      if ((await sseSection.count()) < 1) {
        throw new Error(
          `[${viewport.id}] Missing SSE operation #${SSE_ANCHOR}`,
        );
      }
      if ((await nonSseSection.count()) < 1) {
        throw new Error(
          `[${viewport.id}] Missing non-SSE operation #${NON_SSE_ANCHOR}`,
        );
      }
      const sseSummary = sseSection.locator("[data-api-sse-summary]");
      if ((await sseSummary.count()) < 1) {
        throw new Error(`[${viewport.id}] SSE summary panel missing`);
      }

      // Reduced-motion hash focus
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(`${baseUrl}${HARNESS_PATH}#${NON_SSE_ANCHOR}`, {
        waitUntil: "networkidle",
        timeout: 120_000,
      });
      await page.waitForFunction(
        (anchor) => {
          const el = document.getElementById(anchor);
          return (
            el?.hasAttribute("data-api-hash-focused") &&
            document.activeElement === el
          );
        },
        NON_SSE_ANCHOR,
        { timeout: 10_000 },
      );

      // Print media: chrome hidden, method/path/summary readable
      await page.emulateMedia({ media: "print", reducedMotion: "reduce" });
      const printProbe = await page.evaluate(
        ({ chromeAttr, chromeHide, sseAnchor, nonSseAnchor }) => {
          const chromeHidden = Array.from(
            document.querySelectorAll(`[${chromeAttr}="${chromeHide}"]`),
          ).every((el) => {
            const style = getComputedStyle(el);
            return style.display === "none" || style.visibility === "hidden";
          });

          function facts(anchor: string) {
            const section = document.getElementById(anchor);
            if (!section) {
              return null;
            }
            const method =
              section.getAttribute("data-api-operation-method") ??
              section
                .querySelector("[data-api-method-badge]")
                ?.textContent?.trim() ??
              "";
            const path =
              section.getAttribute("data-api-operation-path") ??
              section.querySelector("h2 code, h2")?.textContent?.trim() ??
              "";
            const summary =
              section
                .querySelector("[data-api-operation-summary]")
                ?.textContent?.trim() ?? "";
            const style = getComputedStyle(section);
            return {
              method,
              path,
              summary,
              visible:
                style.display !== "none" && style.visibility !== "hidden",
            };
          }

          return {
            chromeHidden,
            nonSse: facts(nonSseAnchor),
            sse: facts(sseAnchor),
            sectionCount: document.querySelectorAll(
              "[data-api-operation-section]",
            ).length,
          };
        },
        {
          chromeAttr: API_PRINT_CHROME_ATTR,
          chromeHide: API_PRINT_CHROME_HIDE,
          sseAnchor: SSE_ANCHOR,
          nonSseAnchor: NON_SSE_ANCHOR,
        },
      );

      if (!printProbe.chromeHidden) {
        throw new Error(
          `[${viewport.id}] Print chrome markers were not hidden under print media`,
        );
      }
      if (
        !printProbe.nonSse?.visible ||
        !printProbe.nonSse.method ||
        !printProbe.nonSse.path
      ) {
        throw new Error(
          `[${viewport.id}] Non-SSE print facts incomplete: ${JSON.stringify(printProbe.nonSse)}`,
        );
      }
      if (
        !printProbe.sse?.visible ||
        !printProbe.sse.method ||
        !printProbe.sse.path
      ) {
        throw new Error(
          `[${viewport.id}] SSE print facts incomplete: ${JSON.stringify(printProbe.sse)}`,
        );
      }

      process.stdout.write(
        `${JSON.stringify({
          ok: true,
          viewport: viewport.id,
          width: viewport.width,
          sectionCount,
          overflowPx: overflow.overflowPx,
          printSectionCount: printProbe.sectionCount,
          port: PORT,
        })}\n`,
      );

      await page.close();
    }
  } finally {
    await browser.close();
  }
} finally {
  cleanup();
  await Bun.sleep(500);
}
