import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
  closePlaywrightBrowserWithTimeout,
  launchPlaywrightBrowser,
} from "@/lib/verify/launch-playwright-browser";
import {
  acquireVerifyServerSession,
  shouldRunVerifyProductionIntegrationTests,
} from "@/lib/verify/server-lifecycle";

const repoRoot = join(import.meta.dir, "../../..");

const FACTORY_BROWSE_HEADING_IDS = [
  "guides-heading",
  "concepts-heading",
  "techniques-heading",
  "documentation-heading",
] as const;

const RETIRED_ATLAS_BROWSE_HEADING_IDS = [
  "models-heading",
  "model-types-heading",
  "modules-heading",
  "module-components-heading",
  "inference-heading",
  "papers-heading",
  "training-heading",
  "systems-heading",
  "glossary-heading",
] as const;

const FACTORY_BROWSE_SECTION_LABELS = [
  "Guides",
  "Concepts",
  "Techniques",
  "Documentation",
] as const;

const RETIRED_ATLAS_BROWSE_SECTION_LABELS = [
  "Model Types",
  "Inference",
  "Module Components",
  "Models",
  "Modules",
  "Papers",
  "Training",
  "Systems",
] as const;

const BROWSE_VIEWPORTS = [
  { label: "desktop", width: 1280, height: 800 },
  { label: "narrow", width: 390, height: 844 },
] as const;

describe("factory-only browse built-app verification", () => {
  test.each(
    BROWSE_VIEWPORTS.map((viewport) => [viewport.label, viewport] as const),
  )(
    "served /browse exposes factory CLI collections only at %s viewport",
    async (_label, viewport) => {
      if (!shouldRunVerifyProductionIntegrationTests(repoRoot)) {
        return;
      }

      const session = await acquireVerifyServerSession({
        projectRoot: repoRoot,
      });
      const browser = await launchPlaywrightBrowser();

      try {
        const page = await browser.newPage({
          viewport: { width: viewport.width, height: viewport.height },
        });
        page.setDefaultTimeout(30_000);
        await page.goto(`${session.baseUrl}/browse`, {
          waitUntil: "load",
        });

        for (const headingId of FACTORY_BROWSE_HEADING_IDS) {
          await page.locator(`#${headingId}`).waitFor({ state: "visible" });
        }

        for (const headingId of RETIRED_ATLAS_BROWSE_HEADING_IDS) {
          expect(await page.locator(`#${headingId}`).count()).toBe(0);
        }

        for (const label of FACTORY_BROWSE_SECTION_LABELS) {
          await page.getByRole("heading", { level: 2, name: label }).waitFor({
            state: "visible",
          });
        }

        for (const label of RETIRED_ATLAS_BROWSE_SECTION_LABELS) {
          expect(
            await page.getByRole("heading", { level: 2, name: label }).count(),
          ).toBe(0);
        }

        await page.close();
      } finally {
        await closePlaywrightBrowserWithTimeout(browser);
        await session.cleanup();
      }
    },
    120_000,
  );
});
