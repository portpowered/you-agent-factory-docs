import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateMetadata as generateBlogPostMetadata } from "@/app/(site)/blog/[slug]/page";
import { generateMetadata as generateHomeMetadata } from "@/app/(site)/page";
import { generateMetadata as generateSearchMetadata } from "@/app/(site)/search/page";
import { buildDocsPageMetadata } from "@/app/docs/docs-slug-renderer";
import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";
import { exportHtmlRelativePath } from "@/lib/build/export-out-directory";
import {
  exportHtmlHasBasePrefixedSocialImages,
  extractSocialImageTags,
  SOCIAL_PREVIEW_PROOF_ROUTES,
  verifyExportSocialPreviewImages,
} from "@/lib/seo/export-social-preview-images";
import {
  DEFAULT_SOCIAL_PREVIEW_IMAGE_PATH,
  resolveSocialPreviewImageAbsoluteHref,
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

function ogMeta(property: string, content: string): string {
  return `<meta property="${property}" content="${content}">`;
}

function twitterMeta(name: string, content: string): string {
  return `<meta name="${name}" content="${content}">`;
}

function pageHtml(imageHref: string): string {
  return [
    ogMeta("og:image", imageHref),
    twitterMeta("twitter:image", imageHref),
  ].join("\n");
}

describe("export social preview image helpers", () => {
  test("extractSocialImageTags reads og:image and twitter:image", () => {
    expect(
      extractSocialImageTags(
        [
          ogMeta("og:image", "https://example.com/a.png"),
          '<meta content="https://example.com/b.png" name="twitter:image">',
        ].join(""),
      ),
    ).toEqual({
      ogImage: "https://example.com/a.png",
      twitterImage: "https://example.com/b.png",
    });
    expect(extractSocialImageTags("<html></html>")).toEqual({
      ogImage: null,
      twitterImage: null,
    });
  });

  test("exportHtmlHasBasePrefixedSocialImages requires absolute production image URL", () => {
    const absolute = resolveSocialPreviewImageAbsoluteHref(
      PROJECT_SITE_EXPORT_ENV,
    );
    expect(
      exportHtmlHasBasePrefixedSocialImages(
        pageHtml(absolute),
        PROJECT_SITE_EXPORT_ENV,
      ),
    ).toBe(true);

    expect(
      exportHtmlHasBasePrefixedSocialImages(
        pageHtml(
          `${PROJECT_SITE_BASE_PATH}${DEFAULT_SOCIAL_PREVIEW_IMAGE_PATH}`,
        ),
        PROJECT_SITE_EXPORT_ENV,
      ),
    ).toBe(false);

    expect(
      exportHtmlHasBasePrefixedSocialImages(
        pageHtml(DEFAULT_SOCIAL_PREVIEW_IMAGE_PATH),
        PROJECT_SITE_EXPORT_ENV,
      ),
    ).toBe(false);

    const rootAbsolute = resolveSocialPreviewImageAbsoluteHref(ROOT_EXPORT_ENV);
    expect(
      exportHtmlHasBasePrefixedSocialImages(
        pageHtml(rootAbsolute),
        ROOT_EXPORT_ENV,
      ),
    ).toBe(true);
    expect(rootAbsolute).not.toContain(PROJECT_SITE_BASE_PATH);
  });
});

describe("representative page metadata references the default social image", () => {
  test("home, search, docs article, and blog post include app-relative OG/Twitter images", async () => {
    const home = await generateHomeMetadata();
    const search = await generateSearchMetadata();
    const docs = await buildDocsPageMetadata(["concepts", "harness"]);
    const blog = await generateBlogPostMetadata({
      params: Promise.resolve({ slug: "bottlenecks" }),
    });

    for (const metadata of [home, search, docs, blog]) {
      expect(metadata.openGraph?.images).toEqual([
        { url: DEFAULT_SOCIAL_PREVIEW_IMAGE_PATH },
      ]);
      expect(metadata.twitter?.images).toEqual([
        DEFAULT_SOCIAL_PREVIEW_IMAGE_PATH,
      ]);
      expect(
        metadata.twitter && "card" in metadata.twitter && metadata.twitter.card,
      ).toBe("summary_large_image");
    }

    expect([...SOCIAL_PREVIEW_PROOF_ROUTES]).toEqual([
      "/",
      "/search",
      "/docs/concepts/harness",
      "/blog/bottlenecks",
    ]);
  });
});

describe("verifyExportSocialPreviewImages", () => {
  test("passes when export HTML has absolute production social images", () => {
    const dir = mkdtempSync(join(tmpdir(), "social-preview-export-"));
    try {
      const absolute = resolveSocialPreviewImageAbsoluteHref(
        PROJECT_SITE_EXPORT_ENV,
      );
      for (const route of SOCIAL_PREVIEW_PROOF_ROUTES) {
        const relative = exportHtmlRelativePath(route);
        const absolutePath = join(dir, relative);
        mkdirSync(join(absolutePath, ".."), { recursive: true });
        writeFileSync(absolutePath, pageHtml(absolute));
      }

      const result = verifyExportSocialPreviewImages({
        outDir: dir,
        env: PROJECT_SITE_EXPORT_ENV,
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.expectedAbsoluteHref).toBe(absolute);
        expect(result.images["/"]?.ogImage).toBe(absolute);
        expect(result.images["/blog/bottlenecks"]?.twitterImage).toBe(absolute);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("fails when og:image is only path-prefixed", () => {
    const dir = mkdtempSync(join(tmpdir(), "relative-social-export-"));
    try {
      const relativeHref = `${PROJECT_SITE_BASE_PATH}${DEFAULT_SOCIAL_PREVIEW_IMAGE_PATH}`;
      for (const route of SOCIAL_PREVIEW_PROOF_ROUTES) {
        const relative = exportHtmlRelativePath(route);
        const absolutePath = join(dir, relative);
        mkdirSync(join(absolutePath, ".."), { recursive: true });
        writeFileSync(absolutePath, pageHtml(relativeHref));
      }

      const result = verifyExportSocialPreviewImages({
        outDir: dir,
        env: PROJECT_SITE_EXPORT_ENV,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toContain("og:image");
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
