/**
 * Browser verify for repaired `/docs/references/system-config-schema`:
 * System config title, local-storage lead, trimmed filter/catalog chrome,
 * clear root header, authored operator-config example above definition
 * fields/body (Q5 examples-before-body), no you-config-schema redirect, and
 * inbound/family-index links to the new URL
 * (repair-you-config-system-config-rename story 007 +
 * repair-system-config-examples-above-definition story 003).
 *
 * Run with plain `bun` from repo cwd. Kills the local server on exit.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { launchPlaywrightBrowser } from "@/lib/verify/launch-playwright-browser";

const PORT = Number(
  process.env.SYSTEM_CONFIG_SCHEMA_RENAME_PROBE_PORT ?? "3587",
);
const NEW_PAGE_PATH = "/docs/references/system-config-schema";
const OLD_PAGE_PATH = "/docs/references/you-config-schema";
const FAMILY_INDEX_PATH = "/docs/references";
const GLOBAL_CONFIGURATION_PATH = "/docs/factories/global-configuration";
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
  // the repaired page for browser verify.
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
  await waitForReady(`${base}${NEW_PAGE_PATH}`, READY_TIMEOUT_MS);

  const browser = await launchPlaywrightBrowser();
  const page = await browser.newPage();
  page.setDefaultTimeout(120_000);

  const response = await page.goto(`${base}${NEW_PAGE_PATH}`, {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });
  if (!response?.ok()) {
    throw new Error(
      `Expected 200 for ${NEW_PAGE_PATH}, got ${response?.status() ?? "no response"}`,
    );
  }

  await page.waitForSelector('[data-testid="system-config-schema-reference"]', {
    timeout: 120_000,
  });
  await page.waitForFunction(
    () => {
      const root = document.querySelector(
        '[data-testid="system-config-schema-reference"]',
      );
      return root?.getAttribute("data-schema-status") === "ready";
    },
    { timeout: 120_000 },
  );

  const polish = await page.evaluate(() => {
    const surface = document.querySelector(
      '[data-testid="system-config-schema-reference"]',
    );
    const bodyText = document.body.textContent ?? "";
    const title =
      document.querySelector("h1")?.textContent?.trim() ??
      document.title.trim();

    return {
      title,
      schemaStatus: surface?.getAttribute("data-schema-status") ?? null,
      hasHowToAccess: Boolean(document.getElementById("how-to-access")),
      howToAccessText:
        document.getElementById("how-to-access")?.textContent ?? "",
      hasWhatItCoversHeading: Boolean(
        Array.from(document.querySelectorAll("h2, h3")).some((el) =>
          /What It Covers/i.test(el.textContent ?? ""),
        ),
      ),
      hasWhatItCoversId: Boolean(document.getElementById("what-it-covers")),
      hasFilterTestId: Boolean(
        document.querySelector(
          '[data-testid="system-config-schema-reference-filter"]',
        ),
      ),
      hasFilterDefinitions: Boolean(
        surface?.querySelector('[data-schema-filter="definitions"]'),
      ),
      hasCatalog: Boolean(
        surface?.querySelector('[data-schema-reference="catalog"]'),
      ),
      hasDefinitionsHeading: Boolean(
        Array.from(document.querySelectorAll("h2, h3")).some(
          (el) => (el.textContent ?? "").trim() === "Definitions",
        ),
      ),
      hasSystemConfigurationHeading: Boolean(
        Array.from(document.querySelectorAll("h2")).some(
          (el) => (el.textContent ?? "").trim() === "System configuration",
        ),
      ),
      hasYouOperatorHeading: /You operator and system configuration/i.test(
        bodyText,
      ),
      hasAuthoredExample: Boolean(
        surface?.querySelector('[data-schema-example-origin="authored"]'),
      ),
      hasExamplesPresent: Boolean(
        surface?.querySelector('[data-schema-examples="present"]'),
      ),
      examplesPlacement:
        surface
          ?.querySelector(
            '[data-testid="system-config-schema-reference-definition"]',
          )
          ?.getAttribute("data-schema-examples-placement") ?? null,
      examplesBeforeFields: (() => {
        const examples = surface?.querySelector(
          '[data-testid="schema-definition-examples"][data-schema-examples="present"]',
        );
        const fields = surface?.querySelector(
          "[data-schema-definition-fields]",
        );
        if (!examples || !fields) return false;
        return Boolean(
          examples.compareDocumentPosition(fields) &
            Node.DOCUMENT_POSITION_FOLLOWING,
        );
      })(),
      exampleCode:
        document.getElementById("schema-example-code-operator-config-defaults")
          ?.textContent ??
        document.querySelector(
          '[data-testid="schema-example-code-operator-config-defaults"]',
        )?.textContent ??
        "",
      hasDefaultsField: Boolean(
        surface?.querySelector('[data-schema-field-path="defaults"]'),
      ),
      hasWorkerPresetsField: Boolean(
        surface?.querySelector('[data-schema-field-path="workerPresets"]'),
      ),
    };
  });

  const failures: string[] = [];
  const requireTrue = (ok: boolean, label: string) => {
    if (!ok) failures.push(label);
  };

  requireTrue(
    /System config/i.test(polish.title),
    "page title includes System config",
  );
  requireTrue(polish.schemaStatus === "ready", "schema status ready");
  requireTrue(polish.hasHowToAccess, "#how-to-access lead present");
  requireTrue(
    /~\/\.you-agent-factory\/config\.json/.test(polish.howToAccessText),
    "lead states config.json path",
  );
  requireTrue(
    /you config init/i.test(polish.howToAccessText),
    "lead mentions you config init",
  );
  requireTrue(!polish.hasWhatItCoversHeading, "no What It Covers heading");
  requireTrue(!polish.hasWhatItCoversId, "no #what-it-covers section");
  requireTrue(!polish.hasFilterTestId, "no filter-definitions testid");
  requireTrue(!polish.hasFilterDefinitions, "no filter-definitions list");
  requireTrue(!polish.hasCatalog, "no top-level definitions catalog");
  requireTrue(!polish.hasDefinitionsHeading, "no Definitions heading");
  requireTrue(
    polish.hasSystemConfigurationHeading,
    "System configuration root header",
  );
  requireTrue(
    !polish.hasYouOperatorHeading,
    "no You operator and system configuration copy",
  );
  requireTrue(polish.hasExamplesPresent, "examples present marker");
  requireTrue(polish.hasAuthoredExample, "authored example visible");
  requireTrue(
    polish.examplesPlacement === "before-body",
    "examplesPlacement is before-body",
  );
  requireTrue(
    polish.examplesBeforeFields,
    "authored examples precede definition fields in DOM order",
  );
  requireTrue(
    /workerModelProvider[\s\S]*codex/.test(polish.exampleCode),
    "example includes workerModelProvider codex",
  );
  requireTrue(
    /workerModel[\s\S]*gpt-5-codex/.test(polish.exampleCode),
    "example includes workerModel gpt-5-codex",
  );
  requireTrue(
    !/defaultModelProvider/.test(polish.exampleCode),
    "example does not invent defaultModelProvider",
  );
  requireTrue(polish.hasDefaultsField, "defaults root field visible");
  requireTrue(polish.hasWorkerPresetsField, "workerPresets root field visible");

  // Old slug must not redirect into the new page (expect not-found / non-200).
  const oldResponse = await page.goto(`${base}${OLD_PAGE_PATH}`, {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });
  const oldStatus = oldResponse?.status() ?? 0;
  const oldFinalUrl = page.url();
  const oldRedirectedToNew =
    oldFinalUrl.includes(NEW_PAGE_PATH) ||
    Boolean(oldResponse?.headers()?.location?.includes(NEW_PAGE_PATH));
  requireTrue(
    oldStatus === 404 || (oldStatus >= 400 && !oldRedirectedToNew),
    `old slug not published/redirected (status=${oldStatus}, url=${oldFinalUrl})`,
  );
  requireTrue(
    !oldRedirectedToNew,
    "old you-config-schema URL does not redirect to system-config-schema",
  );

  // Family index advertises the new route.
  const familyResponse = await page.goto(`${base}${FAMILY_INDEX_PATH}`, {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });
  if (!familyResponse?.ok()) {
    failures.push(
      `family index expected 200, got ${familyResponse?.status() ?? "none"}`,
    );
  } else {
    const familyLinks = await page.evaluate((newPath) => {
      const hrefs = Array.from(document.querySelectorAll("a[href]")).map(
        (a) => a.getAttribute("href") ?? "",
      );
      return {
        hasNew: hrefs.some(
          (href) => href === newPath || href.endsWith(newPath),
        ),
        hasOld: hrefs.some((href) => href.includes("you-config-schema")),
      };
    }, NEW_PAGE_PATH);
    requireTrue(
      familyLinks.hasNew,
      "family index links to system-config-schema",
    );
    requireTrue(
      !familyLinks.hasOld,
      "family index does not advertise you-config-schema",
    );
  }

  // Representative inbound link from global-configuration.
  const inboundResponse = await page.goto(
    `${base}${GLOBAL_CONFIGURATION_PATH}`,
    {
      waitUntil: "domcontentloaded",
      timeout: 120_000,
    },
  );
  if (!inboundResponse?.ok()) {
    failures.push(
      `global-configuration expected 200, got ${inboundResponse?.status() ?? "none"}`,
    );
  } else {
    const inbound = await page.evaluate((newPath) => {
      const link = Array.from(document.querySelectorAll("a[href]")).find(
        (a) =>
          (a.getAttribute("href") ?? "").endsWith(newPath) ||
          (a.getAttribute("href") ?? "") === newPath,
      );
      return {
        href: link?.getAttribute("href") ?? null,
        label: (link?.textContent ?? "").trim(),
      };
    }, NEW_PAGE_PATH);
    requireTrue(
      inbound.href === NEW_PAGE_PATH ||
        inbound.href?.endsWith(NEW_PAGE_PATH) === true,
      "global-configuration full-schema link href",
    );
    requireTrue(
      /System config/i.test(inbound.label),
      "global-configuration full-schema link label",
    );

    if (inbound.href) {
      await page.click(`a[href="${inbound.href}"]`);
      await page.waitForURL(`**${NEW_PAGE_PATH}`, { timeout: 60_000 });
      requireTrue(
        page.url().includes(NEW_PAGE_PATH),
        "inbound link navigates to system-config-schema",
      );
    }
  }

  await browser.close();

  if (failures.length > 0) {
    console.error("System-config schema rename browser verify failed:");
    for (const failure of failures) {
      console.error(`  - ${failure}`);
    }
    console.error(JSON.stringify(polish, null, 2));
    process.exit(1);
  }

  console.log("PASS: system-config-schema rename browser verify");
  console.log(
    JSON.stringify(
      {
        title: polish.title,
        schemaStatus: polish.schemaStatus,
        examplesPlacement: polish.examplesPlacement,
        examplesBeforeFields: polish.examplesBeforeFields,
        oldSlugStatus: oldStatus,
        oldFinalUrl,
      },
      null,
      2,
    ),
  );
} finally {
  cleanup();
}
