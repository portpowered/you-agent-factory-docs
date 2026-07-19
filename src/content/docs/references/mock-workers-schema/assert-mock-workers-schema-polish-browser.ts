/**
 * Browser verify for polished `/docs/references/mock-workers-schema`:
 * no What It Covers / Key Concepts intro, nested mockWorkers /
 * unmatchedDispatchPolicy splay + on-page $defs, and copyable
 * hermetic-looking configuration examples.
 * (repair-mock-workers-examples-splay story 005).
 *
 * Run with plain `bun` from repo cwd. Kills the local server on exit.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { launchPlaywrightBrowser } from "@/lib/verify/launch-playwright-browser";

const PORT = Number(
  process.env.MOCK_WORKERS_SCHEMA_POLISH_PROBE_PORT ?? "3581",
);
const PAGE_PATH = "/docs/references/mock-workers-schema";
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
  // the polished page for browser verify.
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
    '[data-testid="mock-workers-schema-reference"][data-schema-status="ready"]',
    { timeout: 120_000 },
  );

  const polish = await page.evaluate(() => {
    const surface = document.querySelector(
      '[data-testid="mock-workers-schema-reference"]',
    );
    const headingNames = Array.from(
      document.querySelectorAll("h1, h2, h3, h4"),
    ).map((el) => (el.textContent ?? "").trim());
    const hasHeading = (name: string) => headingNames.includes(name);

    const examples = surface?.querySelector('[data-schema-examples="present"]');
    const acceptExample = examples?.querySelector(
      '[data-schema-example-id="mock-workers-schema.minimal-accept"]',
    );
    const rejectExample = examples?.querySelector(
      '[data-schema-example-id="mock-workers-schema.reject-with-policy"]',
    );
    const copyControl = examples?.querySelector('[data-schema-example="copy"]');

    return {
      schemaStatus: surface?.getAttribute("data-schema-status") ?? null,
      hasWhatItCoversHeading: hasHeading("What It Covers"),
      hasKeyConceptsHeading: hasHeading("Key Concepts"),
      hasHowToUseHeading: hasHeading("How To Use"),
      hasSchemaLookupHeading: hasHeading("Schema Lookup"),
      hasWhatItCoversSection: Boolean(
        document.getElementById("what-it-covers"),
      ),
      hasKeyConceptsSection: Boolean(document.getElementById("key-concepts")),
      hasSchemaLookupSection: Boolean(document.getElementById("schema-lookup")),
      hasMockWorkersField: Boolean(
        surface?.querySelector('[data-schema-field-path="mockWorkers"]'),
      ),
      hasUnmatchedPolicyField: Boolean(
        surface?.querySelector(
          '[data-schema-field-path="unmatchedDispatchPolicy"]',
        ),
      ),
      hasRunTypeNested: Boolean(
        surface?.querySelector(
          '[data-schema-field-path="mockWorkers[].runType"]',
        ),
      ),
      hasWorkerNameNested: Boolean(
        surface?.querySelector(
          '[data-schema-field-path="mockWorkers[].workerName"]',
        ),
      ),
      hasRejectConfigNested: Boolean(
        surface?.querySelector(
          '[data-schema-field-path="mockWorkers[].rejectConfig"]',
        ),
      ),
      hasScriptConfigNested: Boolean(
        surface?.querySelector(
          '[data-schema-field-path="mockWorkers[].scriptConfig"]',
        ),
      ),
      hasWorkInputsNested: Boolean(
        surface?.querySelector(
          '[data-schema-field-path="mockWorkers[].workInputs"]',
        ),
      ),
      hasCatalog: Boolean(
        surface?.querySelector('[data-schema-reference="catalog"]'),
      ),
      hasMockWorkerDef: Boolean(
        surface?.querySelector(
          '[data-schema-definition-pointer="/$defs/mockWorker"]',
        ),
      ),
      hasRejectConfigDef: Boolean(
        surface?.querySelector(
          '[data-schema-definition-pointer="/$defs/rejectConfig"]',
        ),
      ),
      hasScriptConfigDef: Boolean(
        surface?.querySelector(
          '[data-schema-definition-pointer="/$defs/scriptConfig"]',
        ),
      ),
      hasWorkInputDef: Boolean(
        surface?.querySelector(
          '[data-schema-definition-pointer="/$defs/workInput"]',
        ),
      ),
      examplesPresent: Boolean(examples),
      hasAcceptExample: Boolean(acceptExample),
      hasRejectExample: Boolean(rejectExample),
      hasCopyControl: Boolean(copyControl),
      acceptExampleText: acceptExample?.textContent ?? "",
      rejectExampleText: rejectExample?.textContent ?? "",
      policyRowText:
        surface?.querySelector(
          '[data-schema-field-path="unmatchedDispatchPolicy"]',
        )?.textContent ?? "",
    };
  });

  const failures: string[] = [];
  const requireTrue = (ok: boolean, label: string) => {
    if (!ok) failures.push(label);
  };

  requireTrue(polish.schemaStatus === "ready", "schema status ready");
  requireTrue(!polish.hasWhatItCoversHeading, "no What It Covers heading");
  requireTrue(!polish.hasKeyConceptsHeading, "no Key Concepts heading");
  requireTrue(!polish.hasHowToUseHeading, "no How To Use heading");
  requireTrue(!polish.hasWhatItCoversSection, "no #what-it-covers section");
  requireTrue(!polish.hasKeyConceptsSection, "no #key-concepts section");
  requireTrue(polish.hasSchemaLookupHeading, "Schema Lookup heading present");
  requireTrue(polish.hasSchemaLookupSection, "#schema-lookup section present");
  requireTrue(polish.hasMockWorkersField, "mockWorkers field visible");
  requireTrue(
    polish.hasUnmatchedPolicyField,
    "unmatchedDispatchPolicy field visible",
  );
  requireTrue(
    /passthrough/i.test(polish.policyRowText),
    "unmatchedDispatchPolicy enum includes passthrough",
  );
  requireTrue(
    /accept/i.test(polish.policyRowText),
    "unmatchedDispatchPolicy enum includes accept",
  );
  requireTrue(polish.hasRunTypeNested, "mockWorkers[].runType nested visible");
  requireTrue(
    polish.hasWorkerNameNested,
    "mockWorkers[].workerName nested visible",
  );
  requireTrue(
    polish.hasRejectConfigNested,
    "mockWorkers[].rejectConfig nested visible",
  );
  requireTrue(
    polish.hasScriptConfigNested,
    "mockWorkers[].scriptConfig nested visible",
  );
  requireTrue(
    polish.hasWorkInputsNested,
    "mockWorkers[].workInputs nested visible",
  );
  requireTrue(polish.hasCatalog, "on-page $defs catalog visible");
  requireTrue(polish.hasMockWorkerDef, "mockWorker $def on page");
  requireTrue(polish.hasRejectConfigDef, "rejectConfig $def on page");
  requireTrue(polish.hasScriptConfigDef, "scriptConfig $def on page");
  requireTrue(polish.hasWorkInputDef, "workInput $def on page");
  requireTrue(polish.examplesPresent, "examples panel present");
  requireTrue(polish.hasAcceptExample, "minimal accept example visible");
  requireTrue(polish.hasRejectExample, "reject + policy example visible");
  requireTrue(polish.hasCopyControl, "example copy control visible");
  requireTrue(
    polish.acceptExampleText.includes('"runType": "accept"'),
    "accept example includes runType accept",
  );
  requireTrue(
    polish.acceptExampleText.includes('"workerName": "reviewer"'),
    "accept example includes workerName",
  );
  requireTrue(
    polish.rejectExampleText.includes('"runType": "reject"'),
    "reject example includes runType reject",
  );
  requireTrue(
    polish.rejectExampleText.includes(
      '"unmatchedDispatchPolicy": "passthrough"',
    ),
    "reject example includes unmatchedDispatchPolicy",
  );

  // Copy control must be activatable (keyboard-focusable button/link).
  const copyButton = page
    .locator(
      '[data-testid="mock-workers-schema-reference"] [data-schema-example="copy"]',
    )
    .first();
  await copyButton.focus();
  const copyFocused = await page.evaluate(() => {
    const active = document.activeElement;
    return active?.getAttribute("data-schema-example") === "copy";
  });
  requireTrue(copyFocused, "example copy control is keyboard-focusable");

  await browser.close();

  if (failures.length > 0) {
    console.error("Mock-workers schema polish browser verify failed:");
    for (const failure of failures) {
      console.error(`  - ${failure}`);
    }
    console.error(JSON.stringify(polish, null, 2));
    process.exit(1);
  }

  console.log("PASS: mock-workers-schema polish browser verify");
  console.log(
    JSON.stringify(
      {
        schemaStatus: polish.schemaStatus,
        nestedRunType: polish.hasRunTypeNested,
        catalog: polish.hasCatalog,
        acceptExample: polish.hasAcceptExample,
        rejectExample: polish.hasRejectExample,
        copyControl: polish.hasCopyControl,
      },
      null,
      2,
    ),
  );
} finally {
  cleanup();
}
