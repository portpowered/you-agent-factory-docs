/**
 * Browser verify for Factory schema authored full configuration JSON example
 * (repair-factory-schema-click-splay-example story 004).
 *
 * Proves the page-local `exampleInputs` override is visible and copyable on
 * `/docs/references/factory-schema` with hermetic `workTypes` / `workers` /
 * `workstations` keys. Run with plain `bun` from repo cwd. Kills the local
 * server on exit.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { launchPlaywrightBrowser } from "@/lib/verify/launch-playwright-browser";
import { FACTORY_SCHEMA_FULL_CONFIG_EXAMPLE_ID } from "./factory-schema-full-config-example";

const PORT = Number(
  process.env.FACTORY_SCHEMA_FULL_CONFIG_PROBE_PORT ?? "3584",
);
const PAGE_PATH = "/docs/references/factory-schema";
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

  await page.waitForSelector(
    '[data-testid="factory-schema-reference"][data-schema-status="ready"]',
    { timeout: 120_000 },
  );
  await page.waitForSelector(
    `[data-schema-example-id="${FACTORY_SCHEMA_FULL_CONFIG_EXAMPLE_ID}"]`,
    { timeout: 30_000 },
  );

  const whatItCovers = await page.locator("#what-it-covers").count();
  if (whatItCovers > 0) {
    throw new Error("Leftover #what-it-covers chrome still present");
  }

  const exampleState = await page.evaluate((exampleId) => {
    const surface = document.querySelector(
      '[data-testid="factory-schema-reference"]',
    );
    if (!(surface instanceof HTMLElement)) {
      return { ok: false as const, error: "factory-schema-reference missing" };
    }

    const examples = surface.querySelector(
      '[data-testid="schema-definition-examples"][data-schema-examples="present"]',
    );
    if (!(examples instanceof HTMLElement)) {
      return { ok: false as const, error: "schema examples panel missing" };
    }

    const example = examples.querySelector(
      `[data-schema-example-id="${exampleId}"]`,
    );
    if (!(example instanceof HTMLElement)) {
      return { ok: false as const, error: `example ${exampleId} missing` };
    }
    if (example.getAttribute("data-schema-example-origin") !== "authored") {
      return {
        ok: false as const,
        error: `expected authored origin, got ${example.getAttribute("data-schema-example-origin")}`,
      };
    }

    const code = examples.querySelector(
      `[data-testid="schema-example-code-${exampleId}"]`,
    );
    const codeText = code?.textContent ?? "";
    for (const key of ['"workTypes"', '"workers"', '"workstations"'] as const) {
      if (!codeText.includes(key)) {
        return {
          ok: false as const,
          error: `example code missing ${key}`,
        };
      }
    }

    const copy = examples.querySelector('[data-schema-example="copy"]');
    if (!(copy instanceof HTMLElement)) {
      return { ok: false as const, error: "copy control missing" };
    }

    return {
      ok: true as const,
      exampleId,
      origin: example.getAttribute("data-schema-example-origin"),
      hasWorkTypes: codeText.includes('"workTypes"'),
      hasWorkers: codeText.includes('"workers"'),
      hasWorkstations: codeText.includes('"workstations"'),
    };
  }, FACTORY_SCHEMA_FULL_CONFIG_EXAMPLE_ID);

  if (!exampleState.ok) {
    throw new Error(
      `Factory schema full config example failed: ${exampleState.error}`,
    );
  }

  console.log(
    JSON.stringify(
      {
        page: PAGE_PATH,
        exampleId: exampleState.exampleId,
        origin: exampleState.origin,
        hasWorkTypes: exampleState.hasWorkTypes,
        hasWorkers: exampleState.hasWorkers,
        hasWorkstations: exampleState.hasWorkstations,
        ok: true,
      },
      null,
      2,
    ),
  );

  await browser.close();
  cleanup();
  process.exit(0);
} catch (error) {
  console.error(error);
  cleanup();
  process.exit(1);
}
