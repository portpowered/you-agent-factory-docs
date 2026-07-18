/**
 * Child-process HTML probe for W01 playground suppression.
 *
 * Starts an isolated Next dev server, fetches `/references-openapi-spike`, and
 * asserts interactive playground controls are absent while static examples
 * remain. Run with plain `bun` (not `bun test`) so happy-dom is not registered.
 *
 * Spike SSR can take ~8–11s; curl timeout is 60s.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { SPIKE_PLAYGROUND_OPTIONS } from "./playground-suppression";

const PORT = Number(process.env.OPENAPI_SPIKE_PROBE_PORT ?? "3464");
const SPIKE_PATH = "/references-openapi-spike";
const READY_TIMEOUT_MS = 120_000;
const CURL_MAX_TIME_S = 60;

function countMatches(html: string, pattern: RegExp): number {
  return [...html.matchAll(pattern)].length;
}

async function waitForReady(url: string, timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(5_000),
      });
      // 200 once the route compiles; 404 would mean production gate misfired.
      if (response.ok || response.status === 500) {
        // Allow first compile; subsequent fetch gets full HTML.
        return;
      }
    } catch {
      // Server not ready yet.
    }
    await Bun.sleep(1_000);
  }
  throw new Error(
    `Spike probe server not ready within ${timeoutMs}ms at ${url}`,
  );
}

async function fetchSpikeHtml(url: string): Promise<string> {
  // Prefer curl for long SSR: Next may stream slowly on first compile.
  const result = Bun.spawnSync({
    cmd: [
      "curl",
      "--fail",
      "--silent",
      "--show-error",
      "--max-time",
      String(CURL_MAX_TIME_S),
      url,
    ],
    cwd: process.cwd(),
    stdout: "pipe",
    stderr: "pipe",
  });
  if (result.exitCode !== 0) {
    throw new Error(
      `curl failed (${result.exitCode}): ${result.stderr.toString()}`,
    );
  }
  return result.stdout.toString();
}

function analyzeHtml(html: string) {
  // Fumadocs playground Send button text (i18n default) when enabled.
  const playgroundSendButtons = countMatches(
    html,
    /type="submit"[^>]*>\s*Send\s*</g,
  );
  // Playground auth collapsible panels only appear when playground is mounted.
  const playgroundAuthPanels = countMatches(html, /data-type="authorization"/g);
  const preBlocks = countMatches(html, /<pre\b/gi);
  const operationSections = countMatches(html, /data-openapi-operation-id="/g);

  return {
    playgroundSendButtons,
    playgroundAuthPanels,
    preBlocks,
    operationSections,
  };
}

if (!SPIKE_PLAYGROUND_OPTIONS.enabled) {
  // Config gate already known; HTML proves the createAPIPage wiring.
}

let server: ChildProcess | undefined;
const cleanup = () => {
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
};
process.on("exit", cleanup);
process.on("SIGINT", () => {
  cleanup();
  process.exit(1);
});
process.on("SIGTERM", () => {
  cleanup();
  process.exit(1);
});

try {
  server = spawn("bun", ["run", "dev", "--", "-p", String(PORT)], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(PORT),
      // Ensure spike is reachable even if NODE_ENV is production in some shells.
      NODE_ENV: "development",
    },
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });

  const baseUrl = `http://127.0.0.1:${PORT}`;
  await waitForReady(baseUrl, READY_TIMEOUT_MS);

  // First request warms the route compile; second is the measured HTML sample.
  await fetchSpikeHtml(`${baseUrl}${SPIKE_PATH}`).catch(() => undefined);
  const html = await fetchSpikeHtml(`${baseUrl}${SPIKE_PATH}`);
  const metrics = analyzeHtml(html);

  if (metrics.playgroundSendButtons !== 0) {
    throw new Error(
      `Expected 0 playground Send buttons, got ${metrics.playgroundSendButtons}`,
    );
  }
  if (metrics.playgroundAuthPanels !== 0) {
    throw new Error(
      `Expected 0 playground authorization panels, got ${metrics.playgroundAuthPanels}`,
    );
  }
  if (metrics.preBlocks < 40) {
    throw new Error(
      `Expected static example <pre> blocks to remain (>=40), got ${metrics.preBlocks}`,
    );
  }
  if (metrics.operationSections !== 45) {
    throw new Error(
      `Expected 45 operation sections, got ${metrics.operationSections}`,
    );
  }

  process.stdout.write(
    `${JSON.stringify({
      ok: true,
      ...metrics,
      htmlBytes: html.length,
      port: PORT,
    })}\n`,
  );
} finally {
  cleanup();
  // Give the process group a moment to exit before the parent returns.
  await Bun.sleep(500);
}
