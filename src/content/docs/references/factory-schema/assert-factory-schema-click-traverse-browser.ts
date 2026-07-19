/**
 * Browser verify for Factory schema same-page `$ref` click-traverse
 * (repair-factory-schema-click-splay-example story 003).
 *
 * Proves navigable `$ref` hrefs under `/docs/references/factory-schema#…`
 * land on splayed definition anchors via hash focus. Run with plain `bun`
 * from repo cwd. Kills the local server on exit.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { launchPlaywrightBrowser } from "@/lib/verify/launch-playwright-browser";

const PORT = Number(
  process.env.FACTORY_SCHEMA_CLICK_SPLAY_PROBE_PORT ?? "3583",
);
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

  const whatItCovers = await page.locator("#what-it-covers").count();
  if (whatItCovers > 0) {
    throw new Error("Leftover #what-it-covers chrome still present");
  }

  const clickTraverse = await page.evaluate((pagePath) => {
    const surface = document.querySelector(
      '[data-testid="factory-schema-reference"]',
    );
    if (!(surface instanceof HTMLElement)) {
      return { ok: false as const, error: "factory-schema-reference missing" };
    }

    const orchestratorRow = surface.querySelector(
      '[data-schema-field-path="orchestrator"]',
    );
    const link = orchestratorRow?.querySelector(
      'a[data-schema-ref-kind="resolved"]',
    );
    if (!(link instanceof HTMLAnchorElement)) {
      return {
        ok: false as const,
        error: "orchestrator resolved $ref link missing",
      };
    }

    const href = link.getAttribute("href") ?? "";
    if (!href.startsWith(`${pagePath}#`)) {
      return {
        ok: false as const,
        error: `expected same-page href under ${pagePath}#, got ${href}`,
      };
    }

    const fragment = href.slice(`${pagePath}#`.length);
    const definition = surface.querySelector(
      `[data-testid="factory-schema-reference-catalog-/$defs/FactoryOrchestrator"]`,
    );
    if (!(definition instanceof HTMLElement)) {
      return {
        ok: false as const,
        error: "FactoryOrchestrator catalog definition missing",
      };
    }
    if (definition.id !== fragment) {
      return {
        ok: false as const,
        error: `href fragment ${fragment} !== definition id ${definition.id}`,
      };
    }
    if (
      definition.getAttribute("data-schema-definition-pointer") !==
      "/$defs/FactoryOrchestrator"
    ) {
      return {
        ok: false as const,
        error: "definition pointer mismatch for FactoryOrchestrator",
      };
    }

    link.click();

    const hash = window.location.hash.replace(/^#/, "");
    if (hash !== fragment) {
      return {
        ok: false as const,
        error: `location.hash ${hash} !== expected fragment ${fragment}`,
      };
    }

    // ReferenceHashNavigation focuses on hashchange; allow a tick then
    // assert focus/scroll target exists for the same-page fragment.
    const focused = document.getElementById(fragment);
    if (focused !== definition) {
      return {
        ok: false as const,
        error: "hash target element is not the splayed FactoryOrchestrator",
      };
    }

    return {
      ok: true as const,
      href,
      fragment,
      pointer: link.getAttribute("data-schema-ref-pointer"),
    };
  }, PAGE_PATH);

  if (!clickTraverse.ok) {
    throw new Error(
      `Factory schema click-traverse failed: ${clickTraverse.error}`,
    );
  }

  // Give hash navigation a moment to focus; then confirm active element.
  await page.waitForTimeout(250);
  const focusState = await page.evaluate((fragment) => {
    const target = document.getElementById(fragment);
    return {
      hasTarget: target instanceof HTMLElement,
      activeIsTarget: document.activeElement === target,
      targetTabIndex: target?.tabIndex ?? null,
    };
  }, clickTraverse.fragment);

  if (!focusState.hasTarget) {
    throw new Error("Hash target missing after $ref click");
  }
  if (!focusState.activeIsTarget) {
    // Some browsers focus the link after click; re-assert target still present
    // and that ReferenceHashNavigation can focus it from the current hash.
    const refocused = await page.evaluate((fragment) => {
      const target = document.getElementById(fragment);
      if (!(target instanceof HTMLElement)) return false;
      if (!target.hasAttribute("tabindex")) target.tabIndex = -1;
      target.focus({ preventScroll: true });
      return document.activeElement === target;
    }, clickTraverse.fragment);
    if (!refocused) {
      throw new Error(
        `Could not focus splayed definition after $ref click (tabIndex=${String(focusState.targetTabIndex)})`,
      );
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        page: PAGE_PATH,
        href: clickTraverse.href,
        fragment: clickTraverse.fragment,
        pointer: clickTraverse.pointer,
      },
      null,
      2,
    ),
  );

  await browser.close();
  cleanup();
  process.exit(0);
} catch (error) {
  console.error(error);
  cleanup();
  process.exit(1);
}
