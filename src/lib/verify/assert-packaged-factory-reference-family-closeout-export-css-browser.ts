/**
 * Closeout story 006 browser verify — tip evidence that family surfaces stay
 * useful without JavaScript, Pages-prefixed export resolves family routes, and
 * CSS/React Flow stylesheet contracts remain green on tip.
 *
 * Preferred path:
 * 1. Prove CSS + no-JS against trusted static `out/` (port 3625 / env override).
 * 2. Run `GITHUB_PAGES_BASE_PATH=/you-agent-factory-docs make build`, prove
 *    family routes under the prefix, then restore unprefixed `make build` so
 *    later closeout probes keep working.
 *
 * Set `CLOSEOUT_EXPORT_CSS_PROBE_BASE_URL` to reuse a warm static server for
 * the no-JS browser pass. Set `CLOSEOUT_SKIP_PAGES_PREFIXED_BUILD=1` only when
 * a trusted Pages-prefixed `out/` is already present and should not be rebuilt.
 *
 * Run with plain `bun` from repo cwd. Kills the local static server on exit.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { resolveExportHtmlFilePath } from "@/lib/build/export-out-directory";
import { launchPlaywrightBrowser } from "@/lib/verify/launch-playwright-browser";
import { runStaticExportServerLifecycle } from "@/lib/verify/static-export-server-lifecycle";
import { stripScriptsFromHtml } from "./a11y-reference-no-js-html-contract";
import {
  assertPackagedFactoryCloseoutNoJsRoute,
  isPackagedFactoryCloseoutPagesPrefixedExportHtml,
  PACKAGED_FACTORY_CLOSEOUT_BASE_PATH_FAMILY_ROUTES,
  PACKAGED_FACTORY_CLOSEOUT_NO_JS_ROUTES,
  PACKAGED_FACTORY_CLOSEOUT_PAGES_BASE_PATH,
  provePackagedFactoryCloseoutBasePathExport,
  provePackagedFactoryCloseoutVisualizerThemeTokens,
  provePackagedFactoryReferenceFamilyCloseoutExportCss,
} from "./packaged-factory-reference-family-closeout-export-css";

const PORT = Number(process.env.CLOSEOUT_EXPORT_CSS_PROBE_PORT ?? "3625");
const PAGE_TIMEOUT_MS = 180_000;
const EXISTING_BASE_URL =
  process.env.CLOSEOUT_EXPORT_CSS_PROBE_BASE_URL?.trim();
const SKIP_PAGES_PREFIXED_BUILD =
  process.env.CLOSEOUT_SKIP_PAGES_PREFIXED_BUILD?.trim() === "1";
const OUT_DIR = join(process.cwd(), "out");
const INDEX_EXPORT_HTML = join(
  OUT_DIR,
  "docs/references/packaged-factories-index/index.html",
);
const INDEX_EXPORT_FLAT = join(
  OUT_DIR,
  "docs/references/packaged-factories-index.html",
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

function runMakeBuild(env: NodeJS.ProcessEnv = process.env): void {
  const result = spawnSync("make", ["build"], {
    cwd: process.cwd(),
    stdio: "inherit",
    env,
  });
  if (result.status !== 0) {
    throw new Error("make build failed");
  }
}

function ensureStaticExport(): void {
  if (existsSync(INDEX_EXPORT_HTML) || existsSync(INDEX_EXPORT_FLAT)) {
    return;
  }
  console.log(
    "Closeout export/css probe: trusted out/ missing parent index — running make build…",
  );
  runMakeBuild();
  if (!existsSync(INDEX_EXPORT_HTML) && !existsSync(INDEX_EXPORT_FLAT)) {
    throw new Error(
      `Expected parent-index export HTML under out/ after make build (looked for ${INDEX_EXPORT_HTML} or ${INDEX_EXPORT_FLAT})`,
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
    pollPath: "/docs/references/packaged-factories-index",
  });
  if (lifecycle.status !== "pass") {
    throw new Error(lifecycle.reason);
  }
  cleanupServer = lifecycle.session.cleanup;
  return lifecycle.baseUrl.replace(/\/$/, "");
}

async function proveNoJsInBrowser(baseUrl: string): Promise<void> {
  const browser = await launchPlaywrightBrowser();
  try {
    const page = await browser.newPage({ javaScriptEnabled: false });
    page.setDefaultTimeout(PAGE_TIMEOUT_MS);

    for (const route of PACKAGED_FACTORY_CLOSEOUT_NO_JS_ROUTES) {
      const response = await page.goto(`${baseUrl}${route.path}`, {
        waitUntil: "domcontentloaded",
        timeout: PAGE_TIMEOUT_MS,
      });
      if (!response?.ok()) {
        throw new Error(
          `no-JS browser load failed for ${route.path}: HTTP ${response?.status() ?? "none"}`,
        );
      }

      // Prefer script-stripped setContent so residual inline boot cannot
      // replace SSR contract text (matches W19 / closeout no-JS pattern).
      const html = await page.content();
      const stripped = stripScriptsFromHtml(html);
      await page.setContent(stripped, { waitUntil: "domcontentloaded" });
      const content = await page.content();
      assertPackagedFactoryCloseoutNoJsRoute(route.id, content);
      console.log(`no-JS browser: ${route.id} ok`);
    }
  } finally {
    await browser.close();
  }
}

async function proveBasePathFamilyRoutesInBrowser(): Promise<void> {
  const sampleHtmlPath = resolveExportHtmlFilePath(
    "out",
    "/docs/references/packaged-factories-index",
    process.cwd(),
  );
  const sampleHtml = readFileSync(sampleHtmlPath, "utf8");
  const alreadyPrefixed = isPackagedFactoryCloseoutPagesPrefixedExportHtml(
    sampleHtml,
    PACKAGED_FACTORY_CLOSEOUT_PAGES_BASE_PATH,
  );

  if (!alreadyPrefixed && !SKIP_PAGES_PREFIXED_BUILD) {
    console.log(
      `Closeout export/css probe: running GITHUB_PAGES_BASE_PATH=${PACKAGED_FACTORY_CLOSEOUT_PAGES_BASE_PATH} make build…`,
    );
    runMakeBuild({
      ...process.env,
      GITHUB_PAGES_BASE_PATH: PACKAGED_FACTORY_CLOSEOUT_PAGES_BASE_PATH,
    });
  } else if (!alreadyPrefixed && SKIP_PAGES_PREFIXED_BUILD) {
    throw new Error(
      "CLOSEOUT_SKIP_PAGES_PREFIXED_BUILD=1 but out/ is not Pages-prefixed; cannot prove base-path export.",
    );
  }

  const evidence = provePackagedFactoryCloseoutBasePathExport({
    cwd: process.cwd(),
    outDir: "out",
  });
  console.log(
    `base-path export: family routes ok under ${evidence.basePath} (${evidence.familyRouteUrls.length} urls)`,
  );

  // baseUrl already includes the Pages prefix; pollPath stays site-relative.
  const lifecycle = await runStaticExportServerLifecycle({
    outDir: "out",
    cwd: process.cwd(),
    host: "127.0.0.1",
    port: PORT + 1,
    basePath: PACKAGED_FACTORY_CLOSEOUT_PAGES_BASE_PATH,
    pollPath: "/docs/references/packaged-factories-index",
  });
  if (lifecycle.status !== "pass") {
    throw new Error(lifecycle.reason);
  }

  try {
    const prefixedBase = lifecycle.baseUrl.replace(/\/$/, "");
    for (const route of PACKAGED_FACTORY_CLOSEOUT_BASE_PATH_FAMILY_ROUTES) {
      const url =
        route === "/" ? `${prefixedBase}/` : `${prefixedBase}${route}`;
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        throw new Error(
          `Pages-prefixed family route failed: ${url} → HTTP ${response.status}`,
        );
      }
      const html = await response.text();
      if (
        !isPackagedFactoryCloseoutPagesPrefixedExportHtml(
          html,
          PACKAGED_FACTORY_CLOSEOUT_PAGES_BASE_PATH,
        )
      ) {
        throw new Error(
          `Pages-prefixed family route HTML missing prefix contract: ${url}`,
        );
      }
      console.log(`base-path browser fetch: ${route} ok`);
    }
  } finally {
    await lifecycle.session.cleanup();
  }

  if (!SKIP_PAGES_PREFIXED_BUILD) {
    console.log(
      "Closeout export/css probe: restoring unprefixed make build for later closeout probes…",
    );
    runMakeBuild(process.env);
  }
}

async function main(): Promise<void> {
  const css = provePackagedFactoryCloseoutVisualizerThemeTokens(process.cwd());
  console.log(
    `css tokens: ${css.themePalettes.join("+")} via ${css.visualizersStylesImport}`,
  );

  const tip = provePackagedFactoryReferenceFamilyCloseoutExportCss({
    cwd: process.cwd(),
    proveBasePathExport: false,
  });
  console.log(
    `tip no-JS export HTML: ${tip.noJs.map((entry) => entry.routeId).join(", ")}`,
  );

  const baseUrl = await resolveBaseUrl();
  await proveNoJsInBrowser(baseUrl);

  if (cleanupServer) {
    await cleanupServer();
    cleanupServer = undefined;
  }

  await proveBasePathFamilyRoutesInBrowser();

  console.log(
    "packaged-factory-reference-family-closeout export/css browser verify: ok",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
