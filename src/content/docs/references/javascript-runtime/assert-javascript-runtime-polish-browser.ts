/**
 * Browser verify for polished `/docs/references/javascript-runtime`:
 * intro chrome absence (What It Covers / Key Concepts / folded Opening
 * summary), #159 keep-list (glossary, overall usage example, Runtime
 * Inventory), trimmed symbol/shared-schema chrome, and Symbols/Shared
 * schemas On this page traversal.
 * (repair-javascript-runtime-polish story 007 + intro-strip story 003).
 *
 * Run with plain `bun` from repo cwd. Kills the local server on exit.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { launchPlaywrightBrowser } from "@/lib/verify/launch-playwright-browser";

const PORT = Number(process.env.JAVASCRIPT_RUNTIME_POLISH_PROBE_PORT ?? "3577");
const PAGE_PATH = "/docs/references/javascript-runtime";
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

  await page.waitForSelector("[data-javascript-runtime-inventory]", {
    timeout: 120_000,
  });
  await page.waitForFunction(
    () => {
      const root = document.querySelector(
        "[data-javascript-runtime-inventory]",
      );
      return root?.getAttribute("data-inventory-state") === "success";
    },
    { timeout: 120_000 },
  );

  const polish = await page.evaluate(() => {
    const inventory = document.querySelector(
      "[data-javascript-runtime-inventory]",
    );
    const argsCard = document.querySelector(
      '[data-javascript-symbol-reference][data-javascript-symbol-path="args"]',
    );
    const logCard = document.querySelector(
      '[data-javascript-symbol-reference][data-javascript-symbol-path="log"]',
    );
    const sharedCards = document.querySelectorAll(
      "[data-javascript-shared-schema-reference]",
    );
    const glossary = document.querySelector(
      "[data-javascript-symbol-metadata-glossary]",
    );
    const overallExample = document.querySelector(
      "[data-javascript-runtime-overall-example]",
    );
    const overallCode = document.querySelector(
      "[data-javascript-runtime-overall-example-code]",
    );
    const toc = document.querySelector("#nd-toc");
    const tocSymbols = toc?.querySelector('a[href="#symbols"]');
    const tocSharedSchemas = toc?.querySelector('a[href="#shared-schemas"]');
    const headingNames = Array.from(
      document.querySelectorAll("h1, h2, h3, h4"),
    ).map((el) => (el.textContent ?? "").trim());
    const hasHeading = (name: string) => headingNames.includes(name);

    const bodyText = document.body.textContent ?? "";
    const hasDtLabel = (root: ParentNode | null | undefined, label: string) => {
      if (!root) return false;
      return Array.from(root.querySelectorAll("dt")).some(
        (dt) => (dt.textContent ?? "").trim() === label,
      );
    };

    return {
      hasWhatItCoversHeading: hasHeading("What It Covers"),
      hasKeyConceptsHeading: hasHeading("Key Concepts"),
      hasWhatItCoversSection: Boolean(
        document.getElementById("what-it-covers"),
      ),
      hasKeyConceptsSection: Boolean(document.getElementById("key-concepts")),
      hasFoldedOpeningSummary: Boolean(
        document.querySelector(
          '[data-opening-summary], [data-testid="folded-summary"]',
        ),
      ),
      inventoryState: inventory?.getAttribute("data-inventory-state") ?? null,
      symbolCount: Number(
        inventory?.getAttribute("data-javascript-symbol-count") ?? "0",
      ),
      sharedSchemaCount: Number(
        inventory?.getAttribute("data-javascript-shared-schema-count") ?? "0",
      ),
      hasArgsCard: Boolean(argsCard),
      argsHasKindValue: Boolean(
        argsCard?.querySelector(
          '[data-javascript-metadata-facet="kind"][data-javascript-metadata-value="value"]',
        ),
      ),
      argsHasLifecycleVisibilityChrome: Boolean(
        argsCard?.querySelector("[data-reference-status-chrome]"),
      ),
      argsHasContractSourceBadge: Boolean(
        argsCard?.querySelector("[data-contract-source-badge]"),
      ),
      argsHasFamilyChrome: Boolean(
        argsCard?.querySelector(
          "[data-source-artifact], [data-package-version]",
        ),
      ),
      logHasKindFunction: Boolean(
        logCard?.querySelector(
          '[data-javascript-metadata-facet="kind"][data-javascript-metadata-value="function"]',
        ),
      ),
      sharedCardCount: sharedCards.length,
      sharedHasContractSourceBadge: Boolean(
        document.querySelector(
          "[data-javascript-shared-schema-reference] [data-contract-source-badge]",
        ),
      ),
      sharedHasSourceArtifactAttr: Boolean(
        document.querySelector(
          "[data-javascript-shared-schema-reference] [data-source-artifact]",
        ),
      ),
      // Scope chrome-label checks to the inventory DOM (not page-wide RSC
      // message payloads that still ship ContractSourceBadge i18n strings).
      hasSchemaIdDt: hasDtLabel(inventory, "Schema id"),
      hasNameDt: hasDtLabel(inventory, "Name"),
      hasTitleDt: hasDtLabel(inventory, "Title"),
      hasTypeDt: hasDtLabel(inventory, "Type"),
      hasObjectPolicyDt: hasDtLabel(inventory, "Object policy"),
      hasVisibilityDt: hasDtLabel(inventory, "Visibility"),
      inventoryHasPackageVersionChrome:
        Boolean(
          inventory?.querySelector(
            "[data-contract-source-badge], [data-package-version]",
          ),
        ) || hasDtLabel(inventory, "Package version"),
      inventoryHasSourceArtifactChrome:
        Boolean(inventory?.querySelector("[data-source-artifact]")) ||
        hasDtLabel(inventory, "Source artifact"),
      glossaryPresent: Boolean(glossary),
      glossaryKind: Boolean(document.getElementById("glossary-kind")),
      glossaryMutability: Boolean(
        document.getElementById("glossary-mutability"),
      ),
      glossaryNullability: Boolean(
        document.getElementById("glossary-nullability"),
      ),
      glossaryBindingLifecycle: Boolean(
        document.getElementById("glossary-binding-lifecycle"),
      ),
      valueDefinition: /A Value is a bound data binding/i.test(bodyText),
      functionDefinition: /A function is a callable runtime helper/i.test(
        bodyText,
      ),
      overallExamplePresent: Boolean(overallExample),
      overallExampleHasPhase: (overallCode?.textContent ?? "").includes(
        'phase("draft")',
      ),
      overallExampleHasAgentRun: (overallCode?.textContent ?? "").includes(
        "await agent.run",
      ),
      symbolsSection: Boolean(document.getElementById("symbols")),
      sharedSchemasSection: Boolean(document.getElementById("shared-schemas")),
      tocHasSymbols: Boolean(tocSymbols),
      tocHasSharedSchemas: Boolean(tocSharedSchemas),
      duplicatedSharedSchemaInSymbols: Array.from(
        document.querySelectorAll(
          "[data-javascript-shared-schemas] [data-javascript-shared-schema-id]",
        ),
      ).some((schemaEl) => {
        const id = schemaEl.getAttribute("data-javascript-shared-schema-id");
        if (!id) return false;
        return Boolean(
          document.querySelector(
            `[data-javascript-symbols] [data-javascript-symbol-reference][id="${id}"]`,
          ),
        );
      }),
    };
  });

  const failures: string[] = [];
  const requireTrue = (ok: boolean, label: string) => {
    if (!ok) failures.push(label);
  };

  requireTrue(!polish.hasWhatItCoversHeading, "no What It Covers heading");
  requireTrue(!polish.hasKeyConceptsHeading, "no Key Concepts heading");
  requireTrue(!polish.hasWhatItCoversSection, "no #what-it-covers section");
  requireTrue(!polish.hasKeyConceptsSection, "no #key-concepts section");
  requireTrue(
    !polish.hasFoldedOpeningSummary,
    "no folded Opening summary chrome",
  );
  requireTrue(polish.inventoryState === "success", "inventory success state");
  requireTrue(polish.symbolCount > 3, "symbol cards published");
  requireTrue(polish.sharedSchemaCount > 0, "shared schemas published");
  requireTrue(polish.hasArgsCard, "args symbol card visible");
  requireTrue(polish.argsHasKindValue, "args Kind: Value pill");
  requireTrue(
    polish.argsHasLifecycleVisibilityChrome,
    "args lifecycle/visibility pills",
  );
  requireTrue(
    !polish.argsHasContractSourceBadge,
    "args has no ContractSourceBadge",
  );
  requireTrue(!polish.argsHasFamilyChrome, "args has no family/package/source");
  requireTrue(polish.logHasKindFunction, "log Kind: Function pill");
  requireTrue(polish.sharedCardCount > 0, "shared-schema cards visible");
  requireTrue(
    !polish.sharedHasContractSourceBadge,
    "shared schemas have no ContractSourceBadge",
  );
  requireTrue(
    !polish.sharedHasSourceArtifactAttr,
    "shared schemas have no source-artifact attr",
  );
  requireTrue(!polish.hasSchemaIdDt, "no Schema id chrome");
  requireTrue(!polish.hasNameDt, "no Name dt chrome");
  requireTrue(!polish.hasTitleDt, "no Title dt chrome");
  requireTrue(!polish.hasTypeDt, "no Type dt chrome");
  requireTrue(!polish.hasObjectPolicyDt, "no Object policy chrome");
  requireTrue(!polish.hasVisibilityDt, "no Visibility text field");
  requireTrue(
    !polish.inventoryHasPackageVersionChrome,
    "no Package version chrome in inventory",
  );
  requireTrue(
    !polish.inventoryHasSourceArtifactChrome,
    "no Source artifact chrome in inventory",
  );
  requireTrue(polish.glossaryPresent, "glossary section visible");
  requireTrue(polish.glossaryKind, "glossary-kind anchor");
  requireTrue(polish.glossaryMutability, "glossary-mutability anchor");
  requireTrue(polish.glossaryNullability, "glossary-nullability anchor");
  requireTrue(
    polish.glossaryBindingLifecycle,
    "glossary-binding-lifecycle anchor",
  );
  requireTrue(polish.valueDefinition, "Value glossary definition");
  requireTrue(polish.functionDefinition, "function glossary definition");
  requireTrue(polish.overallExamplePresent, "overall example visible");
  requireTrue(polish.overallExampleHasPhase, "overall example uses phase()");
  requireTrue(
    polish.overallExampleHasAgentRun,
    "overall example uses agent.run",
  );
  requireTrue(polish.symbolsSection, "#symbols section present");
  requireTrue(polish.sharedSchemasSection, "#shared-schemas section present");
  requireTrue(polish.tocHasSymbols, "On this page link to #symbols");
  requireTrue(
    polish.tocHasSharedSchemas,
    "On this page link to #shared-schemas",
  );
  requireTrue(
    !polish.duplicatedSharedSchemaInSymbols,
    "shared schemas not duplicated in Symbols",
  );

  // Activate On this page destinations and confirm section focus/scroll targets.
  for (const anchorId of ["symbols", "shared-schemas"] as const) {
    const tocLink = page.locator(`#nd-toc a[href="#${anchorId}"]`);
    await tocLink.click();
    await page.waitForFunction(
      (id) => {
        const el = document.getElementById(id);
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.top >= -40 && rect.top < window.innerHeight;
      },
      anchorId,
      { timeout: 15_000 },
    );
    const hash = await page.evaluate(() => window.location.hash);
    if (hash !== `#${anchorId}`) {
      failures.push(`hash after TOC click should be #${anchorId}, got ${hash}`);
    }
  }

  await browser.close();

  if (failures.length > 0) {
    console.error("JavaScript runtime polish browser verify failed:");
    for (const failure of failures) {
      console.error(`  - ${failure}`);
    }
    console.error(JSON.stringify(polish, null, 2));
    process.exit(1);
  }

  console.log("PASS: javascript-runtime polish browser verify");
  console.log(
    JSON.stringify(
      {
        introChromeAbsent: true,
        symbolCount: polish.symbolCount,
        sharedSchemaCount: polish.sharedSchemaCount,
        glossaryPresent: polish.glossaryPresent,
        overallExamplePresent: polish.overallExamplePresent,
        tocSymbols: polish.tocHasSymbols,
        tocSharedSchemas: polish.tocHasSharedSchemas,
      },
      null,
      2,
    ),
  );
} finally {
  cleanup();
}
