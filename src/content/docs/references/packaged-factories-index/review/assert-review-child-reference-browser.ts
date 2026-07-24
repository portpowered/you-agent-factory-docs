/**
 * Browser verify for /docs/references/packaged-factories-index/review concise
 * reference content plus full-mode replay mount markers. Uses webpack in
 * worktrees where Turbopack cannot resolve the hoisted Next package.
 *
 * Run with plain `bun` from repo cwd. Kills the local server on exit.
 */

import { type ChildProcess, spawn } from "node:child_process";

const PORT = Number(process.env.REVIEW_CHILD_REFERENCE_PROBE_PORT ?? "3523");
const PAGE_PATH = "/docs/references/packaged-factories-index/review";
const READY_TIMEOUT_MS = 180_000;

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
  // Worktrees often hoist node_modules at the parent checkout. Turbopack
  // rejects that layout; webpack resolves ancestor node_modules and can serve
  // the page for browser verify.
  server = spawn("bun", ["run", "dev", "--", "--webpack", "-p", String(PORT)], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(PORT),
      NODE_ENV: "development",
    },
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });

  const base = `http://127.0.0.1:${PORT}`;
  await waitForReady(`${base}${PAGE_PATH}`, READY_TIMEOUT_MS);

  const response = await fetch(`${base}${PAGE_PATH}`, {
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`Expected 200 for ${PAGE_PATH}, got ${response.status}`);
  }

  const html = await response.text();
  const normalized = html
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&amp;", "&");

  const required = [
    "@you/review",
    'you run --named @you/review "Draft the release notes"',
    'echo "Draft the release notes" | you run --named @you/review',
    'you run --named @you/review "Review draft release notes."',
    "/docs/references/packaged-factories-index#review",
    "Invocation examples",
    "Operational notes",
    "Complete definition",
    "Deterministic replay",
    'data-factory-replay-mode="full"',
    "Factory replay",
    "Timeline scrubber",
    "Factory topology",
    "Work progress",
  ];

  for (const marker of required) {
    if (!normalized.includes(marker)) {
      const previewIdx = normalized.indexOf("you run");
      const preview =
        previewIdx >= 0
          ? normalized.slice(previewIdx, previewIdx + 200)
          : normalized.slice(0, 400);
      throw new Error(
        `Missing required page marker: ${marker}\nPreview: ${preview}`,
      );
    }
  }

  if (normalized.includes('"id": "builtin-review"')) {
    throw new Error("Child page must not embed unabridged factory.json");
  }

  if (normalized.includes("fusion.factory-recording.v1.json")) {
    throw new Error(
      "Review child page HTML must not reference the fusion recording",
    );
  }

  console.log(
    "PASS: packaged-factories-index/review child reference browser verify",
  );
} catch (error) {
  console.error("Review child reference browser verify failed:");
  console.error(error);
  process.exitCode = 1;
} finally {
  cleanup();
}
