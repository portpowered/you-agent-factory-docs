import { describe, expect, test } from "bun:test";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  LANDING_HOME_ASSET_ROOT,
  LANDING_HOME_PUBLIC_DIR,
  landingHomeAssetFiles,
  landingHomeAssetPath,
  landingHomeAssets,
} from "@/features/landing-page/landing-page.assets";
import { fixtureLandingPageData } from "@/features/landing-page/landing-page.data";

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
