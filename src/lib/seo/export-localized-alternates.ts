import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import {
  DEFAULT_EXPORT_OUT_DIR,
  exportHtmlRelativePath,
} from "@/lib/build/export-out-directory";
import type { BuildModeEnv } from "@/lib/build/static-export";
import { FACTORY_SHIPPED_LOCALES } from "@/lib/content/factory-locale-base-path";
import {
  isAbsoluteProductionCanonicalHref,
  isLiveFactoryCanonicalPath,
} from "@/lib/seo/export-absolute-canonical";
import { resolveProductionMetadataHref } from "@/lib/seo/production-metadata-base";

/**
 * Fully shipped multi-locale proof route: home advertises every factory locale.
 */
export const MULTI_LOCALE_ALTERNATES_PROOF_ROUTE = "/" as const;

/**
 * Subset-locale proof route: English-only docs page (not in
 * SHIPPED_LOCALIZED_DOCS for ja/zh-CN/vi).
 */
export const SUBSET_LOCALE_ALTERNATES_PROOF_ROUTE =
  "/docs/concepts/task-queue" as const;

export const LOCALIZED_ALTERNATES_PROOF_ROUTES = [
  MULTI_LOCALE_ALTERNATES_PROOF_ROUTE,
  SUBSET_LOCALE_ALTERNATES_PROOF_ROUTE,
] as const;

export type LocalizedAlternatesProofRoute =
  (typeof LOCALIZED_ALTERNATES_PROOF_ROUTES)[number];

export type ExtractedHreflangAlternate = {
  hreflang: string;
  href: string;
};

/**
 * Extracts `rel=alternate` hreflang links from exported HTML.
 * Skips `x-default` when present so callers can assert shipped locales only.
 */
export function extractHreflangAlternates(
  html: string,
): ExtractedHreflangAlternate[] {
  const results: ExtractedHreflangAlternate[] = [];
  const tagPattern = /<link\b[^>]*>/gi;
  let match: RegExpExecArray | null = tagPattern.exec(html);

  while (match !== null) {
    const tag = match[0];
    const rel = tag.match(/\brel=["']([^"']+)["']/i)?.[1]?.toLowerCase();
    if (rel !== "alternate") {
      match = tagPattern.exec(html);
      continue;
    }

    const hreflang = tag.match(/\bhreflang=["']([^"']+)["']/i)?.[1];
    const href = tag.match(/\bhref=["']([^"']+)["']/i)?.[1];
    if (
      hreflang !== undefined &&
      href !== undefined &&
      hreflang.toLowerCase() !== "x-default"
    ) {
      results.push({ hreflang, href });
    }

    match = tagPattern.exec(html);
  }

  return results;
}

function expectedAbsoluteHref(appPath: string, env: BuildModeEnv): string {
  return resolveProductionMetadataHref(appPath, env);
}

/**
 * True when exported HTML advertises exactly `expectedLanguages` as absolute
 * production hreflang URLs, with no unshipped locales and no legacy Atlas paths.
 */
export function exportHtmlHasShippedAbsoluteAlternates(
  html: string,
  expectedLanguages: Readonly<Record<string, string>>,
  env: BuildModeEnv = process.env,
): boolean {
  const extracted = extractHreflangAlternates(html);
  const expectedLocales = Object.keys(expectedLanguages).sort();
  const actualLocales = extracted.map((entry) => entry.hreflang).sort();

  if (actualLocales.length !== expectedLocales.length) {
    return false;
  }
  if (
    actualLocales.some((locale, index) => locale !== expectedLocales[index])
  ) {
    return false;
  }

  for (const [locale, appPath] of Object.entries(expectedLanguages)) {
    if (!isLiveFactoryCanonicalPath(appPath)) {
      return false;
    }

    const expectedHref = expectedAbsoluteHref(appPath, env);
    const entry = extracted.find((item) => item.hreflang === locale);
    if (entry === undefined) {
      return false;
    }
    if (entry.href !== expectedHref) {
      return false;
    }
    if (!isAbsoluteProductionCanonicalHref(entry.href, env)) {
      return false;
    }
  }

  for (const entry of extracted) {
    if (
      !FACTORY_SHIPPED_LOCALES.includes(
        entry.hreflang as (typeof FACTORY_SHIPPED_LOCALES)[number],
      )
    ) {
      return false;
    }
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

export type VerifyExportLocalizedAlternatesResult =
  | {
      ok: true;
      alternates: Readonly<
        Record<string, readonly ExtractedHreflangAlternate[]>
      >;
    }
  | {
      ok: false;
      reason: string;
      alternates: Readonly<
        Record<string, readonly ExtractedHreflangAlternate[]>
      >;
    };

/**
 * Reads representative export HTML and requires shipped-only absolute
 * production hreflang alternates for multi-locale and subset-locale proofs.
 */
export function verifyExportLocalizedAlternates(options: {
  env?: BuildModeEnv;
  outDir?: string;
  cwd?: string;
  expectations?: Readonly<Record<string, Readonly<Record<string, string>>>>;
}): VerifyExportLocalizedAlternatesResult {
  const {
    env = {
      NEXT_STATIC_EXPORT: "1",
      GITHUB_PAGES_BASE_PATH: "/you-agent-factory-docs",
    },
    outDir = DEFAULT_EXPORT_OUT_DIR,
    cwd = process.cwd(),
    expectations = {
      [MULTI_LOCALE_ALTERNATES_PROOF_ROUTE]: {
        en: "/",
        ja: "/ja",
        "zh-CN": "/zh-CN",
        vi: "/vi",
      },
      [SUBSET_LOCALE_ALTERNATES_PROOF_ROUTE]: {
        en: "/docs/concepts/task-queue",
      },
    },
  } = options;

  const alternates: Record<string, ExtractedHreflangAlternate[]> = {};

  for (const [route, expectedLanguages] of Object.entries(expectations)) {
    if (!isLiveFactoryCanonicalPath(route)) {
      return {
        ok: false,
        reason: `proof route ${route} is not a live factory path`,
        alternates,
      };
    }

    for (const appPath of Object.values(expectedLanguages)) {
      if (!isLiveFactoryCanonicalPath(appPath)) {
        return {
          ok: false,
          reason: `alternate path ${appPath} for ${route} is not a live factory path`,
          alternates,
        };
      }
    }

    const path = resolveExistingExportHtmlPath(outDir, route, cwd);
    if (path === null) {
      return {
        ok: false,
        reason: `missing export HTML for ${route} under ${outDir}`,
        alternates,
      };
    }

    const html = readFileSync(path, "utf8");
    const extracted = extractHreflangAlternates(html);
    alternates[route] = extracted;

    if (!exportHtmlHasShippedAbsoluteAlternates(html, expectedLanguages, env)) {
      return {
        ok: false,
        reason: `hreflang alternates for ${route} must be absolute production URLs for shipped locales only (expected ${JSON.stringify(expectedLanguages)}, got ${JSON.stringify(extracted)})`,
        alternates,
      };
    }
  }

  return { ok: true, alternates };
}
