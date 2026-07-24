/**
 * Closeout story 003 browser verify — tip evidence that the goal child full
 * replay and landing Youi compact goal replay share Play/Pause controls, the
 * goal recording id, and the shared factory-replay host.
 *
 * Preferred base: static export (`make build` → serve `out/`) via
 * `CLOSEOUT_REPLAY_PROBE_BASE_URL`, or auto-serve a trusted local `out/`.
 * Worktree `next dev` often fails to hydrate client islands when
 * `node_modules` is hoisted at the parent checkout — static `out/` is the
 * reliable interactive path for this lane.
 *
 * Run with plain `bun` from repo cwd. Kills the local static server on exit.
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { launchPlaywrightBrowser } from "@/lib/verify/launch-playwright-browser";
import { runStaticExportServerLifecycle } from "@/lib/verify/static-export-server-lifecycle";
import { PACKAGED_FACTORY_CLOSEOUT_GOAL_RECORDING_ID } from "./packaged-factory-reference-family-closeout-replay";

const PORT = Number(process.env.CLOSEOUT_REPLAY_PROBE_PORT ?? "3623");
const GOAL_PATH = "/docs/references/packaged-factories-index/goal";
const HOME_PATH = "/";
const PAGE_TIMEOUT_MS = 180_000;
const EXISTING_BASE_URL = process.env.CLOSEOUT_REPLAY_PROBE_BASE_URL?.trim();
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
    "Closeout replay probe: trusted out/ missing goal export — running make build…",
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
    pollPath: GOAL_PATH,
  });
  if (lifecycle.status !== "pass") {
    throw new Error(
      `Static export server failed to start: ${lifecycle.reason}`,
    );
  }
  cleanupServer = lifecycle.session.cleanup;
  return lifecycle.baseUrl;
}

async function main(): Promise<void> {
  const baseUrl = await resolveBaseUrl();
  const browser = await launchPlaywrightBrowser();
  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 720 },
    });
    page.setDefaultTimeout(PAGE_TIMEOUT_MS);
    await page.emulateMedia({ reducedMotion: "no-preference" });

    // --- Goal child: full-mode shared replay ---
    await page.goto(`${baseUrl}${GOAL_PATH}`, {
      waitUntil: "domcontentloaded",
      timeout: PAGE_TIMEOUT_MS,
    });

    const goalPage = page.locator("#nd-page");
    await goalPage.waitFor({ state: "visible", timeout: PAGE_TIMEOUT_MS });
    const goalReplay = goalPage.locator('[data-factory-replay-mode="full"]');
    await goalReplay.waitFor({ state: "visible", timeout: PAGE_TIMEOUT_MS });
    if (
      (await goalReplay.getAttribute("data-presentation-status")) !== "ready"
    ) {
      throw new Error("Goal child full replay was not ready");
    }
    if ((await goalReplay.getAttribute("data-playing")) !== "false") {
      throw new Error("Goal child should start paused");
    }

    const goalPlay = goalReplay.getByRole("button", { name: "Play" });
    await goalPlay.waitFor({ state: "visible", timeout: 30_000 });
    await page.waitForFunction(() => {
      const button = document.querySelector(
        '#nd-page [data-factory-replay-mode="full"] button',
      );
      return button instanceof HTMLButtonElement && !button.disabled;
    });
    await goalPlay.click();
    await page.waitForSelector(
      '#nd-page [data-factory-replay-mode="full"][data-playing="true"]',
      { timeout: 15_000 },
    );
    await goalReplay.getByRole("button", { name: "Pause" }).click();
    await page.waitForSelector(
      '#nd-page [data-factory-replay-mode="full"][data-playing="false"]',
      { timeout: 15_000 },
    );

    // --- Home Youi: compact goal replay from the same recording ---
    await page.goto(`${baseUrl}${HOME_PATH}`, {
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
    await page.waitForSelector("[data-youi-compact-goal-replay-island]", {
      timeout: PAGE_TIMEOUT_MS,
    });
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

    const compactReplay = page.locator('[data-factory-replay-mode="compact"]');
    if ((await compactReplay.getAttribute("data-playing")) !== "false") {
      throw new Error("Landing compact replay should start paused");
    }
    await compactReplay.getByRole("button", { name: "Play" }).click();
    await page.waitForSelector(
      '[data-factory-replay-mode="compact"][data-playing="true"]',
      { timeout: 15_000 },
    );
    await compactReplay.getByRole("button", { name: "Pause" }).click();
    await page.waitForSelector(
      '[data-factory-replay-mode="compact"][data-playing="false"]',
      { timeout: 15_000 },
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          baseUrl,
          servedFrom: EXISTING_BASE_URL ? "existing-base-url" : "static-export",
          goalPath: GOAL_PATH,
          homePath: HOME_PATH,
          goalReplayMode: "full",
          landingReplayMode: "compact",
          sharedRecordingId: PACKAGED_FACTORY_CLOSEOUT_GOAL_RECORDING_ID,
          goalPlayPause: true,
          landingPlayPause: true,
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
