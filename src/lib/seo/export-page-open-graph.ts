import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import {
  DEFAULT_EXPORT_OUT_DIR,
  exportHtmlRelativePath,
} from "@/lib/build/export-out-directory";
import type { BuildModeEnv } from "@/lib/build/static-export";
import {
  extractCanonicalHref,
  isLiveFactoryCanonicalPath,
} from "@/lib/seo/export-absolute-canonical";
import { resolveProductionMetadataHref } from "@/lib/seo/production-metadata-base";

/**
 * Representative live factory routes used to prove page-specific Open Graph on
 * project-site export (home, search, one docs article, one blog post).
 */
export const PAGE_OPEN_GRAPH_PROOF_ROUTES = [
  "/",
  "/search",
  "/docs/concepts/harness",
  "/blog/bottlenecks",
] as const;

export type PageOpenGraphProofRoute =
  (typeof PAGE_OPEN_GRAPH_PROOF_ROUTES)[number];

export type ExtractedOpenGraphTags = {
  title: string | null;
  description: string | null;
  url: string | null;
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

/**
 * Extracts `og:title`, `og:description`, and `og:url` from exported HTML.
 */
export function extractOpenGraphTags(html: string): ExtractedOpenGraphTags {
  return {
    title: extractMetaPropertyContent(html, "og:title"),
    description: extractMetaPropertyContent(html, "og:description"),
    url: extractMetaPropertyContent(html, "og:url"),
  };
}

const ATLAS_COPY_PATTERN = /Model Atlas/i;

/**
 * True when exported HTML has page-specific Open Graph title/description that
 * are non-empty factory copy (no Model Atlas strings), and when `og:url` is
 * present it matches the absolute production canonical for `appPath`.
 */
export function exportHtmlHasPageSpecificOpenGraph(
  html: string,
  appPath: string,
  env: BuildModeEnv = process.env,
  expected?: { title?: string; description?: string },
): boolean {
  if (!isLiveFactoryCanonicalPath(appPath)) {
    return false;
  }

  const og = extractOpenGraphTags(html);
  if (og.title === null || og.title.trim() === "") {
    return false;
  }
  if (og.description === null || og.description.trim() === "") {
    return false;
  }
  if (
    ATLAS_COPY_PATTERN.test(og.title) ||
    ATLAS_COPY_PATTERN.test(og.description)
  ) {
    return false;
  }

  if (expected?.title !== undefined && og.title !== expected.title) {
    return false;
  }
  if (
    expected?.description !== undefined &&
    og.description !== expected.description
  ) {
    return false;
  }

  if (og.url === null) {
    return false;
  }

  const expectedUrl = resolveProductionMetadataHref(appPath, env);
  if (og.url !== expectedUrl) {
    return false;
  }

  const canonical = extractCanonicalHref(html);
  if (canonical !== null && og.url !== canonical) {
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

export type VerifyExportPageOpenGraphResult =
  | {
      ok: true;
      openGraph: Readonly<Record<string, ExtractedOpenGraphTags>>;
    }
  | {
      ok: false;
      reason: string;
      openGraph: Readonly<Record<string, ExtractedOpenGraphTags>>;
    };

/**
 * Reads representative export HTML and requires page-specific Open Graph tags
 * whose `og:url` matches the absolute production canonical for each route.
 */
export function verifyExportPageOpenGraph(options: {
  env?: BuildModeEnv;
  outDir?: string;
  cwd?: string;
  routes?: readonly string[];
}): VerifyExportPageOpenGraphResult {
  const {
    env = {
      NEXT_STATIC_EXPORT: "1",
      GITHUB_PAGES_BASE_PATH: "/you-agent-factory-docs",
    },
    outDir = DEFAULT_EXPORT_OUT_DIR,
    cwd = process.cwd(),
    routes = PAGE_OPEN_GRAPH_PROOF_ROUTES,
  } = options;

  const openGraph: Record<string, ExtractedOpenGraphTags> = {};

  for (const route of routes) {
    if (!isLiveFactoryCanonicalPath(route)) {
      return {
        ok: false,
        reason: `proof route ${route} is not a live factory path`,
        openGraph,
      };
    }

    const path = resolveExistingExportHtmlPath(outDir, route, cwd);
    if (path === null) {
      return {
        ok: false,
        reason: `missing export HTML for ${route} under ${outDir}`,
        openGraph,
      };
    }

    const html = readFileSync(path, "utf8");
    const tags = extractOpenGraphTags(html);
    openGraph[route] = tags;

    if (!exportHtmlHasPageSpecificOpenGraph(html, route, env)) {
      const expectedUrl = resolveProductionMetadataHref(route, env);
      return {
        ok: false,
        reason: `Open Graph for ${route} must include factory og:title/og:description and og:url ${expectedUrl} (got title=${tags.title}, description=${tags.description}, url=${tags.url})`,
        openGraph,
      };
    }
  }

  return { ok: true, openGraph };
}
