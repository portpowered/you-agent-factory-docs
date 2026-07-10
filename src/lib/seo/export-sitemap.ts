import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import type { MetadataRoute } from "next";
import { DEFAULT_EXPORT_OUT_DIR } from "@/lib/build/export-out-directory";
import {
  type BuildModeEnv,
  resolveGitHubPagesBasePath,
} from "@/lib/build/static-export";
import { stripBasePathFromHref } from "@/lib/navigation/site-path";
import { isLiveFactoryCanonicalPath } from "@/lib/seo/export-absolute-canonical";
import { resolveProductionMetadataHref } from "@/lib/seo/production-metadata-base";
import {
  listPublicSitemapAbsoluteUrls,
  listPublicSitemapRoutes,
  SITEMAP_EXCLUSION_PROOF_ROUTES,
  SITEMAP_INCLUSION_PROOF_ROUTES,
} from "@/lib/seo/public-sitemap-routes";

/** Relative path of the Next static-export sitemap artifact under `out/`. */
export const EXPORT_SITEMAP_RELATIVE_PATH = "sitemap.xml" as const;

/**
 * Builds Next.js `MetadataRoute.Sitemap` entries for current public factory
 * routes using absolute production URLs.
 */
export function buildPublicSitemapEntries(
  env: BuildModeEnv = process.env,
): MetadataRoute.Sitemap {
  return listPublicSitemapAbsoluteUrls(env).map((url) => ({ url }));
}

/**
 * Extracts `<loc>` URL values from a sitemap XML document.
 */
export function extractSitemapLocUrls(xml: string): string[] {
  const urls: string[] = [];
  const pattern = /<loc>\s*([^<]+?)\s*<\/loc>/gi;
  for (const match of xml.matchAll(pattern)) {
    const loc = match[1]?.trim();
    if (loc) {
      urls.push(loc);
    }
  }
  return urls;
}

function appPathFromSitemapLoc(loc: string, env: BuildModeEnv): string | null {
  try {
    const pathname = new URL(loc).pathname;
    const basePath = resolveGitHubPagesBasePath(env);
    return stripBasePathFromHref(pathname, basePath);
  } catch {
    return null;
  }
}

/**
 * True when every expected absolute production URL is present in `locs` and
 * every exclusion proof URL (resolved under the same env) is absent.
 */
export function sitemapLocsMatchPublicFactoryContract(
  locs: readonly string[],
  env: BuildModeEnv = process.env,
): boolean {
  const locSet = new Set(locs);
  const expected = listPublicSitemapAbsoluteUrls(env);

  if (locs.length !== expected.length) {
    return false;
  }

  for (const url of expected) {
    if (!locSet.has(url)) {
      return false;
    }
  }

  for (const route of SITEMAP_INCLUSION_PROOF_ROUTES) {
    if (!locSet.has(resolveProductionMetadataHref(route, env))) {
      return false;
    }
  }

  for (const route of SITEMAP_EXCLUSION_PROOF_ROUTES) {
    if (locSet.has(resolveProductionMetadataHref(route, env))) {
      return false;
    }
  }

  for (const loc of locs) {
    const appPath = appPathFromSitemapLoc(loc, env);
    if (appPath === null || !isLiveFactoryCanonicalPath(appPath)) {
      return false;
    }
    if (loc !== resolveProductionMetadataHref(appPath, env)) {
      return false;
    }
  }

  return true;
}

export type VerifyExportSitemapResult =
  | { ok: true; urls: readonly string[] }
  | { ok: false; reason: string; urls: readonly string[] };

/**
 * Reads exported `sitemap.xml` and requires absolute production URLs for live
 * factory routes only (no retired Atlas paths).
 */
export function verifyExportSitemap(options: {
  env?: BuildModeEnv;
  outDir?: string;
  cwd?: string;
}): VerifyExportSitemapResult {
  const {
    env = {
      NEXT_STATIC_EXPORT: "1",
      GITHUB_PAGES_BASE_PATH: "/you-agent-factory-docs",
    },
    outDir = DEFAULT_EXPORT_OUT_DIR,
    cwd = process.cwd(),
  } = options;

  const absoluteOutDir = isAbsolute(outDir) ? outDir : join(cwd, outDir);
  const sitemapPath = join(absoluteOutDir, EXPORT_SITEMAP_RELATIVE_PATH);

  if (!existsSync(sitemapPath)) {
    return {
      ok: false,
      reason: `missing ${EXPORT_SITEMAP_RELATIVE_PATH} under ${outDir}`,
      urls: [],
    };
  }

  const xml = readFileSync(sitemapPath, "utf8");
  const urls = extractSitemapLocUrls(xml);

  if (urls.length === 0) {
    return {
      ok: false,
      reason: "sitemap.xml contains no <loc> entries",
      urls,
    };
  }

  const expected = listPublicSitemapAbsoluteUrls(env);
  const locSet = new Set(urls);
  const publicSet = new Set(listPublicSitemapRoutes());

  for (const url of expected) {
    if (!locSet.has(url)) {
      return {
        ok: false,
        reason: `sitemap missing live factory URL ${url}`,
        urls,
      };
    }
  }

  for (const route of SITEMAP_EXCLUSION_PROOF_ROUTES) {
    const absolute = resolveProductionMetadataHref(route, env);
    if (locSet.has(absolute)) {
      return {
        ok: false,
        reason: `sitemap must not list retired Atlas URL ${absolute}`,
        urls,
      };
    }
  }

  for (const url of urls) {
    const appPath = appPathFromSitemapLoc(url, env);
    if (appPath === null) {
      return {
        ok: false,
        reason: `sitemap loc is not an absolute URL: ${url}`,
        urls,
      };
    }

    if (!isLiveFactoryCanonicalPath(appPath)) {
      return {
        ok: false,
        reason: `sitemap lists non-live factory path ${appPath} (${url})`,
        urls,
      };
    }

    if (!publicSet.has(appPath)) {
      return {
        ok: false,
        reason: `sitemap lists unexpected route ${appPath}`,
        urls,
      };
    }

    const expectedAbsolute = resolveProductionMetadataHref(appPath, env);
    if (url !== expectedAbsolute) {
      return {
        ok: false,
        reason: `sitemap loc ${url} must equal production URL ${expectedAbsolute}`,
        urls,
      };
    }
  }

  if (!sitemapLocsMatchPublicFactoryContract(urls, env)) {
    return {
      ok: false,
      reason: "sitemap locs do not match the public factory contract",
      urls,
    };
  }

  return { ok: true, urls };
}
