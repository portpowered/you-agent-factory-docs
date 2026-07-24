/**
 * Closeout story 005 browser verify — tip evidence that family replay surfaces
 * stay keyboard/touch operable, graph hosts stay page-contained on a11y suite
 * mobile/desktop widths, and representative family routes render without
 * React hydration mismatches.
 *
 * Preferred base: static export (`make build` → serve `out/`) via
 * `CLOSEOUT_A11Y_PROBE_BASE_URL`, or auto-serve a trusted local `out/`.
 * Worktree `next dev` often fails to hydrate client islands when
 * `node_modules` is hoisted at the parent checkout — static `out/` is the
 * reliable interactive path for this lane.
 *
 * Run with plain `bun` from repo cwd. Kills the local static server on exit.
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Page } from "playwright";
import { launchPlaywrightBrowser } from "@/lib/verify/launch-playwright-browser";
import { runStaticExportServerLifecycle } from "@/lib/verify/static-export-server-lifecycle";
import { PAGE_OVERFLOW_TOLERANCE_PX } from "./a11y-responsive-contract";
import {
  assertPackagedFactoryCloseoutNoHydrationMismatches,
  assertPackagedFactoryCloseoutPageContained,
  isPackagedFactoryCloseoutHydrationMismatchMessage,
  PACKAGED_FACTORY_CLOSEOUT_A11Y_FAMILY_ROUTES,
  PACKAGED_FACTORY_CLOSEOUT_GRAPH_CONTAINMENT_VIEWPORTS,
  PACKAGED_FACTORY_CLOSEOUT_PAUSE_CONTROL_NAME,
  PACKAGED_FACTORY_CLOSEOUT_PLAY_CONTROL_NAME,
  type PackagedFactoryCloseoutA11yFamilyRouteId,
} from "./packaged-factory-reference-family-closeout-a11y";

const PORT = Number(process.env.CLOSEOUT_A11Y_PROBE_PORT ?? "3624");
const PAGE_TIMEOUT_MS = 180_000;
const EXISTING_BASE_URL = process.env.CLOSEOUT_A11Y_PROBE_BASE_URL?.trim();
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
    "Closeout a11y probe: trusted out/ missing goal export — running make build…",
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

function attachHydrationCollectors(page: Page): {
  readonly messages: string[];
  readonly detach: () => void;
} {
  const messages: string[] = [];
  const onConsole = (msg: { type: () => string; text: () => string }) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      messages.push(msg.text());
    }
  };
  const onPageError = (error: Error) => {
    messages.push(error.message);
  };
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  return {
    messages,
    detach: () => {
      page.off("console", onConsole);
      page.off("pageerror", onPageError);
    },
  };
}

async function measureDocumentOverflow(page: Page): Promise<{
  clientWidth: number;
  scrollWidth: number;
  overflowPx: number;
}> {
  return page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const clientWidth = Math.max(root.clientWidth, body?.clientWidth ?? 0);
    const scrollWidth = Math.max(root.scrollWidth, body?.scrollWidth ?? 0);
    return {
      clientWidth,
      scrollWidth,
      overflowPx: Math.max(0, scrollWidth - clientWidth),
    };
  });
}

async function assertContainedAtCurrentViewport(
  page: Page,
  viewportId: (typeof PACKAGED_FACTORY_CLOSEOUT_GRAPH_CONTAINMENT_VIEWPORTS)[number]["id"],
  width: number,
): Promise<void> {
  const measured = await measureDocumentOverflow(page);
  assertPackagedFactoryCloseoutPageContained(
    {
      documentElement: {
        clientWidth: measured.clientWidth,
        scrollWidth: measured.scrollWidth,
      },
      body: {
        clientWidth: measured.clientWidth,
        scrollWidth: measured.scrollWidth,
      },
    },
    { id: viewportId, width },
    PAGE_OVERFLOW_TOLERANCE_PX,
  );
}

async function togglePlayPauseWithKeyboard(
  page: Page,
  replaySelector: string,
): Promise<void> {
  const replay = page.locator(replaySelector);
  await replay.waitFor({ state: "visible", timeout: PAGE_TIMEOUT_MS });
  if ((await replay.getAttribute("data-presentation-status")) !== "ready") {
    throw new Error(`Replay not ready for keyboard probe: ${replaySelector}`);
  }

  const play = replay.getByRole("button", {
    name: PACKAGED_FACTORY_CLOSEOUT_PLAY_CONTROL_NAME,
  });
  await play.waitFor({ state: "visible", timeout: 30_000 });
  await play.focus();
  await page.keyboard.press("Enter");
  await page.waitForSelector(`${replaySelector}[data-playing="true"]`, {
    timeout: 15_000,
  });

  const pause = replay.getByRole("button", {
    name: PACKAGED_FACTORY_CLOSEOUT_PAUSE_CONTROL_NAME,
  });
  await pause.focus();
  await page.keyboard.press("Space");
  await page.waitForSelector(`${replaySelector}[data-playing="false"]`, {
    timeout: 15_000,
  });
}

async function togglePlayPauseWithTouch(
  page: Page,
  replaySelector: string,
): Promise<void> {
  const replay = page.locator(replaySelector);
  const play = replay.getByRole("button", {
    name: PACKAGED_FACTORY_CLOSEOUT_PLAY_CONTROL_NAME,
  });
  await play.tap();
  await page.waitForSelector(`${replaySelector}[data-playing="true"]`, {
    timeout: 15_000,
  });
  const pause = replay.getByRole("button", {
    name: PACKAGED_FACTORY_CLOSEOUT_PAUSE_CONTROL_NAME,
  });
  await pause.tap();
  await page.waitForSelector(`${replaySelector}[data-playing="false"]`, {
    timeout: 15_000,
  });
}

async function visitFamilyRouteForHydration(
  page: Page,
  baseUrl: string,
  routeId: PackagedFactoryCloseoutA11yFamilyRouteId,
  path: string,
): Promise<void> {
  const collectors = attachHydrationCollectors(page);
  try {
    await page.goto(`${baseUrl}${path}`, {
      waitUntil: "domcontentloaded",
      timeout: PAGE_TIMEOUT_MS,
    });

    if (routeId === "home-youi") {
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
    } else if (routeId === "goal-child") {
      await page.locator("#nd-page").waitFor({
        state: "visible",
        timeout: PAGE_TIMEOUT_MS,
      });
      await page
        .locator('#nd-page [data-factory-replay-mode="full"]')
        .waitFor({ state: "visible", timeout: PAGE_TIMEOUT_MS });
    } else {
      await page.locator("#nd-page").waitFor({
        state: "visible",
        timeout: PAGE_TIMEOUT_MS,
      });
    }

    // Allow client hydration / island activation to settle before classifying.
    await page.waitForTimeout(1_500);
    assertPackagedFactoryCloseoutNoHydrationMismatches(
      routeId,
      collectors.messages,
    );
  } finally {
    collectors.detach();
  }
}

async function main(): Promise<void> {
  const baseUrl = await resolveBaseUrl();
  const browser = await launchPlaywrightBrowser();
  const hydrationByRoute: Record<string, true> = {};
  const containment: Array<{
    routeId: string;
    viewportId: string;
    width: number;
    overflowPx: number;
  }> = [];

  try {
    const desktop = await browser.newPage({
      viewport: { width: 1280, height: 720 },
      hasTouch: true,
    });
    desktop.setDefaultTimeout(PAGE_TIMEOUT_MS);
    await desktop.emulateMedia({ reducedMotion: "no-preference" });

    for (const route of PACKAGED_FACTORY_CLOSEOUT_A11Y_FAMILY_ROUTES) {
      await visitFamilyRouteForHydration(
        desktop,
        baseUrl,
        route.id,
        route.path,
      );
      hydrationByRoute[route.id] = true;
    }

    // --- Goal child: keyboard + timeline presence on desktop ---
    await desktop.goto(
      `${baseUrl}/docs/references/packaged-factories-index/goal`,
      {
        waitUntil: "domcontentloaded",
        timeout: PAGE_TIMEOUT_MS,
      },
    );
    const goalReplaySelector =
      '#nd-page [data-factory-replay-mode="full"][data-presentation-status="ready"]';
    await desktop.locator(goalReplaySelector).waitFor({
      state: "visible",
      timeout: PAGE_TIMEOUT_MS,
    });
    await desktop
      .locator(goalReplaySelector)
      .getByRole("slider", { name: "Select recorded tick" })
      .waitFor({ state: "visible", timeout: 30_000 });
    await togglePlayPauseWithKeyboard(desktop, goalReplaySelector);

    // --- Home Youi: keyboard on compact ---
    await desktop.goto(`${baseUrl}/`, {
      waitUntil: "domcontentloaded",
      timeout: PAGE_TIMEOUT_MS,
    });
    await desktop.locator("[data-youi-showcase]").scrollIntoViewIfNeeded();
    await desktop.waitForSelector(
      '[data-factory-replay-mode="compact"][data-presentation-status="ready"]',
      { timeout: PAGE_TIMEOUT_MS },
    );
    await togglePlayPauseWithKeyboard(
      desktop,
      '[data-factory-replay-mode="compact"][data-presentation-status="ready"]',
    );
    await desktop.close();

    // --- Mobile + wide containment + touch Play/Pause ---
    for (const viewport of PACKAGED_FACTORY_CLOSEOUT_GRAPH_CONTAINMENT_VIEWPORTS) {
      const page = await browser.newPage({
        viewport: { width: viewport.width, height: viewport.height },
        hasTouch: true,
      });
      page.setDefaultTimeout(PAGE_TIMEOUT_MS);
      await page.emulateMedia({ reducedMotion: "no-preference" });

      await page.goto(
        `${baseUrl}/docs/references/packaged-factories-index/goal`,
        {
          waitUntil: "domcontentloaded",
          timeout: PAGE_TIMEOUT_MS,
        },
      );
      await page.locator(goalReplaySelector).waitFor({
        state: "visible",
        timeout: PAGE_TIMEOUT_MS,
      });
      await page.locator(goalReplaySelector).scrollIntoViewIfNeeded();
      if (viewport.id === "mobile") {
        await togglePlayPauseWithTouch(page, goalReplaySelector);
      }
      await assertContainedAtCurrentViewport(page, viewport.id, viewport.width);
      const goalOverflow = await measureDocumentOverflow(page);
      containment.push({
        routeId: "goal-child",
        viewportId: viewport.id,
        width: viewport.width,
        overflowPx: goalOverflow.overflowPx,
      });

      await page.goto(`${baseUrl}/`, {
        waitUntil: "domcontentloaded",
        timeout: PAGE_TIMEOUT_MS,
      });
      await page.locator("[data-youi-showcase]").scrollIntoViewIfNeeded();
      await page.waitForSelector(
        '[data-factory-replay-mode="compact"][data-presentation-status="ready"]',
        { timeout: PAGE_TIMEOUT_MS },
      );
      const compactSelector =
        '[data-factory-replay-mode="compact"][data-presentation-status="ready"]';
      if (viewport.id === "mobile") {
        await togglePlayPauseWithTouch(page, compactSelector);
      }
      await assertContainedAtCurrentViewport(page, viewport.id, viewport.width);
      const homeOverflow = await measureDocumentOverflow(page);
      containment.push({
        routeId: "home-youi",
        viewportId: viewport.id,
        width: viewport.width,
        overflowPx: homeOverflow.overflowPx,
      });

      await page.goto(`${baseUrl}/docs/references/packaged-factories-index`, {
        waitUntil: "domcontentloaded",
        timeout: PAGE_TIMEOUT_MS,
      });
      await page.locator("#nd-page").waitFor({
        state: "visible",
        timeout: PAGE_TIMEOUT_MS,
      });
      await assertContainedAtCurrentViewport(page, viewport.id, viewport.width);

      await page.goto(
        `${baseUrl}/docs/references/packaged-factories-index/deep-research`,
        {
          waitUntil: "domcontentloaded",
          timeout: PAGE_TIMEOUT_MS,
        },
      );
      await page.locator("#nd-page").waitFor({
        state: "visible",
        timeout: PAGE_TIMEOUT_MS,
      });
      await assertContainedAtCurrentViewport(page, viewport.id, viewport.width);

      await page.close();
    }

    // Sanity: classifier still recognizes mismatch text (fail-closed path).
    if (
      !isPackagedFactoryCloseoutHydrationMismatchMessage(
        "Hydration failed because the server rendered HTML did not match",
      )
    ) {
      throw new Error("Hydration mismatch classifier regresssed");
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          baseUrl,
          servedFrom: EXISTING_BASE_URL ? "existing-base-url" : "static-export",
          hydrationByRoute,
          keyboardPlayPause: {
            goalFull: true,
            landingCompact: true,
          },
          touchPlayPauseMobile: {
            goalFull: true,
            landingCompact: true,
          },
          graphContainment: containment,
          pageOverflowTolerancePx: PAGE_OVERFLOW_TOLERANCE_PX,
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
