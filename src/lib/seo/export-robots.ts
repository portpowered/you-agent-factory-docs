import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import type { MetadataRoute } from "next";
import { DEFAULT_EXPORT_OUT_DIR } from "@/lib/build/export-out-directory";
import type { BuildModeEnv } from "@/lib/build/static-export";
import { EXPORT_SITEMAP_RELATIVE_PATH } from "@/lib/seo/export-sitemap";
import { resolveProductionMetadataHref } from "@/lib/seo/production-metadata-base";
import { SITEMAP_EXCLUSION_PROOF_ROUTES } from "@/lib/seo/public-sitemap-routes";

/** Relative path of the Next static-export robots artifact under `out/`. */
export const EXPORT_ROBOTS_RELATIVE_PATH = "robots.txt" as const;

/**
 * Absolute production sitemap URL referenced from robots.txt.
 * App-relative `/sitemap.xml` is composed with the production metadataBase.
 */
export function resolveProductionSitemapUrl(
  env: BuildModeEnv = process.env,
): string {
  return resolveProductionMetadataHref(`/${EXPORT_SITEMAP_RELATIVE_PATH}`, env);
}

/**
 * Builds Next.js `MetadataRoute.Robots` for the factory public site.
 *
 * Uses a normal allow-all public-site policy and points `sitemap` at the
 * absolute production sitemap URL. Does not specially advertise deleted
 * legacy Atlas route trees as crawl targets.
 */
export function buildPublicRobots(
  env: BuildModeEnv = process.env,
): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: resolveProductionSitemapUrl(env),
  };
}

export type ParsedRobotsTxt = {
  sitemapUrls: readonly string[];
  allowPaths: readonly string[];
  disallowPaths: readonly string[];
  raw: string;
};

/**
 * Parses Sitemap / Allow / Disallow directives from a robots.txt body.
 */
export function parseRobotsTxt(raw: string): ParsedRobotsTxt {
  const sitemapUrls: string[] = [];
  const allowPaths: string[] = [];
  const disallowPaths: string[] = [];

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) {
      continue;
    }

    const sitemapMatch = trimmed.match(/^Sitemap:\s*(.+)$/i);
    if (sitemapMatch?.[1]) {
      sitemapUrls.push(sitemapMatch[1].trim());
      continue;
    }

    const allowMatch = trimmed.match(/^Allow:\s*(.+)$/i);
    if (allowMatch?.[1]) {
      allowPaths.push(allowMatch[1].trim());
      continue;
    }

    const disallowMatch = trimmed.match(/^Disallow:\s*(.+)$/i);
    if (disallowMatch?.[1]) {
      disallowPaths.push(disallowMatch[1].trim());
    }
  }

  return { sitemapUrls, allowPaths, disallowPaths, raw };
}

/**
 * True when a robots path directive specially names a retired Atlas route
 * (beyond a normal site-root allow like `/`).
 */
export function robotsPathAdvertisesLegacyAtlasRoute(path: string): boolean {
  const normalized = path.trim();
  if (normalized === "" || normalized === "/") {
    return false;
  }

  for (const route of SITEMAP_EXCLUSION_PROOF_ROUTES) {
    if (
      normalized === route ||
      normalized.startsWith(`${route}/`) ||
      normalized.includes(route)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * True when robots.txt references the production sitemap and does not
 * specially advertise deleted legacy Atlas route trees.
 */
export function robotsTxtMatchesPublicFactoryContract(
  raw: string,
  env: BuildModeEnv = process.env,
): boolean {
  const parsed = parseRobotsTxt(raw);
  const expectedSitemap = resolveProductionSitemapUrl(env);

  if (!parsed.sitemapUrls.includes(expectedSitemap)) {
    return false;
  }

  for (const path of [...parsed.allowPaths, ...parsed.disallowPaths]) {
    if (robotsPathAdvertisesLegacyAtlasRoute(path)) {
      return false;
    }
  }

  for (const route of SITEMAP_EXCLUSION_PROOF_ROUTES) {
    if (parsed.raw.includes(route)) {
      return false;
    }
  }

  return true;
}

export type VerifyExportRobotsResult =
  | { ok: true; sitemapUrl: string; raw: string }
  | { ok: false; reason: string; raw: string };

/**
 * Reads exported `robots.txt` and requires a production sitemap reference
 * without specially advertising retired Atlas route trees.
 */
export function verifyExportRobots(options: {
  env?: BuildModeEnv;
  outDir?: string;
  cwd?: string;
}): VerifyExportRobotsResult {
  const {
    env = {
      NEXT_STATIC_EXPORT: "1",
      GITHUB_PAGES_BASE_PATH: "/you-agent-factory-docs",
    },
    outDir = DEFAULT_EXPORT_OUT_DIR,
    cwd = process.cwd(),
  } = options;

  const absoluteOutDir = isAbsolute(outDir) ? outDir : join(cwd, outDir);
  const robotsPath = join(absoluteOutDir, EXPORT_ROBOTS_RELATIVE_PATH);

  if (!existsSync(robotsPath)) {
    return {
      ok: false,
      reason: `missing ${EXPORT_ROBOTS_RELATIVE_PATH} under ${outDir}`,
      raw: "",
    };
  }

  const raw = readFileSync(robotsPath, "utf8");
  const expectedSitemap = resolveProductionSitemapUrl(env);
  const parsed = parseRobotsTxt(raw);

  if (parsed.sitemapUrls.length === 0) {
    return {
      ok: false,
      reason: "robots.txt contains no Sitemap directive",
      raw,
    };
  }

  if (!parsed.sitemapUrls.includes(expectedSitemap)) {
    return {
      ok: false,
      reason: `robots.txt must reference production sitemap ${expectedSitemap} (got ${parsed.sitemapUrls.join(", ")})`,
      raw,
    };
  }

  for (const path of [...parsed.allowPaths, ...parsed.disallowPaths]) {
    if (robotsPathAdvertisesLegacyAtlasRoute(path)) {
      return {
        ok: false,
        reason: `robots.txt must not specially advertise legacy Atlas path ${path}`,
        raw,
      };
    }
  }

  for (const route of SITEMAP_EXCLUSION_PROOF_ROUTES) {
    if (raw.includes(route)) {
      return {
        ok: false,
        reason: `robots.txt must not mention retired Atlas route ${route}`,
        raw,
      };
    }
  }

  if (!robotsTxtMatchesPublicFactoryContract(raw, env)) {
    return {
      ok: false,
      reason: "robots.txt does not match the public factory contract",
      raw,
    };
  }

  return { ok: true, sitemapUrl: expectedSitemap, raw };
}
