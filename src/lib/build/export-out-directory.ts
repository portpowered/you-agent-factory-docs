import { existsSync, statSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { normalizeGitHubPagesBasePath } from "@/lib/build/static-export";

/** Default static export output directory from `bun run build:export`. */
export const DEFAULT_EXPORT_OUT_DIR = "out";

/**
 * Maps a reader route to its relative HTML path under `out/`.
 *
 * With static-export `trailingSlash: true`, Next emits directory landings
 * (`docs/factories/index.html`) rather than flat `docs/factories.html`.
 * Root `/` remains `index.html`.
 */
export function exportHtmlRelativePath(route: string): string {
  if (route === "/" || route === "") {
    return "index.html";
  }

  let trimmed = route.startsWith("/") ? route.slice(1) : route;
  if (trimmed.endsWith("/")) {
    trimmed = trimmed.slice(0, -1);
  }
  if (trimmed === "") {
    return "index.html";
  }

  return `${trimmed}/index.html`;
}

/** Resolves the absolute exported HTML file path for a reader route. */
export function resolveExportHtmlFilePath(
  outDir: string,
  route: string,
  cwd: string = process.cwd(),
): string {
  const absoluteOutDir = isAbsolute(outDir) ? outDir : join(cwd, outDir);
  return join(absoluteOutDir, exportHtmlRelativePath(route));
}

/**
 * Strips a GitHub Pages base path from internal hrefs so export HTML can reuse
 * production route content assertions.
 */
export function stripBasePathFromExportHtml(
  html: string,
  basePath: string,
): string {
  const normalizedBase = normalizeGitHubPagesBasePath(basePath);
  if (normalizedBase === "") {
    return html;
  }

  return html
    .replaceAll(`href="${normalizedBase}/`, 'href="/')
    .replaceAll(`href="${normalizedBase}"`, 'href="/"');
}

export type VerifyExportOutDirectoryResult =
  | { ok: true }
  | { ok: false; reason: string };

/**
 * Reader routes whose trailing-slash Pages URLs require `…/index.html`
 * directory landings under `out/`. Includes published docs collection indexes
 * (factories/workers/workstations and peers), `/docs/architecture`, and
 * `/blog`. Omits the retired `/docs/glossary` index surface.
 */
export const STATIC_EXPORT_REQUIRED_DIRECTORY_LANDING_ROUTES = [
  "/blog",
  "/docs/architecture",
  "/docs/concepts",
  "/docs/guides",
  "/docs/techniques",
  "/docs/documentation",
  "/docs/factories",
  "/docs/references",
  "/docs/workers",
  "/docs/workstations",
] as const;

/** Relative `out/` paths for {@link STATIC_EXPORT_REQUIRED_DIRECTORY_LANDING_ROUTES}. */
export const STATIC_EXPORT_REQUIRED_DIRECTORY_LANDING_RELATIVE_PATHS =
  STATIC_EXPORT_REQUIRED_DIRECTORY_LANDING_ROUTES.map((route) =>
    exportHtmlRelativePath(route),
  );

/** Verifies the export directory exists and contains a non-empty `index.html`. */
export function verifyExportOutDirectory(
  outDir: string = DEFAULT_EXPORT_OUT_DIR,
  cwd: string = process.cwd(),
): VerifyExportOutDirectoryResult {
  const absoluteOutDir = isAbsolute(outDir) ? outDir : join(cwd, outDir);
  if (!existsSync(absoluteOutDir)) {
    return {
      ok: false,
      reason: `Missing export directory at ${outDir} — run \`bun run build:export\` first.`,
    };
  }

  const indexPath = join(absoluteOutDir, "index.html");
  if (!existsSync(indexPath)) {
    return {
      ok: false,
      reason: `Missing ${join(outDir, "index.html")} — export directory is empty or incomplete.`,
    };
  }

  const indexSize = statSync(indexPath).size;
  if (indexSize === 0) {
    return {
      ok: false,
      reason: `Export index.html at ${join(outDir, "index.html")} is empty.`,
    };
  }

  return { ok: true };
}

/**
 * Fail-closed check that required trailing-slash directory landings exist under
 * `out/`. Missing any landing (for example `docs/factories/index.html`) fails —
 * no soft skip.
 */
export function verifyExportDirectoryLandings(
  outDir: string = DEFAULT_EXPORT_OUT_DIR,
  cwd: string = process.cwd(),
  requiredRelativePaths: readonly string[] = STATIC_EXPORT_REQUIRED_DIRECTORY_LANDING_RELATIVE_PATHS,
): VerifyExportOutDirectoryResult {
  const absoluteOutDir = isAbsolute(outDir) ? outDir : join(cwd, outDir);
  if (!existsSync(absoluteOutDir) || !statSync(absoluteOutDir).isDirectory()) {
    return {
      ok: false,
      reason: `Missing export directory at ${outDir} — run \`bun run build:export\` first.`,
    };
  }

  const missing: string[] = [];
  for (const relativePath of requiredRelativePaths) {
    const absolutePath = join(absoluteOutDir, relativePath);
    if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
      missing.push(relativePath);
    }
  }

  if (missing.length > 0) {
    return {
      ok: false,
      reason: `Missing required trailing-slash directory landings under ${outDir}: ${missing.join(", ")}`,
    };
  }

  return { ok: true };
}
