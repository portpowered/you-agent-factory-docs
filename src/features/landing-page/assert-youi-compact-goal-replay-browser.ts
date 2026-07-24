/**
 * Browser probe for home-route Youi compact goal replay
 * (landing-youi-compact-goal-replay-v2-005).
 *
 * Proves on `/`:
 * - Before near-viewport activation: monkey background, fixed geometry, and
 *   semantic/static graph fallback remain visible (no blank foreground hole);
 *   the compact island is not mounted yet.
 * - After scrolling Youi near the viewport: compact goal replay activates with
 *   topology, selected tick / timeline position, and Play/Pause.
 * - Play/Pause toggles `data-playing`; tick/timeline chrome stays visible while
 *   playing (goal sample is a single tick — position stays at 0).
 *
 * Run with plain `bun` from repo cwd. Kills the local server on exit.
 *
 * Preferred base: static export (`make build` → serve `out/`) via
 * `YOUI_COMPACT_GOAL_REPLAY_PROBE_BASE_URL`. Worktree `next dev` can fail to
 * hydrate client islands when `node_modules` is hoisted at the parent checkout;
 * static `out/` is the reliable home-route browser path for this lane.
 */

import { type ChildProcess, spawn } from "node:child_process";
import {
  closePlaywrightBrowserWithTimeout,
  launchPlaywrightBrowser,
} from "@/lib/verify/launch-playwright-browser";
import {
  evaluateYouiCompactGoalReplayBrowserEvidence,
  type YouiCompactGoalReplayActivatedSnapshot,
  type YouiCompactGoalReplayPlaybackSnapshot,
  type YouiCompactGoalReplayPreActivationSnapshot,
} from "./youi-compact-goal-replay-browser-contract";

const PORT = Number(process.env.YOUI_COMPACT_GOAL_REPLAY_PROBE_PORT ?? "3724");
const PAGE_PATH = "/";
const READY_TIMEOUT_MS = 180_000;
const PAGE_TIMEOUT_MS = 180_000;
const EXISTING_BASE_URL =
  process.env.YOUI_COMPACT_GOAL_REPLAY_PROBE_BASE_URL?.trim();

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

