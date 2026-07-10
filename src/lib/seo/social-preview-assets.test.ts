import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";
import { PRODUCTION_SITE_ORIGIN } from "@/lib/seo/production-metadata-base";
import {
  DEFAULT_SOCIAL_PREVIEW_IMAGE_PATH,
  defaultSocialOpenGraphImages,
  defaultSocialTwitter,
  resolveSocialPreviewImageAbsoluteHref,
  resolveSocialPreviewImagePublicHref,
} from "@/lib/seo/social-preview-assets";

const PROJECT_SITE_BASE_PATH = BUILT_APP_GITHUB_PAGES_BASE_PATH;
const PROJECT_SITE_EXPORT_ENV = {
  NEXT_STATIC_EXPORT: "1",
  GITHUB_PAGES_BASE_PATH: PROJECT_SITE_BASE_PATH,
} as const;
const ROOT_EXPORT_ENV = {
  NEXT_STATIC_EXPORT: "1",
  GITHUB_PAGES_BASE_PATH: "",
} as const;

describe("social preview asset contract", () => {
  test("publishes the default OG image under public/", () => {
    expect(DEFAULT_SOCIAL_PREVIEW_IMAGE_PATH).toBe("/images/og-default.png");
    expect(
      existsSync(join(process.cwd(), "public", "images", "og-default.png")),
    ).toBe(true);
  });

  test("Metadata helpers keep the social image app-relative", () => {
    expect(defaultSocialOpenGraphImages()).toEqual([
      { url: DEFAULT_SOCIAL_PREVIEW_IMAGE_PATH },
    ]);
    expect(defaultSocialTwitter()).toEqual({
      card: "summary_large_image",
      images: [DEFAULT_SOCIAL_PREVIEW_IMAGE_PATH],
    });
  });

  test("project-site export base-prefixes the public-asset path", () => {
    expect(resolveSocialPreviewImagePublicHref(PROJECT_SITE_BASE_PATH)).toBe(
      `${PROJECT_SITE_BASE_PATH}${DEFAULT_SOCIAL_PREVIEW_IMAGE_PATH}`,
    );
    expect(resolveSocialPreviewImagePublicHref(PROJECT_SITE_EXPORT_ENV)).toBe(
      `${PROJECT_SITE_BASE_PATH}${DEFAULT_SOCIAL_PREVIEW_IMAGE_PATH}`,
    );
    expect(resolveSocialPreviewImageAbsoluteHref(PROJECT_SITE_EXPORT_ENV)).toBe(
      `${PRODUCTION_SITE_ORIGIN}${PROJECT_SITE_BASE_PATH}${DEFAULT_SOCIAL_PREVIEW_IMAGE_PATH}`,
    );
  });

  test("root / unset-base-path builds keep an unprefixed public-asset path", () => {
    expect(resolveSocialPreviewImagePublicHref("")).toBe(
      DEFAULT_SOCIAL_PREVIEW_IMAGE_PATH,
    );
    expect(resolveSocialPreviewImagePublicHref(ROOT_EXPORT_ENV)).toBe(
      DEFAULT_SOCIAL_PREVIEW_IMAGE_PATH,
    );
    expect(resolveSocialPreviewImageAbsoluteHref(ROOT_EXPORT_ENV)).toBe(
      `${PRODUCTION_SITE_ORIGIN}${DEFAULT_SOCIAL_PREVIEW_IMAGE_PATH}`,
    );
    expect(
      resolveSocialPreviewImagePublicHref({
        GITHUB_PAGES_BASE_PATH: PROJECT_SITE_BASE_PATH,
      }),
    ).toBe(DEFAULT_SOCIAL_PREVIEW_IMAGE_PATH);
  });
});
