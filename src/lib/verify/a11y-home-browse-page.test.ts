import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
  expectNoSeriousAxeOnPlaywrightPage,
  formatPlaywrightAxeViolations,
} from "./a11y-playwright-axe";
import {
  getCriticalRoute,
  getCriticalViewport,
} from "./a11y-responsive-contract";
import { openA11yResponsivePageProbe } from "./a11y-responsive-page-session";
import { shouldRunVerifyProductionIntegrationTests } from "./server-lifecycle";

const repoRoot = join(import.meta.dir, "../../..");

describe("a11y-playwright-axe formatting", () => {
  test("formats serious violations for failure messages", () => {
    expect(
      formatPlaywrightAxeViolations([
        {
          id: "color-contrast",
          impact: "serious",
          help: "Elements must have sufficient color contrast",
          nodes: ["h1", ".subtitle"],
        },
      ]),
    ).toBe(
      "color-contrast (serious): Elements must have sufficient color contrast — h1; .subtitle",
    );
  });
});

describe("home and browse served-page accessibility", () => {
  test("served home and browse expose landmarks, labeled controls, and no serious axe violations", async () => {
    if (!shouldRunVerifyProductionIntegrationTests(repoRoot)) {
      return;
    }

    const home = getCriticalRoute("home");
    const browse = getCriticalRoute("browse");
    const laptop = getCriticalViewport("laptop");
    if (!home || !browse || !laptop) {
      throw new Error("Expected home, browse, and laptop viewport in contract");
    }

    for (const route of [home, browse]) {
      const session = await openA11yResponsivePageProbe({
        path: route.path,
        viewport: laptop,
        projectRoot: repoRoot,
      });

      try {
        const structure = await session.page.evaluate((routeId) => {
          const banner = document.querySelector('header, [role="banner"]');
          // Production `/` uses LandingHeader (Landing); docs routes use Primary.
          const navSelector =
            routeId === "home"
              ? 'nav[aria-label="Landing"]'
              : 'nav[aria-label="Primary"]';
          const siteNav = document.querySelector(navSelector);
          const main = document.querySelector('main, [role="main"]');
          const h1s = Array.from(document.querySelectorAll("h1")).map((el) =>
            (el.textContent ?? "").replace(/\s+/g, " ").trim(),
          );
          return {
            hasBanner: Boolean(banner),
            hasSiteNavigation: Boolean(siteNav),
            hasMain: Boolean(main),
            h1Count: h1s.length,
            h1Texts: h1s,
            navSelector,
          };
        }, route.id);

        expect(structure.hasBanner).toBe(true);
        expect(structure.hasSiteNavigation).toBe(true);
        expect(structure.hasMain).toBe(true);
        expect(structure.h1Count).toBeGreaterThanOrEqual(1);

        const focusProbe = await session.page.evaluate((routeId) => {
          const navSelector =
            routeId === "home"
              ? 'nav[aria-label="Landing"]'
              : 'nav[aria-label="Primary"]';
          const nav = document.querySelector(navSelector);
          if (!nav) {
            return { ok: false, reason: `missing nav ${navSelector}` };
          }
          const links = Array.from(
            nav.querySelectorAll("a[href]"),
          ) as HTMLAnchorElement[];
          if (links.length === 0) {
            return { ok: false, reason: "no site nav links" };
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
        }, route.id);
        expect(focusProbe.ok).toBe(true);

        await expectNoSeriousAxeOnPlaywrightPage(session.page);
      } finally {
        await session.cleanup();
      }
    }
  }, 180_000);
});
