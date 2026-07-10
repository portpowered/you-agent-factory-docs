import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import {
  DEFAULT_EXPORT_OUT_DIR,
  exportHtmlRelativePath,
} from "@/lib/build/export-out-directory";
import {
  exportHtmlReferencesBasePathAssets,
  exportHtmlReferencesPrefixedNavigationHrefs,
  exportHtmlReferencesRootLevelNextAssets,
} from "@/lib/build/verify-export-base-path";
import {
  exportClientBundleIncludesBootstrapFrom,
  exportContentReferencesUnprefixedSearchBootstrap,
  readExportClientChunkContents,
  resolveExportSearchBootstrapClientFrom,
} from "@/lib/build/verify-export-search-bootstrap-client-path";

/** Representative reader routes used to prove project-site navigation consumers. */
export const PROJECT_SITE_EXPORT_PROOF_ROUTES = [
  "/",
  "/docs/guides",
  "/blog",
] as const;

/** Navigation hrefs that must stay under the project-site prefix in export HTML. */
export const PROJECT_SITE_EXPORT_PROOF_NAV_HREFS = [
  "/",
  "/docs/guides",
  "/blog",
] as const;

export type ProjectSiteExportConsumerEvaluation = {
  hasPrefixedNextAssets: boolean;
  hasRootLevelNextAssets: boolean;
  hasPrefixedNavigation: boolean;
  hasPrefixedSearchBootstrap: boolean;
  hasUnprefixedSearchBootstrap: boolean;
};

export type VerifyProjectSiteExportConsumersResult =
  | { ok: true; evaluation: ProjectSiteExportConsumerEvaluation }
  | {
      ok: false;
      reason: string;
      evaluation: ProjectSiteExportConsumerEvaluation;
    };

/**
 * Evaluates project-site export consumer URL shape from HTML + client chunks.
 * Pure: no filesystem IO.
 *
 * Search bootstrap: project-site builds must bake the prefixed fetch path.
 * The `DOCS_SEARCH_API_PATH` constant (`"/api/search"`) may still appear in
 * chunks for locale fallback comparisons — that is not an unprefixed bootstrap.
 */
export function evaluateProjectSiteExportConsumers(options: {
  html: string;
  chunksContent: string;
  basePath: string;
  navigationHrefs?: readonly string[];
}): ProjectSiteExportConsumerEvaluation {
  const {
    html,
    chunksContent,
    basePath,
    navigationHrefs = PROJECT_SITE_EXPORT_PROOF_NAV_HREFS,
  } = options;
  const expectedBootstrap = resolveExportSearchBootstrapClientFrom(basePath);
  const hasPrefixedSearchBootstrap = exportClientBundleIncludesBootstrapFrom(
    chunksContent,
    expectedBootstrap,
  );
  const hasBareApiSearchLiteral =
    exportContentReferencesUnprefixedSearchBootstrap(chunksContent);

  return {
    hasPrefixedNextAssets: exportHtmlReferencesBasePathAssets(html, basePath),
    hasRootLevelNextAssets: exportHtmlReferencesRootLevelNextAssets(html),
    hasPrefixedNavigation: exportHtmlReferencesPrefixedNavigationHrefs(
      html,
      basePath,
      navigationHrefs,
    ),
    hasPrefixedSearchBootstrap,
    // Unprefixed bootstrap only when the prefixed bake is missing and a bare
    // /api/search literal remains (root-mode bake), not when both coexist.
    hasUnprefixedSearchBootstrap:
      !hasPrefixedSearchBootstrap && hasBareApiSearchLiteral,
  };
}

function evaluationFailureReason(
  evaluation: ProjectSiteExportConsumerEvaluation,
  basePath: string,
): string | null {
  if (!evaluation.hasPrefixedNextAssets) {
    return `exported HTML missing ${basePath}/_next asset references`;
  }
  if (evaluation.hasRootLevelNextAssets) {
    return "exported HTML references root-level /_next assets";
  }
  if (!evaluation.hasPrefixedNavigation) {
    return `exported HTML missing representative home/docs/blog hrefs under ${basePath}`;
  }
  if (!evaluation.hasPrefixedSearchBootstrap) {
    return `client chunks missing prefixed search bootstrap ${basePath}/api/search`;
  }
  if (evaluation.hasUnprefixedSearchBootstrap) {
    return "client chunks reference unprefixed /api/search bootstrap";
  }
  return null;
}

/** Pass/fail gate for a project-site export consumer evaluation. */
export function projectSiteExportConsumersPass(
  evaluation: ProjectSiteExportConsumerEvaluation,
  basePath: string,
): VerifyProjectSiteExportConsumersResult {
  const reason = evaluationFailureReason(evaluation, basePath);
  if (reason !== null) {
    return { ok: false, reason, evaluation };
  }
  return { ok: true, evaluation };
}

function resolveExistingExportHtmlPath(
  outDir: string,
  route: string,
  cwd: string,
): string | null {
  const absoluteOutDir = isAbsolute(outDir) ? outDir : join(cwd, outDir);
  const relative = exportHtmlRelativePath(route);
  const flatPath = join(absoluteOutDir, relative);
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

/**
 * Reads representative export HTML routes and concatenates their contents.
 * Missing optional routes are skipped; home (`/`) must exist.
 */
export function readProjectSiteExportProofHtml(options: {
  outDir?: string;
  cwd?: string;
  routes?: readonly string[];
}): string {
  const {
    outDir = DEFAULT_EXPORT_OUT_DIR,
    cwd = process.cwd(),
    routes = PROJECT_SITE_EXPORT_PROOF_ROUTES,
  } = options;

  const parts: string[] = [];
  for (const route of routes) {
    const path = resolveExistingExportHtmlPath(outDir, route, cwd);
    if (path === null) {
      if (route === "/") {
        throw new Error(
          `missing export home HTML under ${outDir} — run a project-site static export first`,
        );
      }
      continue;
    }
    parts.push(readFileSync(path, "utf8"));
  }

  return parts.join("\n");
}

/**
 * Verifies a project-site `out/` directory: no root `/_next`, prefixed search
 * bootstrap, and representative home/docs/blog links under the base path.
 */
export function verifyProjectSiteExportDirectory(options: {
  basePath: string;
  outDir?: string;
  cwd?: string;
  navigationHrefs?: readonly string[];
  routes?: readonly string[];
}): VerifyProjectSiteExportConsumersResult {
  const {
    basePath,
    outDir = DEFAULT_EXPORT_OUT_DIR,
    cwd = process.cwd(),
    navigationHrefs = PROJECT_SITE_EXPORT_PROOF_NAV_HREFS,
    routes = PROJECT_SITE_EXPORT_PROOF_ROUTES,
  } = options;

  if (basePath === "") {
    return {
      ok: false,
      reason: "project-site export verification requires a non-empty base path",
      evaluation: {
        hasPrefixedNextAssets: false,
        hasRootLevelNextAssets: false,
        hasPrefixedNavigation: false,
        hasPrefixedSearchBootstrap: false,
        hasUnprefixedSearchBootstrap: false,
      },
    };
  }

  const html = readProjectSiteExportProofHtml({ outDir, cwd, routes });
  const chunksContent = readExportClientChunkContents(outDir, cwd);
  const evaluation = evaluateProjectSiteExportConsumers({
    html,
    chunksContent,
    basePath,
    navigationHrefs,
  });

  return projectSiteExportConsumersPass(evaluation, basePath);
}