async function warmHomePage(baseUrl: string): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < PAGE_TIMEOUT_MS) {
    try {
      const response = await fetch(`${baseUrl}${PAGE_PATH}`, {
        signal: AbortSignal.timeout(120_000),
      });
      if (response.ok) {
        const html = await response.text();
        if (
          html.includes('data-youi-showcase=""') &&
          html.includes('data-youi-showcase-graph-fallback=""') &&
          html.includes('data-youi-compact-goal-replay-near-viewport=""')
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
    `Home page did not warm with Youi showcase markers within ${PAGE_TIMEOUT_MS}ms`,
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

  await warmHomePage(baseUrl);

  const browser = await launchPlaywrightBrowser();
  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 720 },
    });
    await page.emulateMedia({ reducedMotion: "no-preference" });

    await page.goto(`${baseUrl}${PAGE_PATH}`, {
      waitUntil: "domcontentloaded",
      timeout: PAGE_TIMEOUT_MS,
    });

    await page.waitForSelector("[data-youi-showcase]", {
      timeout: PAGE_TIMEOUT_MS,
    });

    // Home composition places Youi after hero/capability/carousel — park at top
    // so the near-viewport gate has not activated yet. Do not mutate React DOM.
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await page.waitForFunction(
      () => {
        const showcase = document.querySelector("[data-youi-showcase]");
        const gate = document.querySelector(
          "[data-youi-compact-goal-replay-near-viewport]",
        );
        if (!(showcase instanceof HTMLElement) || !gate) return false;
        const rect = showcase.getBoundingClientRect();
        const nearBand = window.innerHeight + 250;
        return (
          rect.top > nearBand &&
          gate.getAttribute("data-youi-compact-goal-replay-activated") ===
            "false"
        );
      },
      { timeout: 60_000 },
    );

    const preActivation = await page.evaluate(
      (): YouiCompactGoalReplayPreActivationSnapshot => {
        const showcase = document.querySelector("[data-youi-showcase]");
        const content = document.querySelector("[data-youi-showcase-content]");
        const foreground = document.querySelector(
          "[data-youi-showcase-foreground]",
        );
        const gate = document.querySelector(
          "[data-youi-compact-goal-replay-near-viewport]",
        );
        return {
          showcasePresent: Boolean(showcase),
          monkeyBackgroundPresent: Boolean(
            document.querySelector("[data-youi-showcase-background]"),
          ),
          fallbackPresent: Boolean(
            document.querySelector("[data-youi-showcase-graph-fallback]"),
          ),
          activated:
            gate?.getAttribute("data-youi-compact-goal-replay-activated") ??
            null,
          islandPresent: Boolean(
            document.querySelector("[data-youi-compact-goal-replay-island]"),
          ),
          foregroundHostHeight:
            foreground instanceof HTMLElement
              ? foreground.getBoundingClientRect().height
              : 0,
          contentClassName:
            content instanceof HTMLElement ? content.className : null,
          foregroundClassName:
            foreground instanceof HTMLElement ? foreground.className : null,
        };
      },
    );

    // Scroll the showcase into the near-viewport activation band.
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

    const activated = await page.evaluate(
      (): YouiCompactGoalReplayActivatedSnapshot => {
        const content = document.querySelector("[data-youi-showcase-content]");
        const foreground = document.querySelector(
          "[data-youi-showcase-foreground]",
        );
        const gate = document.querySelector(
          "[data-youi-compact-goal-replay-near-viewport]",
        );
        const island = document.querySelector(
          "[data-youi-compact-goal-replay-island]",
        );
        const replay = document.querySelector(
          '[data-factory-replay-mode="compact"]',
        );
        const playButton = Array.from(document.querySelectorAll("button")).find(
          (button) => (button.textContent ?? "").trim() === "Play",
        );
        const topology = document.querySelector(
          '[aria-label="Factory topology"]',
        );
        const workProgress = document.querySelector(
          '[aria-label="Work progress"]',
        );
        const bodyText = document.body.textContent ?? "";
        return {
          activated:
            gate?.getAttribute("data-youi-compact-goal-replay-activated") ??
            null,
          islandPresent: Boolean(island),
          recordingId:
            island?.getAttribute("data-youi-compact-goal-recording-id") ?? null,
          replayMode: replay?.getAttribute("data-factory-replay-mode") ?? null,
          topologyRegionVisible: Boolean(topology),
          playButtonVisible: Boolean(playButton),
          selectedTickLabelVisible: bodyText.includes("Selected tick"),
          timelinePositionLabelVisible: /Tick \d+ of \d+/.test(bodyText),
          selectedTick: replay?.getAttribute("data-selected-tick") ?? null,
          playing: replay?.getAttribute("data-playing") ?? null,
          progressVisible:
            replay?.getAttribute("data-progress-visible") ?? null,
          workProgressRegionVisible: Boolean(workProgress),
          monkeyBackgroundPresent: Boolean(
            document.querySelector("[data-youi-showcase-background]"),
          ),
          fallbackPresent: Boolean(
            document.querySelector("[data-youi-showcase-graph-fallback]"),
          ),
          contentClassName:
            content instanceof HTMLElement ? content.className : null,
          foregroundClassName:
            foreground instanceof HTMLElement ? foreground.className : null,
        };
      },
    );

    const playButton = page.getByRole("button", { name: "Play" });
    await playButton.click();
    await page.waitForSelector(
      '[data-factory-replay-mode="compact"][data-playing="true"]',
      { timeout: 15_000 },
    );

    const whilePlaying = await page.evaluate(() => {
      const replay = document.querySelector(
        '[data-factory-replay-mode="compact"]',
      );
      const bodyText = document.body.textContent ?? "";
      return {
        playing: replay?.getAttribute("data-playing") ?? null,
        selectedTick: replay?.getAttribute("data-selected-tick") ?? null,
        selectedTickLabelVisible: bodyText.includes("Selected tick"),
        timelinePositionLabelVisible: /Tick \d+ of \d+/.test(bodyText),
      };
    });

    const pauseButton = page.getByRole("button", { name: "Pause" });
    await pauseButton.click();
    await page.waitForSelector(
      '[data-factory-replay-mode="compact"][data-playing="false"]',
      { timeout: 15_000 },
    );

    const afterPause = await page.evaluate(() => {
      const replay = document.querySelector(
        '[data-factory-replay-mode="compact"]',
      );
      return replay?.getAttribute("data-playing") ?? null;
    });

    const playback: YouiCompactGoalReplayPlaybackSnapshot = {
      playingAfterPlay: whilePlaying.playing,
      playingAfterPause: afterPause,
      selectedTickWhilePlaying: whilePlaying.selectedTick,
      selectedTickLabelWhilePlaying: whilePlaying.selectedTickLabelVisible,
      timelinePositionLabelWhilePlaying:
        whilePlaying.timelinePositionLabelVisible,
    };

    const failures = evaluateYouiCompactGoalReplayBrowserEvidence({
      preActivation,
      activated,
      playback,
    });

    if (failures.length > 0) {
      console.error("Youi compact goal replay browser probe failed:");
      for (const failure of failures) {
        console.error(`- ${failure}`);
      }
      console.error(
        JSON.stringify({ preActivation, activated, playback }, null, 2),
      );
      process.exitCode = 1;
    } else {
      console.log(
        "Youi compact goal replay browser probe passed on / (near-viewport activation + Play/Pause + shell).",
      );
    }
  } finally {
    await closePlaywrightBrowserWithTimeout(browser);
  }
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  cleanup();
}
