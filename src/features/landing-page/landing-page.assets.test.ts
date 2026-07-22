import { describe, expect, test } from "bun:test";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  LANDING_HOME_ASSET_ROOT,
  LANDING_HOME_PUBLIC_DIR,
  type LandingHomeAssetKey,
  landingHomeAssetFiles,
  landingHomeAssetPath,
  landingHomeAssets,
} from "@/features/landing-page/landing-page.assets";
import { fixtureLandingPageData } from "@/features/landing-page/landing-page.data";
import { resolveLandingHomeAssets } from "@/features/landing-page/landing-page.public-assets";
import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";

describe("landing-page.assets", () => {
  test("public/home exists as the reserved homepage asset root", () => {
    const publicHome = join(process.cwd(), LANDING_HOME_PUBLIC_DIR);
    expect(existsSync(publicHome)).toBe(true);
    expect(statSync(publicHome).isDirectory()).toBe(true);
  });

  test("landingHomeAssets expose /home/... public paths", () => {
    expect(LANDING_HOME_ASSET_ROOT).toBe("/home");
    expect(landingHomeAssets.womanHead).toBe("/home/woman-head.png");
    expect(landingHomeAssets.midEndWhale).toBe("/home/mid-end-whale.png");
    expect(landingHomeAssetPath("cta-fog.png")).toBe("/home/cta-fog.png");
  });

  test("fixture section srcs use /home public paths", () => {
    expect(fixtureLandingPageData.hero.portraitSrc?.startsWith("/home/")).toBe(
      true,
    );
    expect(fixtureLandingPageData.youi.imageSrc?.startsWith("/home/")).toBe(
      true,
    );
    expect(
      fixtureLandingPageData.whaleBubbles.whaleSrc?.startsWith("/home/"),
    ).toBe(true);
    expect(fixtureLandingPageData.footer.artSrc?.startsWith("/home/")).toBe(
      true,
    );
  });

  test("project-site exports prefix every homepage public asset", () => {
    const basePath = BUILT_APP_GITHUB_PAGES_BASE_PATH;
    const resolved = resolveLandingHomeAssets({
      NEXT_STATIC_EXPORT: "1",
      GITHUB_PAGES_BASE_PATH: basePath,
    });

    for (const [key, assetPath] of Object.entries(landingHomeAssets)) {
      expect(resolved[key as LandingHomeAssetKey]).toBe(
        `${basePath}${assetPath}`,
      );
    }
  });

  test("staged homepage assets are present under public/home when sources were available", () => {
    const publicHome = join(process.cwd(), LANDING_HOME_PUBLIC_DIR);
    const expected = Object.values(landingHomeAssetFiles);

    for (const name of expected) {
      const path = join(publicHome, name);
      expect(existsSync(path)).toBe(true);
      expect(statSync(path).isFile()).toBe(true);
      expect(statSync(path).size).toBeGreaterThan(0);
    }
  });
});
