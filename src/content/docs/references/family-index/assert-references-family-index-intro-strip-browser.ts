/**
 * Browser verify for `/docs/references` after stripping What this family covers
 * (repair-references-family-index-intro-strip story 003).
 *
 * Proves: no introduction chrome; short openingSummary purpose lead; Package
 * freshness + Contract surfaces cards; System configuration schema →
 * `/docs/references/system-config-schema` (#177); no you-config revival; no
 * empty-collection copy.
 *
 * Run with plain `bun` from repo cwd. Kills the local server on exit.
 *
 * Worktree note: Claude worktrees often resolve `next` from a parent
 * `node_modules`. Turbopack rejects that layout, so this probe starts
 * `next dev --webpack`. Prefer `REFERENCES_FAMILY_INDEX_INTRO_STRIP_PROBE_BASE_URL`
 * when a server is already warm.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { launchPlaywrightBrowser } from "@/lib/verify/launch-playwright-browser";
import { REFERENCE_FAMILY_DISCOVERABILITY_ROUTES } from "./reference-family-routes";

const PORT = Number(
  process.env.REFERENCES_FAMILY_INDEX_INTRO_STRIP_PROBE_PORT ?? "3589",
);
const PAGE_PATH = "/docs/references";
const READY_TIMEOUT_MS = 180_000;
const PAGE_TIMEOUT_MS = 180_000;
const EXISTING_BASE_URL =
  process.env.REFERENCES_FAMILY_INDEX_INTRO_STRIP_PROBE_BASE_URL?.trim();

const EXPECTED_HREFS = REFERENCE_FAMILY_DISCOVERABILITY_ROUTES.map(
  (route) => route.href,
);

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

async function warmFamilyIndexPage(baseUrl: string): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < PAGE_TIMEOUT_MS) {
    try {
      const response = await fetch(`${baseUrl}${PAGE_PATH}`, {
        signal: AbortSignal.timeout(120_000),
      });
      if (response.ok) {
        const html = await response.text();
        if (
          html.includes("data-references-family-index") &&
          html.includes("data-references-family-discoverability")
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
    `References family index did not warm with markers within ${PAGE_TIMEOUT_MS}ms`,
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

  await warmFamilyIndexPage(baseUrl);

  const browser = await launchPlaywrightBrowser();
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    await page.goto(`${baseUrl}${PAGE_PATH}`, {
      waitUntil: "domcontentloaded",
      timeout: PAGE_TIMEOUT_MS,
    });

    await page.waitForSelector("[data-references-family-index]", {
      timeout: PAGE_TIMEOUT_MS,
    });
    await page.waitForSelector("[data-references-family-discoverability]", {
      timeout: 60_000,
    });
    await page.waitForSelector("[data-references-family-freshness]", {
      timeout: 60_000,
    });

    const probe = await page.evaluate((expectedHrefs: string[]) => {
      const headingText = (name: string) => {
        const headings = Array.from(
          document.querySelectorAll("h1, h2, h3, h4, h5, h6"),
        );
        return headings.some((el) =>
          new RegExp(`^\\s*${name}\\s*$`, "i").test(el.textContent ?? ""),
        );
      };

      const root = document.querySelector("[data-references-family-index]");
      // Scope visible-copy checks to the authored family index — Next may still
      // embed referencesIndex.emptyTitle in RSC/payload chrome elsewhere.
      const indexText = root?.textContent ?? "";
      const purposeLead =
        root?.querySelector(":scope > p")?.textContent?.trim() ?? "";

      const discoverabilityLinks = Array.from(
        document.querySelectorAll(
          "[data-references-family-discoverability-list] a[href]",
        ),
      ) as HTMLAnchorElement[];
      const hrefs = discoverabilityLinks.map(
        (a) => a.getAttribute("href") ?? "",
      );

      const systemConfigLink = discoverabilityLinks.find((a) =>
        (a.getAttribute("href") ?? "").endsWith(
          "/docs/references/system-config-schema",
        ),
      );

      return {
        hasFamilyIndex: Boolean(root),
        hasIntroductionMarker: Boolean(
          document.querySelector("[data-references-family-introduction]"),
        ),
        introductionIdPresent: Boolean(document.getElementById("introduction")),
        hasWhatThisFamilyCoversHeading: headingText("What this family covers"),
        hasJapaneseIntroHeading: headingText("このファミリーが扱うこと"),
        purposeLead,
        hasContractSurfacesHeading: headingText("Contract surfaces"),
        hasPackageFreshnessHeading: headingText("Package freshness"),
        hasDiscoverability: Boolean(
          document.querySelector("[data-references-family-discoverability]"),
        ),
        hasFreshness: Boolean(
          document.querySelector("[data-references-family-freshness]"),
        ),
        contractSurfacesIdPresent: Boolean(
          document.getElementById("contract-surfaces"),
        ),
        packageFreshnessIdPresent: Boolean(
          document.getElementById("package-freshness"),
        ),
        hrefs,
        missingExpectedHrefs: expectedHrefs.filter(
          (href) => !hrefs.includes(href),
        ),
        systemConfigLabel:
          systemConfigLink?.querySelector("span")?.textContent?.trim() ??
          systemConfigLink?.textContent?.trim() ??
          "",
        systemConfigHref: systemConfigLink?.getAttribute("href") ?? null,
        hasYouConfigHref: hrefs.some((href) => /you-config/i.test(href)),
        hasYouConfigText: /you-config/i.test(indexText),
        hasEmptyCollectionCopy: /No reference entries yet/i.test(indexText),
        hasEmptyStateMarker: Boolean(
          document.querySelector(
            "[data-docs-index-empty], [data-section-collection-empty]",
          ),
        ),
      };
    }, EXPECTED_HREFS);

    const failures: string[] = [];
    if (!probe.hasFamilyIndex) {
      failures.push("data-references-family-index missing");
    }
    if (probe.hasIntroductionMarker || probe.introductionIdPresent) {
      failures.push("introduction chrome still present");
    }
    if (probe.hasWhatThisFamilyCoversHeading || probe.hasJapaneseIntroHeading) {
      failures.push("What this family covers heading still present");
    }
    if (!probe.purposeLead || probe.purposeLead.length < 20) {
      failures.push("openingSummary purpose lead missing or too short");
    }
    if (
      !probe.hasContractSurfacesHeading ||
      !probe.hasDiscoverability ||
      !probe.contractSurfacesIdPresent
    ) {
      failures.push("Contract surfaces section missing");
    }
    if (
      !probe.hasPackageFreshnessHeading ||
      !probe.hasFreshness ||
      !probe.packageFreshnessIdPresent
    ) {
      failures.push("Package freshness section missing");
    }
    if (probe.missingExpectedHrefs.length > 0) {
      failures.push(
        `missing discoverability hrefs: ${probe.missingExpectedHrefs.join(", ")}`,
      );
    }
    if (probe.hrefs.length !== EXPECTED_HREFS.length) {
      failures.push(
        `expected ${EXPECTED_HREFS.length} discoverability cards, got ${probe.hrefs.length}`,
      );
    }
    if (
      !/System configuration schema/i.test(probe.systemConfigLabel) ||
      probe.systemConfigHref !== "/docs/references/system-config-schema"
    ) {
      failures.push(
        "System configuration schema card labeling/#177 href missing",
      );
    }
    if (probe.hasYouConfigHref || probe.hasYouConfigText) {
      failures.push("you-config route or label revived");
    }
    if (probe.hasEmptyCollectionCopy || probe.hasEmptyStateMarker) {
      failures.push("empty-collection copy appeared");
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
