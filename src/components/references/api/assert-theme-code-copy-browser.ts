/**
 * Browser probe for W08 story 009: theme tokens + CodePanel code-copy on the
 * API harness. Run with plain `bun` from repo cwd. Kills the harness server
 * on exit.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { launchPlaywrightBrowser } from "@/lib/verify/launch-playwright-browser";
import { API_THEME_ROOT_ATTR } from "./theme-tokens";

const PORT = Number(process.env.API_RENDERER_HARNESS_PROBE_PORT ?? "3539");
const HARNESS_PATH = "/api-renderer-harness";
const READY_TIMEOUT_MS = 120_000;

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
    for (const viewport of [
      { width: 1440, height: 900, label: "desktop" },
      { width: 390, height: 844, label: "phone" },
    ] as const) {
      const page = await browser.newPage({
        viewport: { width: viewport.width, height: viewport.height },
      });

      await page.goto(`${baseUrl}${HARNESS_PATH}`, {
        waitUntil: "networkidle",
        timeout: 120_000,
      });

      const themeRoot = page.locator(`[${API_THEME_ROOT_ATTR}]`);
      if ((await themeRoot.count()) < 1) {
        throw new Error(
          `[${viewport.label}] Expected [${API_THEME_ROOT_ATTR}] theme root`,
        );
      }

      const methodBadges = page.locator("[data-api-method-badge]");
      const badgeCount = await methodBadges.count();
      if (badgeCount < 1) {
        throw new Error(`[${viewport.label}] Expected method badges`);
      }

      const firstBadgeText = await methodBadges.first().textContent();
      if (!firstBadgeText || firstBadgeText.trim().length < 2) {
        throw new Error(
          `[${viewport.label}] Method badge missing accessible text`,
        );
      }

      const codePanels = page.locator("[data-api-code-panel]");
      const codeCount = await codePanels.count();
      if (codeCount < 1) {
        throw new Error(
          `[${viewport.label}] Expected CodePanel markers (data-api-code-panel)`,
        );
      }

      const copyButtons = page.locator(
        'button[data-api-example="copy"][aria-label="Copy example"]',
      );
      if ((await copyButtons.count()) < 1) {
        throw new Error(`[${viewport.label}] Expected example copy controls`);
      }

      await page.evaluate(() => {
        const writes: string[] = [];
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: {
            writeText: async (text: string) => {
              writes.push(text);
            },
          },
        });
        (
          window as unknown as { __apiThemeCopyWrites?: string[] }
        ).__apiThemeCopyWrites = writes;
      });

      await copyButtons.first().click();
      await page.waitForFunction(() => {
        const writes = (
          window as unknown as { __apiThemeCopyWrites?: string[] }
        ).__apiThemeCopyWrites;
        return (writes?.length ?? 0) > 0;
      });

      const copied = await page.evaluate(() => {
        const writes = (
          window as unknown as { __apiThemeCopyWrites?: string[] }
        ).__apiThemeCopyWrites;
        return writes?.[0] ?? "";
      });
      if (copied.trim().length < 1) {
        throw new Error(
          `[${viewport.label}] Copy example wrote empty clipboard text`,
        );
      }

      const sendButtons = page.locator(
        'button:has-text("Send"), button:has-text("Try it")',
      );
      if ((await sendButtons.count()) > 0) {
        throw new Error(
          `[${viewport.label}] Unexpected live playground Send/Try it controls`,
        );
      }

      // Probe computed styles use semantic CSS vars (not page-only hex locks).
      const badgeColor = await methodBadges.first().evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          color: style.color,
          backgroundColor: style.backgroundColor,
          borderColor: style.borderColor,
        };
      });
      if (!badgeColor.color || badgeColor.color === "rgba(0, 0, 0, 0)") {
        throw new Error(
          `[${viewport.label}] Method badge color unresolved: ${JSON.stringify(badgeColor)}`,
        );
      }

      process.stdout.write(
        `${JSON.stringify({
          ok: true,
          viewport: viewport.label,
          badgeCount,
          codePanelCount: codeCount,
          copiedBytes: copied.length,
          badgeColor,
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
