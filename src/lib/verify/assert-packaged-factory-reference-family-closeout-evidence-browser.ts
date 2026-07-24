/**
 * Closeout story 008 browser verify — tip evidence that the packaged-factory
 * reference family surfaces still behave as one family, plus a reproducible
 * evidence pack (tip SHA, repository gate outcomes, browser observations,
 * residual follow-ups / complete statement).
 *
 * Preferred base: static export (`make build` → serve `out/`) via
 * `CLOSEOUT_EVIDENCE_PROBE_BASE_URL`, or auto-serve a trusted local `out/`.
 * Worktree `next dev` often fails to hydrate client islands when
 * `node_modules` is hoisted at the parent checkout — static `out/` is the
 * reliable interactive path for this lane.
 *
 * Gate outcomes: pass `CLOSEOUT_EVIDENCE_GATE_OUTCOMES_JSON` (array of
 * `{ makeTarget, command, status, recordedAtUtc }`) or set
 * `CLOSEOUT_EVIDENCE_ASSUME_GATES_PASS=1` after the story 007 inventory is
 * already green on tip. Narrow integration fixes may be supplied via
 * `CLOSEOUT_EVIDENCE_INTEGRATION_FIXES_JSON` (string array).
 *
 * Run with plain `bun` from repo cwd. Kills the local static server on exit.
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { launchPlaywrightBrowser } from "@/lib/verify/launch-playwright-browser";
import { runStaticExportServerLifecycle } from "@/lib/verify/static-export-server-lifecycle";
import {
  PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_FORBIDDEN_SELECTORS,
  PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_REQUIRED_HREFS,
} from "./packaged-factory-reference-family-closeout-deep-research";
import {
  assertPackagedFactoryCloseoutEvidencePackIsComplete,
  buildPackagedFactoryCloseoutEvidencePack,
  buildPackagedFactoryCloseoutPassingGateOutcomes,
  listPackagedFactoryCloseoutEvidenceGateTargets,
  PACKAGED_FACTORY_CLOSEOUT_EVIDENCE_PURPOSE_SNIPPET,
  PACKAGED_FACTORY_CLOSEOUT_EVIDENCE_STANDARD_CHILDREN_FOR_REPLAY,
  PACKAGED_FACTORY_CLOSEOUT_EVIDENCE_USAGE_EXAMPLE,
  type PackagedFactoryCloseoutBrowserSurfaceObservation,
  type PackagedFactoryCloseoutGateOutcome,
  packagedFactoryCloseoutEvidenceChildPath,
} from "./packaged-factory-reference-family-closeout-evidence";
import { PACKAGED_FACTORY_CLOSEOUT_GOAL_RECORDING_ID } from "./packaged-factory-reference-family-closeout-replay";

const PORT = Number(process.env.CLOSEOUT_EVIDENCE_PROBE_PORT ?? "3627");
const PAGE_TIMEOUT_MS = 180_000;
const EXISTING_BASE_URL = process.env.CLOSEOUT_EVIDENCE_PROBE_BASE_URL?.trim();
const OUT_DIR = join(process.cwd(), "out");
const GOAL_EXPORT_HTML = join(
  OUT_DIR,
  "docs/references/packaged-factories-index/goal.html",
);
const GOAL_EXPORT_INDEX = join(
  OUT_DIR,
  "docs/references/packaged-factories-index/goal/index.html",
);

let cleanupServer: (() => Promise<void>) | undefined;

function cleanup() {
  if (cleanupServer) {
    void cleanupServer().catch(() => {});
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

function ensureStaticExport(): void {
  if (existsSync(GOAL_EXPORT_HTML) || existsSync(GOAL_EXPORT_INDEX)) {
    return;
  }
  console.log(
    "Closeout evidence probe: trusted out/ missing goal export — running make build…",
  );
  const result = spawnSync("make", ["build"], {
    cwd: process.cwd(),
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error("make build failed; cannot serve static export for probe");
  }
  if (!existsSync(GOAL_EXPORT_HTML) && !existsSync(GOAL_EXPORT_INDEX)) {
    throw new Error(
      `Expected goal export HTML under out/ after make build (looked for ${GOAL_EXPORT_HTML} or ${GOAL_EXPORT_INDEX})`,
    );
  }
}

async function resolveBaseUrl(): Promise<string> {
  if (EXISTING_BASE_URL) {
    return EXISTING_BASE_URL.replace(/\/$/, "");
  }

  ensureStaticExport();
  const lifecycle = await runStaticExportServerLifecycle({
    outDir: "out",
    cwd: process.cwd(),
    host: "127.0.0.1",
    port: PORT,
    pollPath: "/docs/references/packaged-factories-index/goal",
  });
  if (lifecycle.status !== "pass") {
    throw new Error(
      `Static export server failed to start: ${lifecycle.reason}`,
    );
  }
  cleanupServer = lifecycle.session.cleanup;
  return lifecycle.baseUrl;
}

function readTipCommitSha(): string {
  const fromEnv = process.env.CLOSEOUT_EVIDENCE_TIP_SHA?.trim();
  if (fromEnv) {
    return fromEnv.toLowerCase();
  }
  const result = spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error("Unable to resolve tip commit SHA via git rev-parse HEAD");
  }
  return result.stdout.trim().toLowerCase();
}

function utcNow(): string {
  return new Date().toISOString();
}

function resolveGateOutcomes(recordedAtUtc: string): {
  outcomes: PackagedFactoryCloseoutGateOutcome[];
  source: string;
} {
  const raw = process.env.CLOSEOUT_EVIDENCE_GATE_OUTCOMES_JSON?.trim();
  if (raw) {
    const parsed = JSON.parse(raw) as PackagedFactoryCloseoutGateOutcome[];
    return { outcomes: parsed, source: "env-json" };
  }
  if (process.env.CLOSEOUT_EVIDENCE_ASSUME_GATES_PASS === "1") {
    return {
      outcomes: buildPackagedFactoryCloseoutPassingGateOutcomes(recordedAtUtc),
      source: "assume-gates-pass",
    };
  }
  throw new Error(
    [
      "Closeout evidence probe requires gate outcomes.",
      "Set CLOSEOUT_EVIDENCE_GATE_OUTCOMES_JSON to the PRD gate inventory outcomes,",
      "or CLOSEOUT_EVIDENCE_ASSUME_GATES_PASS=1 after story 007 gates are green on tip.",
      `Expected targets: ${listPackagedFactoryCloseoutEvidenceGateTargets()
        .map((gate) => gate.makeTarget)
        .join(", ")}`,
    ].join(" "),
  );
}

function resolveIntegrationFixes(): string[] {
  const raw = process.env.CLOSEOUT_EVIDENCE_INTEGRATION_FIXES_JSON?.trim();
  if (!raw) {
    return [
      "launchPlaywrightBrowser CDP handshake retries (story 007 mergeability)",
    ];
  }
  return JSON.parse(raw) as string[];
}

async function togglePlayPause(
  page: import("playwright").Page,
  replaySelector: string,
): Promise<void> {
  const replay = page.locator(replaySelector);
  await replay.waitFor({ state: "visible", timeout: PAGE_TIMEOUT_MS });
  if ((await replay.getAttribute("data-presentation-status")) !== "ready") {
    throw new Error(`Replay not ready: ${replaySelector}`);
  }
  await replay.getByRole("button", { name: "Play" }).click();
  await page.waitForSelector(`${replaySelector}[data-playing="true"]`, {
    timeout: 15_000,
  });
  await replay.getByRole("button", { name: "Pause" }).click();
  await page.waitForSelector(`${replaySelector}[data-playing="false"]`, {
    timeout: 15_000,
  });
}

async function observeParentIndex(
  page: import("playwright").Page,
  baseUrl: string,
): Promise<PackagedFactoryCloseoutBrowserSurfaceObservation> {
  await page.goto(`${baseUrl}/docs/references/packaged-factories-index`, {
    waitUntil: "domcontentloaded",
    timeout: PAGE_TIMEOUT_MS,
  });
  const article = page.locator("#nd-page");
  await article.waitFor({ state: "visible", timeout: PAGE_TIMEOUT_MS });
  await page
    .locator('[data-packaged-factories-index=""]')
    .waitFor({ state: "visible", timeout: PAGE_TIMEOUT_MS });

  const orderedChildSlugs = await page
    .locator("[data-packaged-factory-entry]")
    .evaluateAll((nodes) =>
      nodes.map(
        (node) => node.getAttribute("data-packaged-factory-entry") ?? "",
      ),
    );
  const definitionPanelCount = await page
    .locator("[data-packaged-factory-definition-code]")
    .count();
  const childLinkCount = await page
    .locator("[data-packaged-factory-child-link]")
    .count();

  return {
    surfaceId: "parent-index",
    ok: true,
    orderedChildSlugs,
    definitionPanelCount,
    childLinkCount,
  };
}

async function observeStandardChildren(
  page: import("playwright").Page,
  baseUrl: string,
): Promise<PackagedFactoryCloseoutBrowserSurfaceObservation> {
  const children: {
    slug: (typeof PACKAGED_FACTORY_CLOSEOUT_EVIDENCE_STANDARD_CHILDREN_FOR_REPLAY)[number];
    path: string;
    replayMode: "full";
    playPause: true;
  }[] = [];

  for (const slug of PACKAGED_FACTORY_CLOSEOUT_EVIDENCE_STANDARD_CHILDREN_FOR_REPLAY) {
    const path = packagedFactoryCloseoutEvidenceChildPath(slug);
    await page.goto(`${baseUrl}${path}`, {
      waitUntil: "domcontentloaded",
      timeout: PAGE_TIMEOUT_MS,
    });
    await page.locator("#nd-page").waitFor({
      state: "visible",
      timeout: PAGE_TIMEOUT_MS,
    });
    const replaySelector =
      '#nd-page [data-factory-replay-mode="full"][data-presentation-status="ready"]';
    await page.locator(replaySelector).waitFor({
      state: "visible",
      timeout: PAGE_TIMEOUT_MS,
    });
    await togglePlayPause(page, replaySelector);
    children.push({
      slug,
      path,
      replayMode: "full",
      playPause: true,
    });
  }

  return {
    surfaceId: "standard-child-replay",
    ok: true,
    children,
  };
}

async function observeDeepResearch(
  page: import("playwright").Page,
  baseUrl: string,
): Promise<PackagedFactoryCloseoutBrowserSurfaceObservation> {
  await page.goto(
    `${baseUrl}/docs/references/packaged-factories-index/deep-research`,
    {
      waitUntil: "domcontentloaded",
      timeout: PAGE_TIMEOUT_MS,
    },
  );
  const ndPage = page.locator("#nd-page");
  await ndPage.waitFor({ state: "visible", timeout: PAGE_TIMEOUT_MS });

  const purposeVisible = await ndPage
    .getByText(PACKAGED_FACTORY_CLOSEOUT_EVIDENCE_PURPOSE_SNIPPET, {
      exact: false,
    })
    .isVisible();
  const usageExampleVisible = await ndPage
    .getByText(PACKAGED_FACTORY_CLOSEOUT_EVIDENCE_USAGE_EXAMPLE, {
      exact: false,
    })
    .isVisible();
  if (!purposeVisible || !usageExampleVisible) {
    throw new Error(
      "Deep-research child missing purpose snippet or usage example",
    );
  }

  const javascriptRuntimeHref = await ndPage
    .getByRole("link", { name: "JavaScript Runtime" })
    .getAttribute("href");
  const dynamicWorkflowsHref = await ndPage
    .getByRole("link", { name: "Dynamic Workflows" })
    .getAttribute("href");

  const forbiddenSelectorHits: string[] = [];
  for (const selector of PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_FORBIDDEN_SELECTORS) {
    if ((await ndPage.locator(selector).count()) > 0) {
      forbiddenSelectorHits.push(selector);
    }
  }

  const normalizeHref = (href: string | null): string => {
    if (!href) return "";
    // Strip optional Pages base-path prefix for contract compare.
    const markerJs =
      PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_REQUIRED_HREFS.javascriptRuntime;
    const markerDw =
      PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_REQUIRED_HREFS.dynamicWorkflows;
    if (href.endsWith(markerJs) || href.includes(`${markerJs}`)) {
      return markerJs;
    }
    if (href.endsWith(markerDw) || href.includes(`${markerDw}`)) {
      return markerDw;
    }
    return href;
  };

  return {
    surfaceId: "deep-research-child",
    ok: true,
    purposeVisible: true,
    usageExampleVisible: true,
    javascriptRuntimeHref: normalizeHref(javascriptRuntimeHref),
    dynamicWorkflowsHref: normalizeHref(dynamicWorkflowsHref),
    forbiddenSelectorHits,
  };
}

async function observeHomeYoui(
  page: import("playwright").Page,
  baseUrl: string,
): Promise<PackagedFactoryCloseoutBrowserSurfaceObservation> {
  await page.goto(`${baseUrl}/`, {
    waitUntil: "domcontentloaded",
    timeout: PAGE_TIMEOUT_MS,
  });
  await page.waitForSelector("[data-youi-showcase]", {
    timeout: PAGE_TIMEOUT_MS,
  });
  await page.locator("[data-youi-showcase]").scrollIntoViewIfNeeded();
  await page.waitForSelector(
    '[data-youi-compact-goal-replay-activated="true"]',
    { timeout: PAGE_TIMEOUT_MS },
  );
  await page.waitForSelector(
    '[data-factory-replay-mode="compact"][data-presentation-status="ready"]',
    { timeout: PAGE_TIMEOUT_MS },
  );

  const island = page.locator("[data-youi-compact-goal-replay-island]");
  const recordingId = await island.getAttribute(
    "data-youi-compact-goal-recording-id",
  );
  if (recordingId !== PACKAGED_FACTORY_CLOSEOUT_GOAL_RECORDING_ID) {
    throw new Error(
      `Expected landing recording id ${PACKAGED_FACTORY_CLOSEOUT_GOAL_RECORDING_ID}, got ${recordingId}`,
    );
  }

  await togglePlayPause(
    page,
    '[data-factory-replay-mode="compact"][data-presentation-status="ready"]',
  );

  return {
    surfaceId: "home-youi",
    ok: true,
    compactReplayActivated: true,
    playPause: true,
    recordingId: PACKAGED_FACTORY_CLOSEOUT_GOAL_RECORDING_ID,
  };
}

async function main(): Promise<void> {
  const recordedAtUtc = utcNow();
  const tipCommitSha = readTipCommitSha();
  const { outcomes: gateOutcomes, source: gateSource } =
    resolveGateOutcomes(recordedAtUtc);
  const narrowIntegrationFixes = resolveIntegrationFixes();

  const baseUrl = await resolveBaseUrl();
  const browser = await launchPlaywrightBrowser();
  const browserSurfaces: PackagedFactoryCloseoutBrowserSurfaceObservation[] =
    [];

  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 720 },
    });
    page.setDefaultTimeout(PAGE_TIMEOUT_MS);
    await page.emulateMedia({ reducedMotion: "no-preference" });

    browserSurfaces.push(await observeParentIndex(page, baseUrl));
    browserSurfaces.push(await observeStandardChildren(page, baseUrl));
    browserSurfaces.push(await observeDeepResearch(page, baseUrl));
    browserSurfaces.push(await observeHomeYoui(page, baseUrl));
    await page.close();

    const pack = buildPackagedFactoryCloseoutEvidencePack({
      tipCommitSha,
      recordedAtUtc,
      gateOutcomes,
      browserSurfaces,
      narrowIntegrationFixes,
      residualFollowUps: [],
    });
    assertPackagedFactoryCloseoutEvidencePackIsComplete(pack);

    console.log(
      JSON.stringify(
        {
          ok: true,
          baseUrl,
          servedFrom: EXISTING_BASE_URL ? "existing-base-url" : "static-export",
          gateOutcomeSource: gateSource,
          evidencePack: pack,
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (cleanupServer) {
      await cleanupServer().catch(() => {});
      cleanupServer = undefined;
    }
  });
