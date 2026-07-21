/**
 * Browser verify for factories child pages after Related / References footer
 * strip (repair-docs-strip-related-factories story 004).
 *
 * Proves on the representative `/docs/factories/configuration` route: no
 * Related To / References footer headings; no `#related` / `#references`;
 * How To Use + Factory Root schema teaching content still present; teaching
 * LocalizedLinkList targets still exposed (schema/API + Workers/Workstations/
 * Resources).
 *
 * Run with plain `bun` from repo cwd. Kills the local server on exit.
 *
 * Worktree note: Claude worktrees often resolve `next` from a parent
 * `node_modules`. Turbopack rejects that layout, so this probe starts
 * `next dev --webpack`. Prefer `FACTORIES_RELATED_STRIP_PROBE_BASE_URL` when a
 * server is already warm.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { launchPlaywrightBrowser } from "@/lib/verify/launch-playwright-browser";

const PORT = Number(process.env.FACTORIES_RELATED_STRIP_PROBE_PORT ?? "3691");
const PAGE_PATH = "/docs/factories/configuration";
const READY_TIMEOUT_MS = 180_000;
const PAGE_TIMEOUT_MS = 180_000;
const EXISTING_BASE_URL =
  process.env.FACTORIES_RELATED_STRIP_PROBE_BASE_URL?.trim();

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
        signal: AbortSignal.timeout(10_000),
      });
      if (response.ok || response.status === 500) return;
    } catch {
      // not ready
    }
    await Bun.sleep(1_000);
  }
  throw new Error(`Dev server not ready within ${timeoutMs}ms at ${url}`);
}

async function warmConfigurationPage(baseUrl: string): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < PAGE_TIMEOUT_MS) {
    try {
      const response = await fetch(`${baseUrl}${PAGE_PATH}`, {
        signal: AbortSignal.timeout(120_000),
      });
      if (response.ok) {
        const html = await response.text();
        if (
          !html.includes("Application error") &&
          html.includes('id="how-to-use"') &&
          html.includes('id="factory-root-schema"') &&
          !html.includes('id="related"') &&
          !html.includes('id="references"')
        ) {
          return;
        }
      }
    } catch {
      // still compiling
    }
    await Bun.sleep(2_000);
  }
  throw new Error(
    `${PAGE_PATH} did not warm with teaching sections and related/references absence within ${PAGE_TIMEOUT_MS}ms`,
  );
}

try {
  const baseUrl =
    EXISTING_BASE_URL && EXISTING_BASE_URL.length > 0
      ? EXISTING_BASE_URL.replace(/\/$/, "")
      : `http://127.0.0.1:${PORT}`;

  if (!EXISTING_BASE_URL) {
    // Webpack avoids Turbopack's worktree node_modules root restriction.
    server = spawn(
      "bun",
      ["./scripts/run-next.ts", "dev", "--webpack", "-p", String(PORT)],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          PORT: String(PORT),
          NODE_ENV: "development",
        },
        stdio: ["ignore", "pipe", "pipe"],
        detached: true,
      },
    );
    await waitForReady(baseUrl, READY_TIMEOUT_MS);
  }

  await warmConfigurationPage(baseUrl);

  const browser = await launchPlaywrightBrowser();
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    const response = await page.goto(`${baseUrl}${PAGE_PATH}`, {
      waitUntil: "domcontentloaded",
      timeout: PAGE_TIMEOUT_MS,
    });
    if (!response?.ok()) {
      throw new Error(
        `${PAGE_PATH}: expected HTTP 200, got ${response?.status() ?? "no response"}`,
      );
    }

    await page.waitForSelector("h1", { timeout: 60_000 });
    await page.waitForSelector(
      '[data-testid="factories-configuration-factory-root-schema"][data-schema-status="ready"]',
      { timeout: 60_000 },
    );

    const probe = await page.evaluate(() => {
      const headingText = (name: string) => {
        const headings = Array.from(
          document.querySelectorAll("h1, h2, h3, h4, h5, h6"),
        );
        return headings.some((el) =>
          new RegExp(`^\\s*${name}\\s*$`, "i").test(el.textContent ?? ""),
        );
      };

      const hrefForLinkName = (name: string) => {
        const links = Array.from(document.querySelectorAll("a"));
        const match = links.find((el) =>
          new RegExp(`^\\s*${name}\\s*$`, "i").test(el.textContent ?? ""),
        );
        return match?.getAttribute("href") ?? null;
      };

      const schemaEmbed = document.querySelector(
        '[data-testid="factories-configuration-factory-root-schema"]',
      );

      return {
        hasRelatedToHeading: headingText("Related To"),
        hasReferencesHeading: headingText("References"),
        relatedIdPresent: Boolean(document.getElementById("related")),
        referencesIdPresent: Boolean(document.getElementById("references")),
        howToUseIdPresent: Boolean(document.getElementById("how-to-use")),
        factoryRootSchemaIdPresent: Boolean(
          document.getElementById("factory-root-schema"),
        ),
        hasHowToUseHeading: headingText("How To Use"),
        hasFactoryRootSchemaHeading: headingText("Factory Root Properties"),
        schemaStatus: schemaEmbed?.getAttribute("data-schema-status") ?? null,
        workTypesFieldPresent: Boolean(
          schemaEmbed?.querySelector('[data-schema-field-path="workTypes"]'),
        ),
        fullSchemaHref: hrefForLinkName("Full Factory schema"),
        fullApiHref: hrefForLinkName("Factory API reference"),
        workersHref: hrefForLinkName("Workers"),
        workstationsHref: hrefForLinkName("Workstations"),
        resourcesHref: hrefForLinkName("Resources"),
      };
    });

    const failures: string[] = [];

    if (probe.hasRelatedToHeading || probe.relatedIdPresent) {
      failures.push("Related / Related To footer chrome still present");
    }
    if (probe.hasReferencesHeading || probe.referencesIdPresent) {
      failures.push("References footer chrome still present");
    }
    if (!probe.howToUseIdPresent || !probe.hasHowToUseHeading) {
      failures.push("How To Use teaching section missing");
    }
    if (
      !probe.factoryRootSchemaIdPresent ||
      !probe.hasFactoryRootSchemaHeading
    ) {
      failures.push("Factory Root schema teaching section missing");
    }
    if (probe.schemaStatus !== "ready" || !probe.workTypesFieldPresent) {
      failures.push(
        `Factory root schema embed not ready (status=${probe.schemaStatus}, workTypes=${probe.workTypesFieldPresent})`,
      );
    }
    if (probe.fullSchemaHref !== "/docs/references/schema") {
      failures.push(
        `Full Factory schema teaching link missing or wrong href (${probe.fullSchemaHref})`,
      );
    }
    if (probe.fullApiHref !== "/docs/references/api") {
      failures.push(
        `Factory API reference teaching link missing or wrong href (${probe.fullApiHref})`,
      );
    }
    if (probe.workersHref !== "/docs/workers") {
      failures.push(
        `Workers How To Use link missing or wrong href (${probe.workersHref})`,
      );
    }
    if (probe.workstationsHref !== "/docs/workstations") {
      failures.push(
        `Workstations How To Use link missing or wrong href (${probe.workstationsHref})`,
      );
    }
    if (probe.resourcesHref !== "/docs/documentation/resources") {
      failures.push(
        `Resources How To Use link missing or wrong href (${probe.resourcesHref})`,
      );
    }

    if (failures.length > 0) {
      console.error(JSON.stringify({ failures, probe }, null, 2));
      cleanup();
      process.exit(1);
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          baseUrl,
          port: EXISTING_BASE_URL ? null : PORT,
          path: PAGE_PATH,
          probe,
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
  }

  cleanup();
  process.exit(0);
} catch (error) {
  console.error(error);
  cleanup();
  process.exit(1);
}
