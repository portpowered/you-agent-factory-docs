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

export type A11yResponsiveBrowserSessionOptions = {
  projectRoot?: string;
  basePath?: string;
  verifySession?: AcquireVerifyServerSessionOptions;
  pageGotoTimeoutMs?: number;
};

export type A11yResponsiveBrowserSession = {
  baseUrl: string;
  browser: Browser;
  server: VerifyServerSession;
  /**
   * Sets the viewport, navigates to a site-relative path, and returns the page.
   * Reuses one Chromium page across matrix iterations.
   */
  openPath: (
    path: string,
    viewport: Pick<CriticalViewport, "width" | "height">,
  ) => Promise<Page>;
  cleanup: () => Promise<void>;
};

/**
 * One verify server + one Chromium browser for multi-route / multi-viewport
 * matrix probes. Prefer this over `openA11yResponsivePageProbe` when iterating
 * the critical overflow matrix so startup cost is paid once.
 */
export async function openA11yResponsiveBrowserSession(
  options: A11yResponsiveBrowserSessionOptions = {},
): Promise<A11yResponsiveBrowserSession> {
  const server = await acquireVerifyServerSession({
    projectRoot: options.projectRoot,
    ...options.verifySession,
  });
  const browser = await launchPlaywrightBrowser();
  const page = await browser.newPage();
  page.setDefaultTimeout(options.pageGotoTimeoutMs ?? 30_000);

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

  const openPath = async (
    path: string,
    viewport: Pick<CriticalViewport, "width" | "height">,
  ): Promise<Page> => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    const absoluteUrl = resolveA11yResponsiveProbeUrl(
      server.baseUrl,
      path,
      options.basePath ?? "",
    );
    await page.goto(absoluteUrl, { waitUntil: "load" });
    return page;
  };

  return {
    baseUrl: server.baseUrl,
    browser,
    server,
    openPath,
    cleanup,
  };
}
