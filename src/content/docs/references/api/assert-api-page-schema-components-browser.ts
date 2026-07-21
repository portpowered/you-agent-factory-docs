/**
 * Browser probe for Fumadocs Schema UI component objects on
 * `/docs/references/api` (repair-api-fumadocs-openapi-components story 002).
 *
 * Proves a request body `$ref` into `#/components/schemas/*` renders field
 * structure (not only a display-name string) via Fumadocs schema slots.
 * Run with plain `bun` from repo cwd. Kills the local server on exit.
 */

import { type ChildProcess, spawn } from "node:child_process";
import {
  API_SCHEMA_COMPONENT_PROBE,
  API_SCHEMA_SLOT_ATTR,
} from "@/features/references/api";
import { launchPlaywrightBrowser } from "@/lib/verify/launch-playwright-browser";

const PORT = Number(
  process.env.API_REFERENCE_SCHEMA_COMPONENTS_PROBE_PORT ?? "3552",
);
const PAGE_PATH = "/docs/references/api";
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

  const base = `http://127.0.0.1:${PORT}`;
  await waitForReady(base, READY_TIMEOUT_MS);

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

  await page.waitForFunction(
    () => {
      const statuses = Array.from(
        document.querySelectorAll("[data-api-status]"),
      ).map((el) => el.getAttribute("data-api-status"));
      return (
        statuses.includes("ready") ||
        statuses.includes("empty") ||
        (statuses.includes("invalid") && !statuses.includes("loading"))
      );
    },
    { timeout: 120_000 },
  );

  const status = await page.evaluate(() => {
    const statuses = Array.from(
      document.querySelectorAll("[data-api-status]"),
    ).map((el) => el.getAttribute("data-api-status"));
    if (statuses.includes("ready")) return "ready";
    if (statuses.includes("empty")) return "empty";
    if (statuses.includes("invalid")) return "invalid";
    return statuses[0] ?? null;
  });
  if (status !== "ready") {
    throw new Error(`Expected ready API surface, got status=${status}`);
  }

  const { operationId, expectedFieldNames, schemaRef } =
    API_SCHEMA_COMPONENT_PROBE;
  const section = page.locator(
    `[data-api-fumadocs-operation="${operationId}"]`,
  );
  await section.waitFor({ state: "attached", timeout: 60_000 });
  await section.scrollIntoViewIfNeeded();

  // SchemaUI is a lazy client boundary — wait for request schema slot + fields.
  await page.waitForFunction(
    ({ opId, slotAttr, fields }) => {
      const op = document.querySelector(
        `[data-api-fumadocs-operation="${opId}"]`,
      );
      if (!op) return false;
      const requestSlot = op.querySelector(`[${slotAttr}="request"]`);
      if (!requestSlot) return false;
      const text = requestSlot.textContent ?? "";
      return fields.every((field) => text.includes(field));
    },
    {
      opId: operationId,
      slotAttr: API_SCHEMA_SLOT_ATTR,
      fields: [...expectedFieldNames],
    },
    { timeout: 60_000 },
  );

  const evidence = await section.evaluate(
    (el, { slotAttr, fields }) => {
      const requestSlot = el.querySelector(`[${slotAttr}="request"]`);
      const responseSlot = el.querySelector(`[${slotAttr}="response"]`);
      const requestText = requestSlot?.textContent ?? "";
      const objectSearchInputs = requestSlot
        ? requestSlot.querySelectorAll("input[data-object-search-input]").length
        : 0;
      const monoProps = Array.from(
        requestSlot?.querySelectorAll(
          "span.font-medium.font-mono, .font-medium.font-mono",
        ) ?? [],
      )
        .map((node) => (node.textContent ?? "").replace(/[*?]/g, "").trim())
        .filter(Boolean);
      const missingFields = fields.filter(
        (field) => !requestText.includes(field) && !monoProps.includes(field),
      );
      // Nested component types surface in Fumadocs type strings (reachable).
      const hasNestedComponentHint =
        /SubmitWork(Text|Image|Video|Audio|Document)Item/.test(requestText);
      return {
        hasRequestSlot: requestSlot !== null,
        hasResponseSlot: responseSlot !== null,
        hasRequestBodyHeading: /Request Body/i.test(requestText),
        objectSearchInputs,
        monoProps: monoProps.slice(0, 20),
        missingFields,
        hasNestedComponentHint,
        hasFieldDescription: requestText.includes(
          "Required authored name for this single-work submission",
        ),
      };
    },
    {
      slotAttr: API_SCHEMA_SLOT_ATTR,
      fields: [...expectedFieldNames],
    },
  );

  if (!evidence.hasRequestSlot || !evidence.hasResponseSlot) {
    throw new Error(
      `Expected ${API_SCHEMA_SLOT_ATTR} request/response wrappers on ${operationId}`,
    );
  }
  if (!evidence.hasRequestBodyHeading) {
    throw new Error(`Expected Request Body heading under ${operationId}`);
  }
  if (evidence.missingFields.length > 0) {
    throw new Error(
      `Expected Fumadocs Schema UI fields for ${schemaRef}; missing ${evidence.missingFields.join(", ")}`,
    );
  }
  if (evidence.objectSearchInputs < 1) {
    throw new Error(
      "Expected Fumadocs Schema UI object-search input (expandable/readable schema)",
    );
  }
  if (!evidence.hasFieldDescription) {
    throw new Error(
      "Expected schema field description text (not display-name only)",
    );
  }
  if (!evidence.hasNestedComponentHint) {
    throw new Error(
      "Expected nested component object type names reachable via Fumadocs Schema UI",
    );
  }

  await browser.close();

  process.stdout.write(
    `${JSON.stringify({
      ok: true,
      path: PAGE_PATH,
      operationId,
      schemaRef,
      fields: expectedFieldNames,
      objectSearchInputs: evidence.objectSearchInputs,
      nestedComponentHint: evidence.hasNestedComponentHint,
      schemaSlots: { request: true, response: true },
    })}\n`,
  );
  cleanup();
  process.exit(0);
} catch (error) {
  cleanup();
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
}
