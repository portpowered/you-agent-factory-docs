/**
 * Opt-in R00 served-page gate for theme tokens + shared code-copy interaction.
 *
 * Requires VERIFY_PRODUCTION_INTEGRATION_TESTS=1 and a fresh production build.
 * Proves black/yellow chrome, inset/rail layout, persistent secondary-blue
 * hover/focus, checkmark copied feedback with reset, and non-overlapping
 * horizontal scroll at desktop and narrow viewports on getting-started.
 */
import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
  DOCS_CODE_COPY_COPIED_LABEL,
  DOCS_CODE_COPY_LABEL,
  DOCS_CODE_COPY_RESET_MS,
} from "@/features/docs/styles/docs-code-copy-chrome";
import { openA11yResponsivePageProbe } from "./a11y-responsive-page-session";
import { shouldRunVerifyProductionIntegrationTests } from "./server-lifecycle";
import {
  evaluateThemeCodeCopyControlColorInBrowser,
  evaluateThemeCodeCopyR00SnapshotInBrowser,
  type RgbTuple,
  rgbTuplesMatch,
  THEME_CODE_COPY_R00_DESKTOP_VIEWPORT,
  THEME_CODE_COPY_R00_FACTORY_DARK_RGB,
  THEME_CODE_COPY_R00_NARROW_VIEWPORT,
  THEME_CODE_COPY_R00_PALETTE_ATTR,
  THEME_CODE_COPY_R00_ROUTE,
} from "./theme-code-copy-r00-gate";

const repoRoot = join(import.meta.dir, "../../..");

const VIEWPORTS = [
  THEME_CODE_COPY_R00_DESKTOP_VIEWPORT,
  THEME_CODE_COPY_R00_NARROW_VIEWPORT,
] as const;

function expectSecondaryBlue(colorRgb: RgbTuple | null): void {
  expect(colorRgb).not.toBeNull();
  if (colorRgb === null) {
    return;
  }
  expect(
    rgbTuplesMatch(colorRgb, THEME_CODE_COPY_R00_FACTORY_DARK_RGB.secondary),
  ).toBe(true);
}

