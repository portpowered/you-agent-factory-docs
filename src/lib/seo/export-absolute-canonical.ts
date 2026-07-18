import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import {
  DEFAULT_EXPORT_OUT_DIR,
  exportHtmlRelativePath,
} from "@/lib/build/export-out-directory";
import {
  type BuildModeEnv,
  resolveGitHubPagesBasePath,
} from "@/lib/build/static-export";
import {
  DELETED_ATLAS_BLOG_URLS,
  RETIRED_ATLAS_SEARCH_URL_PREFIXES,
  stripSearchUrlLocalePrefix,
} from "@/lib/search/factory-search-deleted-records";
import { isDocumentationRouteMigrationOldPath } from "@/lib/seo/documentation-route-migration";
import {
  PRODUCTION_SITE_ORIGIN,
  resolveProductionMetadataHref,
} from "@/lib/seo/production-metadata-base";

/**
 * Representative live factory routes used to prove absolute production
 * canonicals on project-site export (home, one docs article, one blog post).
 */
export const ABSOLUTE_CANONICAL_PROOF_ROUTES = [
  "/",
  "/docs/concepts/harness",
  "/blog/bottlenecks",
] as const;

export type AbsoluteCanonicalProofRoute =
  (typeof ABSOLUTE_CANONICAL_PROOF_ROUTES)[number];

const ADDITIONAL_RETIRED_CANONICAL_PREFIXES = [
  "/topology",
  "/docs/timeline",
] as const;

/**
 * Extracts the `rel=canonical` href from exported HTML, or `null` when absent.
 */
export function extractCanonicalHref(html: string): string | null {
  const relFirst = html.match(
    /<link\b[^>]*\brel=["']canonical["'][^>]*\bhref=["']([^"']+)["'][^>]*>/i,
  );
  if (relFirst?.[1]) {
    return relFirst[1];
  }

  const hrefFirst = html.match(
    /<link\b[^>]*\bhref=["']([^"']+)["'][^>]*\brel=["']canonical["'][^>]*>/i,
  );
  return hrefFirst?.[1] ?? null;
}

/**
 * True when `href` is an absolute production URL under the configured
 * metadataBase (origin + optional project-site base path).
 */
export function isAbsoluteProductionCanonicalHref(
  href: string,
  env: BuildModeEnv = process.env,
): boolean {
  if (!href.startsWith(`${PRODUCTION_SITE_ORIGIN}/`)) {
    return false;
  }

  const basePath = resolveGitHubPagesBasePath(env);
  if (basePath === "") {
    // Root / unset-base-path: origin-qualified, no forced project-site prefix.
    return !href.startsWith(`${PRODUCTION_SITE_ORIGIN}/you-agent-factory-docs`);
  }

  return (
    href === `${PRODUCTION_SITE_ORIGIN}${basePath}/` ||
    href.startsWith(`${PRODUCTION_SITE_ORIGIN}${basePath}/`)
  );
}

/**
 * True when an app-relative path is a live factory route — not a retired Atlas
 * collection family or deleted Atlas blog slug.
 */
export function isLiveFactoryCanonicalPath(appPath: string): boolean {
  const path = stripSearchUrlLocalePrefix(appPath);

  for (const prefix of RETIRED_ATLAS_SEARCH_URL_PREFIXES) {
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      return false;
    }
  }

  for (const prefix of ADDITIONAL_RETIRED_CANONICAL_PREFIXES) {
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      return false;
    }
  }

  for (const deleted of DELETED_ATLAS_BLOG_URLS) {
    if (path === deleted) {
      return false;
    }
  }

  return true;
}

/**
 * True when an app-relative path may appear in canonical sitemap / discovery
 * inventories. Atlas-retired paths fail via {@link isLiveFactoryCanonicalPath}.
 * Plan §10 migration old routes also fail here — they still serve static
 * compatibility HTML, but must not compete as canonical discovery URLs.
 */
export function isCanonicalPublicDiscoveryPath(appPath: string): boolean {
  if (!isLiveFactoryCanonicalPath(appPath)) {
    return false;
  }
  return !isDocumentationRouteMigrationOldPath(appPath);
}

/**
 * True when exported HTML advertises an absolute production canonical for the
 * given app-relative route (not a path-prefixed relative href).
 */
export function exportHtmlHasAbsoluteProductionCanonical(
  html: string,
  appPath: string,
  env: BuildModeEnv = process.env,
): boolean {
  const expected = resolveProductionMetadataHref(appPath, env);
  const href = extractCanonicalHref(html);
  if (href === null) {
    return false;
  }

  return (
    href === expected &&
    isAbsoluteProductionCanonicalHref(href, env) &&
    isLiveFactoryCanonicalPath(appPath)
  );
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

export type VerifyExportAbsoluteCanonicalsResult =
  | { ok: true; canonicals: Readonly<Record<string, string>> }
  | {
      ok: false;
      reason: string;
      canonicals: Readonly<Record<string, string>>;
    };

/**
 * Reads representative export HTML and requires absolute production canonicals
 * for each live factory route. Pure filesystem read + string checks.
 */
export function verifyExportAbsoluteCanonicals(options: {
  env?: BuildModeEnv;
  outDir?: string;
  cwd?: string;
  routes?: readonly string[];
}): VerifyExportAbsoluteCanonicalsResult {
  const {
    env = {
      NEXT_STATIC_EXPORT: "1",
      GITHUB_PAGES_BASE_PATH: "/you-agent-factory-docs",
    },
    outDir = DEFAULT_EXPORT_OUT_DIR,
    cwd = process.cwd(),
    routes = ABSOLUTE_CANONICAL_PROOF_ROUTES,
  } = options;

  const canonicals: Record<string, string> = {};

  for (const route of routes) {
    if (!isLiveFactoryCanonicalPath(route)) {
      return {
        ok: false,
        reason: `proof route ${route} is not a live factory path`,
        canonicals,
      };
    }

    const path = resolveExistingExportHtmlPath(outDir, route, cwd);
    if (path === null) {
      return {
        ok: false,
        reason: `missing export HTML for ${route} under ${outDir}`,
        canonicals,
      };
    }

    const html = readFileSync(path, "utf8");
    const href = extractCanonicalHref(html);
    if (href === null) {
      return {
        ok: false,
        reason: `missing rel=canonical in export HTML for ${route}`,
        canonicals,
      };
    }

    canonicals[route] = href;

    if (!exportHtmlHasAbsoluteProductionCanonical(html, route, env)) {
      const expected = resolveProductionMetadataHref(route, env);
      return {
        ok: false,
        reason: `canonical for ${route} must be absolute production URL ${expected}, got ${href}`,
        canonicals,
      };
    }
  }

  return { ok: true, canonicals };
}
