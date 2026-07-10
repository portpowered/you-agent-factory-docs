import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import {
  DEFAULT_EXPORT_OUT_DIR,
  exportHtmlRelativePath,
} from "@/lib/build/export-out-directory";
import type { BuildModeEnv } from "@/lib/build/static-export";
import { isLiveFactoryCanonicalPath } from "@/lib/seo/export-absolute-canonical";
import {
  DEFAULT_SOCIAL_PREVIEW_IMAGE_PATH,
  resolveSocialPreviewImageAbsoluteHref,
} from "@/lib/seo/social-preview-assets";

/**
 * Representative live factory routes used to prove base-prefixed social
 * preview images on project-site export.
 */
export const SOCIAL_PREVIEW_PROOF_ROUTES = [
  "/",
  "/search",
  "/docs/concepts/harness",
  "/blog/bottlenecks",
] as const;

export type SocialPreviewProofRoute =
  (typeof SOCIAL_PREVIEW_PROOF_ROUTES)[number];

export type ExtractedSocialImageTags = {
  ogImage: string | null;
  twitterImage: string | null;
};

function extractMetaPropertyContent(
  html: string,
  property: string,
): string | null {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const propertyFirst = html.match(
    new RegExp(
      `<meta\\b[^>]*\\bproperty=["']${escaped}["'][^>]*\\bcontent=["']([^"']*)["'][^>]*>`,
      "i",
    ),
  );
  if (propertyFirst?.[1] !== undefined) {
    return propertyFirst[1];
  }

  const contentFirst = html.match(
    new RegExp(
      `<meta\\b[^>]*\\bcontent=["']([^"']*)["'][^>]*\\bproperty=["']${escaped}["'][^>]*>`,
      "i",
    ),
  );
  return contentFirst?.[1] ?? null;
}

function extractMetaNameContent(html: string, name: string): string | null {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const nameFirst = html.match(
    new RegExp(
      `<meta\\b[^>]*\\bname=["']${escaped}["'][^>]*\\bcontent=["']([^"']*)["'][^>]*>`,
      "i",
    ),
  );
  if (nameFirst?.[1] !== undefined) {
    return nameFirst[1];
  }

  const contentFirst = html.match(
    new RegExp(
      `<meta\\b[^>]*\\bcontent=["']([^"']*)["'][^>]*\\bname=["']${escaped}["'][^>]*>`,
      "i",
    ),
  );
  return contentFirst?.[1] ?? null;
}

/**
 * Extracts `og:image` and `twitter:image` from exported HTML.
 */
export function extractSocialImageTags(html: string): ExtractedSocialImageTags {
  return {
    ogImage: extractMetaPropertyContent(html, "og:image"),
    twitterImage:
      extractMetaNameContent(html, "twitter:image") ??
      extractMetaPropertyContent(html, "twitter:image"),
  };
}

/**
 * True when exported HTML references the default social preview image as an
 * absolute production URL under the current origin/base-path contract.
 */
export function exportHtmlHasBasePrefixedSocialImages(
  html: string,
  env: BuildModeEnv = process.env,
): boolean {
  const expected = resolveSocialPreviewImageAbsoluteHref(env);
  const tags = extractSocialImageTags(html);
  if (tags.ogImage !== expected) {
    return false;
  }
  if (tags.twitterImage !== null && tags.twitterImage !== expected) {
    return false;
  }
  return true;
}

function resolveExistingExportHtmlPath(
  outDir: string,
  route: string,
  cwd: string,
): string | null {
  const absoluteOutDir = isAbsolute(outDir) ? outDir : join(cwd, outDir);
  const flatPath = join(absoluteOutDir, exportHtmlRelativePath(route));
  if (existsSync(flatPath)) {
    return flatPath;
  }

  if (route === "/") {
    return null;
  }

  const trimmed = route.startsWith("/") ? route.slice(1) : route;
  const nestedIndex = join(absoluteOutDir, trimmed, "index.html");
  return existsSync(nestedIndex) ? nestedIndex : null;
}

export type VerifyExportSocialPreviewImagesResult =
  | {
      ok: true;
      images: Readonly<Record<string, ExtractedSocialImageTags>>;
      expectedAbsoluteHref: string;
    }
  | {
      ok: false;
      reason: string;
      images: Readonly<Record<string, ExtractedSocialImageTags>>;
      expectedAbsoluteHref: string;
    };

/**
 * Reads representative export HTML and requires absolute production social
 * image URLs (base-prefixed under project-site export).
 */
export function verifyExportSocialPreviewImages(options: {
  env?: BuildModeEnv;
  outDir?: string;
  cwd?: string;
  routes?: readonly string[];
}): VerifyExportSocialPreviewImagesResult {
  const {
    env = {
      NEXT_STATIC_EXPORT: "1",
      GITHUB_PAGES_BASE_PATH: "/you-agent-factory-docs",
    },
    outDir = DEFAULT_EXPORT_OUT_DIR,
    cwd = process.cwd(),
    routes = SOCIAL_PREVIEW_PROOF_ROUTES,
  } = options;

  const expectedAbsoluteHref = resolveSocialPreviewImageAbsoluteHref(env);
  const images: Record<string, ExtractedSocialImageTags> = {};

  for (const route of routes) {
    if (!isLiveFactoryCanonicalPath(route)) {
      return {
        ok: false,
        reason: `proof route ${route} is not a live factory path`,
        images,
        expectedAbsoluteHref,
      };
    }

    const path = resolveExistingExportHtmlPath(outDir, route, cwd);
    if (path === null) {
      return {
        ok: false,
        reason: `missing export HTML for ${route} under ${outDir}`,
        images,
        expectedAbsoluteHref,
      };
    }

    const html = readFileSync(path, "utf8");
    const tags = extractSocialImageTags(html);
    images[route] = tags;

    if (!exportHtmlHasBasePrefixedSocialImages(html, env)) {
      return {
        ok: false,
        reason: `Social images for ${route} must resolve to ${expectedAbsoluteHref} (got og:image=${tags.ogImage}, twitter:image=${tags.twitterImage}; asset path ${DEFAULT_SOCIAL_PREVIEW_IMAGE_PATH})`,
        images,
        expectedAbsoluteHref,
      };
    }
  }

  return { ok: true, images, expectedAbsoluteHref };
}