describe("theme + code-copy R00 served-page gate", () => {
  test("getting-started shows factory-dark chrome and full copy interaction at desktop and narrow", async () => {
    if (!shouldRunVerifyProductionIntegrationTests(repoRoot)) {
      return;
    }

    for (const viewport of VIEWPORTS) {
      const session = await openA11yResponsivePageProbe({
        path: THEME_CODE_COPY_R00_ROUTE,
        viewport,
        projectRoot: repoRoot,
      });

      try {
        await session.page.waitForSelector('[data-docs-code-copy="control"]', {
          state: "visible",
          timeout: 30_000,
        });

        const snapshot = await session.page.evaluate(
          evaluateThemeCodeCopyR00SnapshotInBrowser,
          {
            palette: THEME_CODE_COPY_R00_PALETTE_ATTR,
            background: [
              ...THEME_CODE_COPY_R00_FACTORY_DARK_RGB.background,
            ] as [number, number, number],
            primary: [...THEME_CODE_COPY_R00_FACTORY_DARK_RGB.primary] as [
              number,
              number,
              number,
            ],
            secondary: [...THEME_CODE_COPY_R00_FACTORY_DARK_RGB.secondary] as [
              number,
              number,
              number,
            ],
          },
        );

        expect(snapshot.chrome.matchesFactoryDark).toBe(true);
        expect(snapshot.blocks.railCount).toBeGreaterThanOrEqual(1);
        expect(snapshot.blocks.copyControlCount).toBeGreaterThanOrEqual(1);
        expect(snapshot.blocks.firstInsetInlineStartPx).toBeGreaterThanOrEqual(
          15,
        );
        expect(snapshot.blocks.firstInsetInlineEndPx).toBeGreaterThanOrEqual(
          15,
        );
        expect(snapshot.blocks.firstCopyOpacity).toBe(1);
        expect(snapshot.blocks.firstCopyOutsideViewport).toBe(true);
        expect(snapshot.blocks.firstRailOutsideViewport).toBe(true);

        const copy = session.page
          .locator('[data-docs-code-copy="control"]')
          .first();
        await copy.waitFor({ state: "visible" });

        // Persistent visibility while hovering the code block.
        const figure = session.page.locator("figure.docs-code-block").first();
        await figure.hover();
        await session.page.waitForTimeout(250);
        const restAfterHover = await session.page.evaluate(
          evaluateThemeCodeCopyControlColorInBrowser,
        );
        expect(restAfterHover.opacity).toBe(1);

        // Secondary blue on control hover.
        await copy.hover();
        await session.page.waitForTimeout(250);
        const hovered = await session.page.evaluate(
          evaluateThemeCodeCopyControlColorInBrowser,
        );
        expect(hovered.opacity).toBe(1);
        expectSecondaryBlue(hovered.colorRgb);

        // Secondary blue on keyboard focus.
        await copy.focus();
        await session.page.waitForTimeout(250);
        const focused = await session.page.evaluate(
          evaluateThemeCodeCopyControlColorInBrowser,
        );
        expect(focused.opacity).toBe(1);
        expectSecondaryBlue(focused.colorRgb);

        // Grant clipboard and prove copy → checkmark → accessible text → reset.
        await session.page
          .context()
          .grantPermissions(["clipboard-read", "clipboard-write"]);
        await copy.click();
        await session.page.waitForFunction(
          () => {
            const control = document.querySelector(
              '[data-docs-code-copy="control"]',
            );
            return control?.getAttribute("aria-label") === "Copied Text";
          },
          undefined,
          { timeout: 5_000 },
        );
        const copied = await session.page.evaluate(
          evaluateThemeCodeCopyControlColorInBrowser,
        );
        expect(copied.checked).toBe(true);
        expect(copied.hasCheckIcon).toBe(true);
        expect(copied.ariaLabel).toBe(DOCS_CODE_COPY_COPIED_LABEL);
        expect(copied.opacity).toBe(1);
        expectSecondaryBlue(copied.colorRgb);

        const live = await session.page
          .locator("[data-docs-code-copy-status]")
          .first()
          .textContent();
        expect(live?.trim()).toBe(DOCS_CODE_COPY_COPIED_LABEL);

        await session.page.waitForFunction(
          () => {
            const control = document.querySelector(
              '[data-docs-code-copy="control"]',
            );
            return control?.getAttribute("aria-label") === "Copy Text";
          },
          undefined,
          { timeout: DOCS_CODE_COPY_RESET_MS + 2_000 },
        );
        const reset = await session.page.evaluate(
          evaluateThemeCodeCopyControlColorInBrowser,
        );
        expect(reset.checked).toBe(false);
        expect(reset.hasCheckIcon).toBe(false);
        expect(reset.ariaLabel).toBe(DOCS_CODE_COPY_LABEL);

        // Horizontal scroll stays in the viewport column (rail sibling).
        const scrollProbe = await session.page.evaluate(() => {
          const figureEl =
            document.querySelector("figure.docs-code-block") ??
            document.querySelector(".docs-code-block");
          const viewportEl = figureEl?.querySelector(
            '[data-rich-content-scroll="code"]',
          ) as HTMLElement | null;
          const railEl = figureEl?.querySelector(
            '[data-docs-code-actions="rail"]',
          ) as HTMLElement | null;
          const controlEl = figureEl?.querySelector(
            '[data-docs-code-copy="control"]',
          ) as HTMLElement | null;
          if (!viewportEl || !railEl || !controlEl) {
            return { ok: false, reason: "missing markers" };
          }
          if (viewportEl.contains(controlEl) || viewportEl.contains(railEl)) {
            return { ok: false, reason: "control inside viewport" };
          }
          const before = viewportEl.scrollLeft;
          viewportEl.scrollLeft = Math.min(
            viewportEl.scrollWidth,
            viewportEl.clientWidth + 200,
          );
          const after = viewportEl.scrollLeft;
          const stillOutside =
            !viewportEl.contains(controlEl) && railEl.contains(controlEl);
          viewportEl.scrollLeft = before;
          return {
            ok: stillOutside,
            reason: stillOutside ? "" : "overlap after scroll",
            scrolled:
              after !== before ||
              viewportEl.scrollWidth > viewportEl.clientWidth,
          };
        });
        expect(scrollProbe.ok).toBe(true);
      } finally {
        await session.cleanup();
      }
    }
  }, 300_000);
});
