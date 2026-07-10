/**
 * Contracted static-export surfaces used for determinism proofs.
 *
 * Compares search bootstrap payloads and representative HTML base-path
 * contract digests — not every `_next` chunk (those may embed build ids).
 */

import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";
import {
  exportHtmlReferencesBasePathAssets,
  exportHtmlReferencesRootLevelNextAssets,
} from "@/lib/build/verify-export-base-path";

/** Relative paths under `out/` that must stay byte-stable across clean exports. */
export const STATIC_EXPORT_DETERMINISM_BOOTSTRAP_RELATIVE_PATHS = [
  "api/search",
] as const;

/**
 * Representative HTML pages checked for base-path contract equivalence.
 * Digests encode contract outcomes, not raw HTML bytes (Next build ids vary).
 */
export const STATIC_EXPORT_DETERMINISM_HTML_RELATIVE_PATHS = [
  "index.html",
  "blog.html",
  "docs/guides.html",
] as const;

export type StaticExportContractedSurfaceDigests = {
  /** Path → sha256 hex (bootstrap files) or contract digest (HTML). */
  digests: Record<string, string>;
  /** Absolute out directory that was scanned. */
  outDir: string;
  /** Base path used for HTML contract checks. */
  basePath: string;
};

function sha256Hex(content: string | Buffer): string {
  return createHash("sha256").update(content).digest("hex");
}

function listLocaleSearchBootstrapPaths(outDir: string): string[] {
  const apiDir = join(outDir, "api");
  if (!existsSync(apiDir) || !statSync(apiDir).isDirectory()) {
    return [];
  }

  return readdirSync(apiDir)
    .filter((name) => name === "search" || name.startsWith("search."))
    .map((name) => join("api", name))
    .sort();
}

function htmlContractDigest(html: string, basePath: string): string {
  const referencesBasePathAssets = exportHtmlReferencesBasePathAssets(
    html,
    basePath,
  );
  const referencesRootNext = exportHtmlReferencesRootLevelNextAssets(html);
  const payload = [
    `basePath=${basePath}`,
    `referencesBasePathAssets=${referencesBasePathAssets}`,
    `referencesRootLevelNextAssets=${referencesRootNext}`,
    // Length band keeps flaky content drift visible without requiring byte identity.
    `htmlLengthBand=${Math.floor(html.length / 1000)}`,
  ].join("\n");
  return sha256Hex(payload);
}

/**
 * Collects contracted-surface digests from an export `out/` directory.
 */
export function collectStaticExportContractedSurfaceDigests(options: {
  outDir: string;
  basePath?: string;
}): StaticExportContractedSurfaceDigests {
  const outDir = options.outDir;
  const basePath = options.basePath ?? BUILT_APP_GITHUB_PAGES_BASE_PATH;
  const digests: Record<string, string> = {};

  if (!existsSync(outDir) || !statSync(outDir).isDirectory()) {
    return { digests, outDir, basePath };
  }

  const bootstrapPaths = listLocaleSearchBootstrapPaths(outDir);
  const pathsToHash =
    bootstrapPaths.length > 0
      ? bootstrapPaths
      : [...STATIC_EXPORT_DETERMINISM_BOOTSTRAP_RELATIVE_PATHS];

  for (const relativePath of pathsToHash) {
    const absolutePath = join(outDir, relativePath);
    if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
      digests[`bootstrap:${relativePath}`] = "missing";
      continue;
    }
    digests[`bootstrap:${relativePath}`] = sha256Hex(
      readFileSync(absolutePath),
    );
  }

  for (const relativePath of STATIC_EXPORT_DETERMINISM_HTML_RELATIVE_PATHS) {
    const absolutePath = join(outDir, relativePath);
    const key = `html-contract:${relativePath}`;
    if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
      digests[key] = "missing";
      continue;
    }
    digests[key] = htmlContractDigest(
      readFileSync(absolutePath, "utf8"),
      basePath,
    );
  }

  return { digests, outDir, basePath };
}

/**
 * Snapshot digests to a JSON-serializable record for recorded evidence.
 */
export function serializeContractedSurfaceDigests(
  digests: StaticExportContractedSurfaceDigests,
): Record<string, string> {
  return { ...digests.digests };
}

/** Lists relative file paths under out/ for debugging (not used in digests). */
export function listExportOutRelativeFiles(
  outDir: string,
  maxFiles = 500,
): string[] {
  const results: string[] = [];

  function walk(dir: string): void {
    if (results.length >= maxFiles) {
      return;
    }
    if (!existsSync(dir) || !statSync(dir).isDirectory()) {
      return;
    }
    for (const entry of readdirSync(dir)) {
      if (results.length >= maxFiles) {
        return;
      }
      const absolute = join(dir, entry);
      const stats = statSync(absolute);
      if (stats.isDirectory()) {
        walk(absolute);
      } else if (stats.isFile()) {
        results.push(relative(outDir, absolute));
      }
    }
  }

  walk(outDir);
  return results.sort();
}
