/**
 * IO boundary for accessibility / responsive page probes: serve a verify
 * session, launch Chromium, open a critical route at a contracted viewport.
 */

import type { Browser, Page } from "playwright";
import { withBasePath } from "@/lib/navigation/site-path";
import type { CriticalViewport } from "./a11y-responsive-contract";
import {
  closePlaywrightBrowserWithTimeout,
  launchPlaywrightBrowser,
} from "./launch-playwright-browser";
import {
  type AcquireVerifyServerSessionOptions,
  acquireVerifyServerSession,
  type VerifyServerSession,
} from "./server-lifecycle";

export type A11yResponsivePageProbeOptions = {
  /** Site-relative path from the critical-route contract (no basePath). */
  path: string;
  viewport: Pick<CriticalViewport, "width" | "height">;
  /** Optional project-site basePath (for example `/you-agent-factory-docs`). */
  basePath?: string;
  projectRoot?: string;
  verifySession?: AcquireVerifyServerSessionOptions;
  pageGotoTimeoutMs?: number;
};

export type A11yResponsivePageProbeSession = {
  baseUrl: string;
  absoluteUrl: string;
  browser: Browser;
  page: Page;
  server: VerifyServerSession;
  cleanup: () => Promise<void>;
};

/** Joins verify base URL with an optional basePath and site-relative route. */
export function resolveA11yResponsiveProbeUrl(
  baseUrl: string,
  path: string,
  basePath = "",
): string {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const prefixedPath = withBasePath(path, basePath);
  if (prefixedPath === "/") {
    return `${normalizedBase}/`;
  }
  return `${normalizedBase}${prefixedPath}`;
}

/**
 * Starts (or reuses) a verify server, launches Playwright Chromium, and opens
 * the requested path at the given viewport. Caller must `cleanup()`.
 */
export async function openA11yResponsivePageProbe(
  options: A11yResponsivePageProbeOptions,
): Promise<A11yResponsivePageProbeSession> {
  const server = await acquireVerifyServerSession({
    projectRoot: options.projectRoot,
    ...options.verifySession,
  });
  const browser = await launchPlaywrightBrowser();
  const page = await browser.newPage({
    viewport: {
      width: options.viewport.width,
      height: options.viewport.height,
    },
  });
  page.setDefaultTimeout(options.pageGotoTimeoutMs ?? 30_000);

  const absoluteUrl = resolveA11yResponsiveProbeUrl(
    server.baseUrl,
    options.path,
    options.basePath ?? "",
  );

  let cleanedUp = false;
  const cleanup = async () => {
    if (cleanedUp) {
      return;
    }
    cleanedUp = true;
    try {
      await page.close();
    } catch {
      // page may already be closed
    }
    await closePlaywrightBrowserWithTimeout(browser);
    await server.cleanup();
  };

  try {
    await page.goto(absoluteUrl, { waitUntil: "load" });
  } catch (error) {
    await cleanup();
    throw error;
  }

  return {
    baseUrl: server.baseUrl,
    absoluteUrl,
    browser,
    page,
    server,
    cleanup,
  };
}
