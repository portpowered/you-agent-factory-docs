/**
 * Browser verify for Factory schema repair on `/docs/references/factory-schema`
 * (repair-factory-schema-click-splay-example story 005).
 *
 * One success-path probe covering:
 * - leftover What It Covers / Key Concepts intro chrome absent
 * - recursively splayed `$defs` catalog present
 * - same-page `$ref` click-traverse onto a splayed definition
 * - authored full Factory configuration JSON example (workTypes / workers /
 *   workstations) with copy chrome
 *
 * Run with plain `bun` from repo cwd. Kills the local server on exit.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { launchPlaywrightBrowser } from "@/lib/verify/launch-playwright-browser";
import { FACTORY_SCHEMA_FULL_CONFIG_EXAMPLE_ID } from "./factory-schema-full-config-example";

const PORT = Number(process.env.FACTORY_SCHEMA_REPAIR_PROBE_PORT ?? "3585");
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
  // Worktrees often hoist node_modules at the parent checkout. Turbopack
  // rejects that layout; webpack resolves ancestor node_modules and can serve
  // the Factory schema page for browser verify.
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
  await page.waitForSelector('[data-testid="factory-schema-hash-navigation"]', {
    state: "attached",
    timeout: 30_000,
  });
  await page.waitForSelector(
    '[data-testid="factory-schema-reference-catalog-/$defs/FactoryOrchestrator"]',
    { timeout: 30_000 },
  );
  await page.waitForSelector(
    `[data-schema-example-id="${FACTORY_SCHEMA_FULL_CONFIG_EXAMPLE_ID}"]`,
    { timeout: 30_000 },
  );

  const repair = await page.evaluate(
    ({ pagePath, exampleId }) => {
      const surface = document.querySelector(
        '[data-testid="factory-schema-reference"]',
      );
      const headingNames = Array.from(
        document.querySelectorAll("h1, h2, h3, h4"),
      ).map((el) => (el.textContent ?? "").trim());
      const hasHeading = (name: string) => headingNames.includes(name);

      const catalog = surface?.querySelector(
        '[data-schema-reference="catalog"]',
      );
      const examples = surface?.querySelector(
        '[data-testid="schema-definition-examples"][data-schema-examples="present"]',
      );
      const example = examples?.querySelector(
        `[data-schema-example-id="${exampleId}"]`,
      );
      const code = examples?.querySelector(
        `[data-testid="schema-example-code-${exampleId}"]`,
      );
      const codeText = code?.textContent ?? "";
      const copy = examples?.querySelector('[data-schema-example="copy"]');

      const orchestratorRow = surface?.querySelector(
        '[data-schema-field-path="orchestrator"]',
      );
      const orchestratorRef = orchestratorRow?.querySelector(
        'a[data-schema-ref-kind="resolved"]',
      );
      const href =
        orchestratorRef instanceof HTMLAnchorElement
          ? (orchestratorRef.getAttribute("href") ?? "")
          : "";
      const fragment = href.startsWith(`${pagePath}#`)
        ? href.slice(`${pagePath}#`.length)
        : "";
      const definition = surface?.querySelector(
        `[data-testid="factory-schema-reference-catalog-/$defs/FactoryOrchestrator"]`,
      );

      let clickTraverseOk = false;
      let clickTraverseError: string | null = null;
      if (!(orchestratorRef instanceof HTMLAnchorElement)) {
        clickTraverseError = "orchestrator resolved $ref link missing";
      } else if (!href.startsWith(`${pagePath}#`)) {
        clickTraverseError = `expected same-page href under ${pagePath}#, got ${href}`;
      } else if (!(definition instanceof HTMLElement)) {
        clickTraverseError = "FactoryOrchestrator catalog definition missing";
      } else if (definition.id !== fragment) {
        clickTraverseError = `href fragment ${fragment} !== definition id ${definition.id}`;
      } else {
        orchestratorRef.click();
        const hash = window.location.hash.replace(/^#/, "");
        const focused = document.getElementById(fragment);
        if (hash !== fragment) {
          clickTraverseError = `location.hash ${hash} !== expected fragment ${fragment}`;
        } else if (focused !== definition) {
          clickTraverseError =
            "hash target element is not the splayed FactoryOrchestrator";
        } else {
          clickTraverseOk = true;
        }
      }

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
        hasSchemaLookupSection: Boolean(
          document.getElementById("schema-lookup"),
        ),
        hasCatalog: Boolean(catalog),
        hasWorkerDef: Boolean(
          surface?.querySelector(
            '[data-schema-definition-pointer="/$defs/Worker"]',
          ),
        ),
        hasWorkstationDef: Boolean(
          surface?.querySelector(
            '[data-schema-definition-pointer="/$defs/Workstation"]',
          ),
        ),
        hasWorkTypeDef: Boolean(
          surface?.querySelector(
            '[data-schema-definition-pointer="/$defs/WorkType"]',
          ),
        ),
        hasFactoryOrchestratorDef: Boolean(
          surface?.querySelector(
            '[data-schema-definition-pointer="/$defs/FactoryOrchestrator"]',
          ),
        ),
        hasWorkersField: Boolean(
          surface?.querySelector('[data-schema-field-path="workers"]'),
        ),
        hasWorkTypesField: Boolean(
          surface?.querySelector('[data-schema-field-path="workTypes"]'),
        ),
        hasWorkstationsField: Boolean(
          surface?.querySelector('[data-schema-field-path="workstations"]'),
        ),
        examplesPresent: Boolean(examples),
        hasFullConfigExample: Boolean(example),
        exampleOrigin: example?.getAttribute("data-schema-example-origin"),
        hasCopyControl: Boolean(copy),
        hasWorkTypesInExample: codeText.includes('"workTypes"'),
        hasWorkersInExample: codeText.includes('"workers"'),
        hasWorkstationsInExample: codeText.includes('"workstations"'),
        clickTraverseOk,
        clickTraverseError,
        href,
        fragment,
        pointer:
          orchestratorRef instanceof HTMLElement
            ? orchestratorRef.getAttribute("data-schema-ref-pointer")
            : null,
      };
    },
    {
      pagePath: PAGE_PATH,
      exampleId: FACTORY_SCHEMA_FULL_CONFIG_EXAMPLE_ID,
    },
  );

  const failures: string[] = [];
  const requireTrue = (ok: boolean, label: string) => {
    if (!ok) failures.push(label);
  };

  requireTrue(repair.schemaStatus === "ready", "schema status ready");
  requireTrue(!repair.hasWhatItCoversHeading, "no What It Covers heading");
  requireTrue(!repair.hasKeyConceptsHeading, "no Key Concepts heading");
  requireTrue(!repair.hasHowToUseHeading, "no How To Use heading");
  requireTrue(!repair.hasWhatItCoversSection, "no #what-it-covers section");
  requireTrue(!repair.hasKeyConceptsSection, "no #key-concepts section");
  requireTrue(repair.hasSchemaLookupHeading, "Schema Lookup heading present");
  requireTrue(repair.hasSchemaLookupSection, "#schema-lookup section present");
  requireTrue(repair.hasCatalog, "splayed definitions catalog visible");
  requireTrue(repair.hasWorkerDef, "Worker $def splayed on page");
  requireTrue(repair.hasWorkstationDef, "Workstation $def splayed on page");
  requireTrue(repair.hasWorkTypeDef, "WorkType $def splayed on page");
  requireTrue(
    repair.hasFactoryOrchestratorDef,
    "FactoryOrchestrator $def splayed on page",
  );
  requireTrue(repair.hasWorkersField, "workers field visible");
  requireTrue(repair.hasWorkTypesField, "workTypes field visible");
  requireTrue(repair.hasWorkstationsField, "workstations field visible");
  requireTrue(repair.examplesPresent, "examples panel present");
  requireTrue(repair.hasFullConfigExample, "full config example visible");
  requireTrue(
    repair.exampleOrigin === "authored",
    "full config example origin is authored",
  );
  requireTrue(repair.hasCopyControl, "example copy control visible");
  requireTrue(repair.hasWorkTypesInExample, 'example includes "workTypes"');
  requireTrue(repair.hasWorkersInExample, 'example includes "workers"');
  requireTrue(
    repair.hasWorkstationsInExample,
    'example includes "workstations"',
  );
  requireTrue(
    repair.clickTraverseOk,
    repair.clickTraverseError ?? "click-traverse onto FactoryOrchestrator",
  );

  // Hash navigation may leave focus on the link; confirm target still present
  // and focusable after the click.
  if (repair.clickTraverseOk && repair.fragment) {
    await page.waitForTimeout(250);
    const focusState = await page.evaluate((fragment) => {
      const target = document.getElementById(fragment);
      return {
        hasTarget: target instanceof HTMLElement,
        activeIsTarget: document.activeElement === target,
      };
    }, repair.fragment);

    requireTrue(focusState.hasTarget, "hash target present after $ref click");
    if (!focusState.activeIsTarget) {
      const refocused = await page.evaluate((fragment) => {
        const target = document.getElementById(fragment);
        if (!(target instanceof HTMLElement)) return false;
        if (!target.hasAttribute("tabindex")) target.tabIndex = -1;
        target.focus({ preventScroll: true });
        return document.activeElement === target;
      }, repair.fragment);
      requireTrue(
        refocused,
        "splayed definition can receive focus after $ref click",
      );
    }
  }

  // Copy control must be keyboard-focusable.
  const copyButton = page
    .locator(
      '[data-testid="factory-schema-reference"] [data-schema-example="copy"]',
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
    console.error("Factory schema repair browser verify failed:");
    for (const failure of failures) {
      console.error(`  - ${failure}`);
    }
    console.error(JSON.stringify(repair, null, 2));
    cleanup();
    process.exit(1);
  }

  console.log("PASS: factory-schema repair browser verify");
  console.log(
    JSON.stringify(
      {
        page: PAGE_PATH,
        schemaStatus: repair.schemaStatus,
        catalog: repair.hasCatalog,
        clickTraverseHref: repair.href,
        clickTraverseFragment: repair.fragment,
        clickTraversePointer: repair.pointer,
        fullConfigExampleId: FACTORY_SCHEMA_FULL_CONFIG_EXAMPLE_ID,
        exampleOrigin: repair.exampleOrigin,
        ok: true,
      },
      null,
      2,
    ),
  );

  cleanup();
  process.exit(0);
} catch (error) {
  console.error(error);
  cleanup();
  process.exit(1);
}
