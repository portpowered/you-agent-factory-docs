import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { expectNoSeriousAxeOnPlaywrightPage } from "./a11y-playwright-axe";
import {
  getCriticalRoute,
  getCriticalViewport,
  INTENTIONAL_HORIZONTAL_SCROLL_SELECTORS,
  PAGE_OVERFLOW_TOLERANCE_PX,
} from "./a11y-responsive-contract";
import { openA11yResponsivePageProbe } from "./a11y-responsive-page-session";
import { shouldRunVerifyProductionIntegrationTests } from "./server-lifecycle";

const repoRoot = join(import.meta.dir, "../../..");

describe("docs and harness-support served-page accessibility", () => {
  test("served docs article and harness-support expose landmarks and no serious axe violations", async () => {
    if (!shouldRunVerifyProductionIntegrationTests(repoRoot)) {
      return;
    }

    const docsArticle = getCriticalRoute("docs-article");
    const harnessSupport = getCriticalRoute("harness-support");
    const laptop = getCriticalViewport("laptop");
    if (!docsArticle || !harnessSupport || !laptop) {
      throw new Error(
        "Expected docs-article, harness-support, and laptop viewport in contract",
      );
    }

    for (const route of [docsArticle, harnessSupport]) {
      const session = await openA11yResponsivePageProbe({
        path: route.path,
        viewport: laptop,
        projectRoot: repoRoot,
      });

      try {
        const structure = await session.page.evaluate(() => {
          const banner = document.querySelector('header, [role="banner"]');
          const primaryNav = document.querySelector(
            'nav[aria-label="Primary"]',
          );
          const main = document.querySelector('main, [role="main"]');
          const h1s = Array.from(document.querySelectorAll("h1")).map((el) =>
            (el.textContent ?? "").replace(/\s+/g, " ").trim(),
          );
          const searchTrigger = document.querySelector(
            'button[aria-label="Open search"], button[data-search]',
          );
          return {
            hasBanner: Boolean(banner),
            hasPrimaryNavigation: Boolean(primaryNav),
            hasMain: Boolean(main),
            h1Count: h1s.length,
            h1Texts: h1s,
            hasSearchTrigger: Boolean(searchTrigger),
          };
        });

        expect(structure.hasBanner).toBe(true);
        expect(structure.hasPrimaryNavigation).toBe(true);
        expect(structure.hasMain).toBe(true);
        expect(structure.h1Count).toBeGreaterThanOrEqual(1);
        expect(structure.hasSearchTrigger).toBe(true);

        const focusProbe = await session.page.evaluate(() => {
          const nav = document.querySelector('nav[aria-label="Primary"]');
          if (!nav) {
            return { ok: false, reason: "missing primary nav" };
          }
          const links = Array.from(
            nav.querySelectorAll("a[href]"),
          ) as HTMLAnchorElement[];
          if (links.length === 0) {
            return { ok: false, reason: "no primary nav links" };
          }
          for (const link of links) {
            link.focus();
            if (document.activeElement !== link) {
              return {
                ok: false,
                reason: `could not focus ${link.textContent}`,
              };
            }
            if (!link.className.includes("focus-visible:ring")) {
              return {
                ok: false,
                reason: `missing focus ring on ${link.textContent}`,
              };
            }
          }
          return { ok: true, reason: "" };
        });
        expect(focusProbe.ok).toBe(true);

        await expectNoSeriousAxeOnPlaywrightPage(session.page);
      } finally {
        await session.cleanup();
      }
    }
  }, 180_000);

  test("harness-support matrix scrolls inside its container without page overflow at mobile and tablet", async () => {
    if (!shouldRunVerifyProductionIntegrationTests(repoRoot)) {
      return;
    }

    const harnessSupport = getCriticalRoute("harness-support");
    const mobile = getCriticalViewport("mobile");
    const tablet = getCriticalViewport("tablet");
    if (!harnessSupport || !mobile || !tablet) {
      throw new Error(
        "Expected harness-support route and mobile/tablet viewports in contract",
      );
    }

    for (const viewport of [mobile, tablet]) {
      const session = await openA11yResponsivePageProbe({
        path: harnessSupport.path,
        viewport,
        projectRoot: repoRoot,
      });

      try {
        const probe = await session.page.evaluate(
          ({ selectors, tolerancePx }) => {
            const root = document.documentElement;
            const body = document.body;
            const clientWidth = Math.max(
              root.clientWidth,
              body?.clientWidth ?? 0,
            );
            const scrollWidth = Math.max(
              root.scrollWidth,
              body?.scrollWidth ?? 0,
            );
            const overflowPx = Math.max(0, scrollWidth - clientWidth);

            const seen = new Set<Element>();
            const intentional: Array<{
              matchedBy: string;
              clientWidth: number;
              scrollWidth: number;
              canScrollHorizontally: boolean;
            }> = [];
            for (const selector of selectors) {
              for (const element of document.querySelectorAll(selector)) {
                if (seen.has(element)) {
                  continue;
                }
                seen.add(element);
                const htmlElement = element as HTMLElement;
                intentional.push({
                  matchedBy: selector,
                  clientWidth: htmlElement.clientWidth,
                  scrollWidth: htmlElement.scrollWidth,
                  canScrollHorizontally:
                    htmlElement.scrollWidth >
                    htmlElement.clientWidth + tolerancePx,
                });
              }
            }

            const matrix = intentional.find(
              (hit) => hit.matchedBy === "[data-harness-support-matrix]",
            );
            return {
              pageOverflowPx: overflowPx,
              hasUnintendedPageOverflow: overflowPx > tolerancePx,
              matrixCanScroll: matrix?.canScrollHorizontally ?? false,
              matrixClientWidth: matrix?.clientWidth ?? 0,
              matrixScrollWidth: matrix?.scrollWidth ?? 0,
            };
          },
          {
            selectors: [...INTENTIONAL_HORIZONTAL_SCROLL_SELECTORS],
            tolerancePx: PAGE_OVERFLOW_TOLERANCE_PX,
          },
        );

        expect(probe.hasUnintendedPageOverflow).toBe(false);
        expect(probe.matrixCanScroll).toBe(true);
        expect(probe.matrixScrollWidth).toBeGreaterThan(
          probe.matrixClientWidth,
        );
      } finally {
        await session.cleanup();
      }
    }
  }, 180_000);

  test("docs article code blocks scroll inside their container without page overflow at mobile", async () => {
    if (!shouldRunVerifyProductionIntegrationTests(repoRoot)) {
      return;
    }

    const docsArticle = getCriticalRoute("docs-article");
    const mobile = getCriticalViewport("mobile");
    if (!docsArticle || !mobile) {
      throw new Error(
        "Expected docs-article route and mobile viewport in contract",
      );
    }

    const session = await openA11yResponsivePageProbe({
      path: docsArticle.path,
      viewport: mobile,
      projectRoot: repoRoot,
    });

    try {
      const probe = await session.page.evaluate(
        ({ selectors, tolerancePx }) => {
          const root = document.documentElement;
          const body = document.body;
          const clientWidth = Math.max(
            root.clientWidth,
            body?.clientWidth ?? 0,
          );
          const scrollWidth = Math.max(
            root.scrollWidth,
            body?.scrollWidth ?? 0,
          );
          const overflowPx = Math.max(0, scrollWidth - clientWidth);

          const seen = new Set<Element>();
          let codeScroller:
            | {
                matchedBy: string;
                clientWidth: number;
                scrollWidth: number;
                canScrollHorizontally: boolean;
              }
            | undefined;
          for (const selector of selectors) {
            for (const element of document.querySelectorAll(selector)) {
              if (seen.has(element)) {
                continue;
              }
              seen.add(element);
              const htmlElement = element as HTMLElement;
              const hit = {
                matchedBy: selector,
                clientWidth: htmlElement.clientWidth,
                scrollWidth: htmlElement.scrollWidth,
                canScrollHorizontally:
                  htmlElement.scrollWidth >
                  htmlElement.clientWidth + tolerancePx,
              };
              if (
                hit.canScrollHorizontally &&
                (selector === '[data-rich-content-scroll="code"]' ||
                  selector === "pre" ||
                  selector === ".overflow-x-auto")
              ) {
                codeScroller = hit;
                break;
              }
            }
            if (codeScroller) {
              break;
            }
          }

          return {
            pageOverflowPx: overflowPx,
            hasUnintendedPageOverflow: overflowPx > tolerancePx,
            codeScroller,
          };
        },
        {
          selectors: [...INTENTIONAL_HORIZONTAL_SCROLL_SELECTORS],
          tolerancePx: PAGE_OVERFLOW_TOLERANCE_PX,
        },
      );

      expect(probe.hasUnintendedPageOverflow).toBe(false);
      expect(probe.codeScroller).toBeTruthy();
      expect(probe.codeScroller?.canScrollHorizontally).toBe(true);
    } finally {
      await session.cleanup();
    }
  }, 180_000);
});
