/**
 * Browser probe for W08 story 007: playground suppression + local-server base URL.
 * Run with plain `bun` from repo cwd. Kills the harness server on exit.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { launchPlaywrightBrowser } from "@/lib/verify/launch-playwright-browser";

const PORT = Number(process.env.API_RENDERER_HARNESS_PROBE_PORT ?? "3537");
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

  // Prefer localhost over 127.0.0.1 for Next 16 Turbopack HMR origins.
  const baseUrl = `http://localhost:${PORT}`;
  await waitForReady(baseUrl, READY_TIMEOUT_MS);

  const browser = await launchPlaywrightBrowser();
  try {
    const results: Record<string, unknown> = {};

    for (const viewport of [
      { name: "desktop", width: 1440, height: 900 },
      { name: "phone", width: 390, height: 844 },
    ] as const) {
      const page = await browser.newPage({
        viewport: { width: viewport.width, height: viewport.height },
      });
      await page.goto(`${baseUrl}${HARNESS_PATH}`, {
        waitUntil: "networkidle",
        timeout: 120_000,
      });

      const probe = await page.evaluate(() => {
        const root = document.querySelector(
          "[data-api-navigation-verification-harness]",
        );
        const notice = document.querySelector(
          "[data-api-local-server-base-url]",
        );
        const urlEl = document.querySelector("[data-api-local-server-url]");
        const disclaimer = document.querySelector(
          "[data-api-local-server-docs-host-disclaimer]",
        );
        const staticNote = document.querySelector(
          "[data-api-static-examples-note]",
        );
        const examples = document.querySelectorAll(
          "[data-api-examples='present']",
        );
        const sendButtons = Array.from(
          document.querySelectorAll("button, [role='button']"),
        ).filter((el) => /^\s*Send\s*$/i.test(el.textContent ?? ""));
        const tryIt = Array.from(
          document.querySelectorAll("button, [role='button'], a"),
        ).filter((el) => /try\s*it/i.test(el.textContent ?? ""));
        const authPanels = document.querySelectorAll(
          '[data-type="authorization"]',
        );
        const passwordInputs = document.querySelectorAll(
          'input[type="password"]',
        );
        const submitButtons = document.querySelectorAll(
          'button[type="submit"]',
        );

        return {
          suppressed: root?.getAttribute("data-api-playground-suppressed"),
          noticeUrl: notice?.getAttribute("data-api-local-server-base-url"),
          urlText: urlEl?.textContent ?? null,
          disclaimer: disclaimer?.textContent ?? null,
          staticNotePresent: Boolean(staticNote),
          exampleCount: examples.length,
          sendButtons: sendButtons.length,
          tryIt: tryIt.length,
          authPanels: authPanels.length,
          passwordInputs: passwordInputs.length,
          submitButtons: submitButtons.length,
          overflowX:
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth + 1,
        };
      });

      if (probe.suppressed !== "true") {
        throw new Error(
          `${viewport.name}: expected data-api-playground-suppressed=true`,
        );
      }
      if (probe.noticeUrl !== "http://localhost:7437") {
        throw new Error(
          `${viewport.name}: expected local server notice url, got ${probe.noticeUrl}`,
        );
      }
      if (probe.urlText !== "http://localhost:7437") {
        throw new Error(
          `${viewport.name}: expected visible base URL text, got ${probe.urlText}`,
        );
      }
      if (
        !probe.disclaimer?.includes("documentation site is not") ||
        !probe.disclaimer.includes("not at this docs host")
      ) {
        throw new Error(
          `${viewport.name}: docs-host disclaimer missing or weak: ${probe.disclaimer}`,
        );
      }
      if (!probe.staticNotePresent) {
        throw new Error(`${viewport.name}: static examples note missing`);
      }
      if (probe.exampleCount < 1) {
        throw new Error(
          `${viewport.name}: expected static examples to remain visible`,
        );
      }
      if (
        probe.sendButtons !== 0 ||
        probe.tryIt !== 0 ||
        probe.authPanels !== 0 ||
        probe.passwordInputs !== 0 ||
        probe.submitButtons !== 0
      ) {
        throw new Error(
          `${viewport.name}: live-execution affordances present: ${JSON.stringify(probe)}`,
        );
      }

      results[viewport.name] = probe;
      await page.close();
    }

    process.stdout.write(
      `${JSON.stringify({ ok: true, port: PORT, results }, null, 2)}\n`,
    );
  } finally {
    await browser.close();
  }
} finally {
  cleanup();
  await Bun.sleep(500);
}
