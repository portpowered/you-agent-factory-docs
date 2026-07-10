import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { expectNoSeriousAxeOnPlaywrightPage } from "./a11y-playwright-axe";
import {
  getCriticalRoute,
  getCriticalViewport,
} from "./a11y-responsive-contract";
import { openA11yResponsivePageProbe } from "./a11y-responsive-page-session";
import { shouldRunVerifyProductionIntegrationTests } from "./server-lifecycle";

const repoRoot = join(import.meta.dir, "../../..");

describe("blog served-page accessibility", () => {
  test("served blog index and representative post expose landmarks and no serious axe violations", async () => {
    if (!shouldRunVerifyProductionIntegrationTests(repoRoot)) {
      return;
    }

    const blogIndex = getCriticalRoute("blog-index");
    const blogPost = getCriticalRoute("blog-post");
    const laptop = getCriticalViewport("laptop");
    if (!blogIndex || !blogPost || !laptop) {
      throw new Error(
        "Expected blog-index, blog-post, and laptop viewport in contract",
      );
    }

    for (const route of [blogIndex, blogPost]) {
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

        if (route.id === "blog-index") {
          expect(structure.h1Texts.some((text) => text === "Blog")).toBe(true);
          const postLinks = await session.page.evaluate(() => {
            return Array.from(
              document.querySelectorAll('a[href*="/blog/"]'),
            ).map((el) => ({
              href: el.getAttribute("href"),
              name: (el.getAttribute("aria-label") ?? el.textContent ?? "")
                .replace(/\s+/g, " ")
                .trim(),
            }));
          });
          expect(
            postLinks.some((link) =>
              link.href?.includes("/blog/comparing-agent-factories"),
            ),
          ).toBe(true);
          expect(postLinks.every((link) => link.name.length > 0)).toBe(true);
        }

        if (route.id === "blog-post") {
          expect(
            structure.h1Texts.some((text) =>
              text.includes("Comparing agent factories"),
            ),
          ).toBe(true);
          const article = await session.page.evaluate(() => {
            return Boolean(
              document.querySelector(
                'article[data-blog-slug="comparing-agent-factories"]',
              ),
            );
          });
          expect(article).toBe(true);
        }

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
});
