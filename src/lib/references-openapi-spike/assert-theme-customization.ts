/**
 * Child-process HTML probe for W01 theme / customization wiring.
 *
 * Starts an isolated Next dev server, fetches `/references-openapi-spike`, and
 * asserts theme root + operation-layout + schema-slot + code-block markers are
 * present while dual shiki theme CSS variables remain in the HTML. Run with
 * plain `bun` (not `bun test`) so happy-dom is not registered.
 *
 * Spike SSR can take ~8–11s; curl timeout is 60s.
 */

import { type ChildProcess, spawn } from "node:child_process";
import {
  SPIKE_CODE_BLOCK_ATTR,
  SPIKE_HEADING_SLOT_ATTR,
  SPIKE_OPERATION_LAYOUT_ATTR,
  SPIKE_SCHEMA_SLOT_ATTR,
  SPIKE_THEME_ROOT_ATTR,
} from "./theme-customization";

const PORT = Number(process.env.OPENAPI_SPIKE_PROBE_PORT ?? "3465");
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
      if (response.ok || response.status === 500) {
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
  const themeRoots = countMatches(
    html,
    new RegExp(`${SPIKE_THEME_ROOT_ATTR}(?:=""|=''|(?=[s>]))`, "g"),
  );
  const operationLayouts = countMatches(
    html,
    new RegExp(`${SPIKE_OPERATION_LAYOUT_ATTR}(?:=""|=''|(?=[s>]))`, "g"),
  );
  const headingSlots = countMatches(
    html,
    new RegExp(`${SPIKE_HEADING_SLOT_ATTR}(?:=""|=''|(?=[s>]))`, "g"),
  );
  const schemaSlots = countMatches(
    html,
    new RegExp(`${SPIKE_SCHEMA_SLOT_ATTR}=`, "g"),
  );
  const codeBlocks = countMatches(
    html,
    new RegExp(`${SPIKE_CODE_BLOCK_ATTR}(?:=""|=''|(?=[s>]))`, "g"),
  );
  const docsCodeBlocks = countMatches(html, /docs-code-block/g);
  const operationSections = countMatches(html, /data-openapi-operation-id="/g);
  // Dual shiki themes emit light/dark CSS variable pairs when defaultColor:false.
  const shikiLightVars = countMatches(html, /--shiki-light/g);
  const shikiDarkVars = countMatches(html, /--shiki-dark/g);
  // Host factory-dark markers on the document.
  const factoryDarkPalette = html.includes('data-color-palette="factory-dark"');
  const htmlDarkClass = /<html[^>]*\bclass="[^"]*\bdark\b/.test(html);

  return {
    themeRoots,
    operationLayouts,
    headingSlots,
    schemaSlots,
    codeBlocks,
    docsCodeBlocks,
    operationSections,
    shikiLightVars,
    shikiDarkVars,
    factoryDarkPalette,
    htmlDarkClass,
  };
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
      NODE_ENV: "development",
    },
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });

  const baseUrl = `http://127.0.0.1:${PORT}`;
  await waitForReady(baseUrl, READY_TIMEOUT_MS);

  await fetchSpikeHtml(`${baseUrl}${SPIKE_PATH}`).catch(() => undefined);
  const html = await fetchSpikeHtml(`${baseUrl}${SPIKE_PATH}`);
  const metrics = analyzeHtml(html);

  if (metrics.themeRoots < 1) {
    throw new Error(`Expected theme root marker, got ${metrics.themeRoots}`);
  }
  if (metrics.operationLayouts !== 45) {
    throw new Error(
      `Expected 45 operation layouts, got ${metrics.operationLayouts}`,
    );
  }
  if (metrics.headingSlots !== 45) {
    throw new Error(`Expected 45 heading slots, got ${metrics.headingSlots}`);
  }
  if (metrics.schemaSlots < 80) {
    throw new Error(
      `Expected schema slots (>=80 request+response), got ${metrics.schemaSlots}`,
    );
  }
  if (metrics.operationSections !== 45) {
    throw new Error(
      `Expected 45 operation sections, got ${metrics.operationSections}`,
    );
  }
  if (metrics.codeBlocks < 40 && metrics.docsCodeBlocks < 40) {
    throw new Error(
      `Expected code-block markers (>=40 via ${SPIKE_CODE_BLOCK_ATTR} or docs-code-block), got codeBlocks=${metrics.codeBlocks} docsCodeBlocks=${metrics.docsCodeBlocks}`,
    );
  }
  if (metrics.shikiLightVars < 10 || metrics.shikiDarkVars < 10) {
    throw new Error(
      `Expected dual shiki theme CSS vars (light>=10, dark>=10), got light=${metrics.shikiLightVars} dark=${metrics.shikiDarkVars}`,
    );
  }
  if (!metrics.factoryDarkPalette || !metrics.htmlDarkClass) {
    throw new Error(
      `Expected factory-dark host (palette=${metrics.factoryDarkPalette}, dark=${metrics.htmlDarkClass})`,
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
  await Bun.sleep(500);
}
