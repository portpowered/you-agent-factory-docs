import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";
import { DEFAULT_EXPORT_OUT_DIR } from "@/lib/build/export-out-directory";
import { normalizeGitHubPagesBasePath } from "@/lib/build/static-export";
import {
  exportHtmlReferencesBasePathAssets,
  exportHtmlReferencesPrefixedNavigationHrefs,
  exportHtmlReferencesRootLevelNextAssets,
} from "@/lib/build/verify-export-base-path";
import {
  exportClientBundleIncludesBootstrapFrom,
  exportContentReferencesUnprefixedSearchBootstrap,
  resolveExportSearchBootstrapClientFrom,
} from "@/lib/build/verify-export-search-bootstrap-client-path";
import { DOCS_SEARCH_API_PATH } from "@/lib/search/docs-search-bootstrap-path";
import {
  DEFAULT_FETCH_TIMEOUT_MS,
  httpGetText,
} from "@/lib/verify/http-harness";
import { runStaticExportServerLifecycle } from "@/lib/verify/static-export-server-lifecycle";

/** Representative reader routes the Pages deploy guard must HTTP-probe. */
export const PAGES_DEPLOYED_ARTIFACT_PROBE_ROUTES = [
  "/",
  "/docs/guides/getting-started",
  "/blog/comparing-agent-factories",
] as const;

/** Navigation hrefs that must stay under the project-site prefix in probed HTML. */
export const PAGES_DEPLOYED_ARTIFACT_PROBE_NAV_HREFS = [
  "/",
  "/docs/guides/getting-started",
  "/blog/comparing-agent-factories",
] as const;

export type PagesDeployedArtifactProbeEvaluation = {
  hasPrefixedNextAssets: boolean;
  hasRootLevelNextAssets: boolean;
  hasPrefixedNavigation: boolean;
  hasPrefixedSearchBootstrap: boolean;
  hasUnprefixedSearchBootstrap: boolean;
  hasCssAssetUrl: boolean;
  hasJsChunkUrl: boolean;
};

export type PagesDeployedArtifactProbeResult =
  | {
      ok: true;
      evaluation: PagesDeployedArtifactProbeEvaluation;
      probedRoutes: readonly string[];
      cssAssetUrl: string;
      jsChunkUrl: string;
      searchBootstrapUrl: string;
    }
  | {
      ok: false;
      reason: string;
      evaluation: PagesDeployedArtifactProbeEvaluation;
      probedRoutes?: readonly string[];
      cssAssetUrl?: string;
      jsChunkUrl?: string;
      searchBootstrapUrl?: string;
    };

export type ProbePagesDeployedArtifactOptions = {
  outDir?: string;
  cwd?: string;
  basePath?: string;
  host?: string;
  port?: number;
  startupTimeoutMs?: number;
  fetchTimeoutMs?: number;
};

const EMPTY_EVALUATION: PagesDeployedArtifactProbeEvaluation = {
  hasPrefixedNextAssets: false,
  hasRootLevelNextAssets: false,
  hasPrefixedNavigation: false,
  hasPrefixedSearchBootstrap: false,
  hasUnprefixedSearchBootstrap: false,
  hasCssAssetUrl: false,
  hasJsChunkUrl: false,
};

/**
 * Extracts the first `_next` asset URL of the given extension from HTML.
 * Prefers base-path-prefixed URLs; falls back to root `/_next` for failure fixtures.
 */
export function extractNextAssetUrlFromHtml(
  html: string,
  extension: "css" | "js",
  basePath: string,
): string | null {
  const escapedExt = extension.replace(".", "\\.");
  if (basePath !== "") {
    const escapedBase = basePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const prefixed = new RegExp(
      `(?:src|href)=["'](${escapedBase}/_next/[^"']+\\.${escapedExt})["']`,
    );
    const prefixedMatch = html.match(prefixed);
    if (prefixedMatch?.[1]) {
      return prefixedMatch[1];
    }
  }

  const root = new RegExp(
    `(?:src|href)=["'](/_next/[^"']+\\.${escapedExt})["']`,
  );
  const rootMatch = html.match(root);
  return rootMatch?.[1] ?? null;
}

/**
 * Pure evaluation of probed HTML + JS chunk bodies for project-site prefix correctness.
 */
export function evaluatePagesDeployedArtifactProbes(options: {
  html: string;
  jsChunkContent: string;
  basePath: string;
  cssAssetUrl: string | null;
  jsChunkUrl: string | null;
  navigationHrefs?: readonly string[];
}): PagesDeployedArtifactProbeEvaluation {
  const {
    html,
    jsChunkContent,
    basePath,
    cssAssetUrl,
    jsChunkUrl,
    navigationHrefs = PAGES_DEPLOYED_ARTIFACT_PROBE_NAV_HREFS,
  } = options;
  const expectedBootstrap = resolveExportSearchBootstrapClientFrom(basePath);
  const hasPrefixedSearchBootstrap = exportClientBundleIncludesBootstrapFrom(
    jsChunkContent,
    expectedBootstrap,
  );
  const hasBareApiSearchLiteral =
    exportContentReferencesUnprefixedSearchBootstrap(jsChunkContent);

  return {
    hasPrefixedNextAssets: exportHtmlReferencesBasePathAssets(html, basePath),
    hasRootLevelNextAssets: exportHtmlReferencesRootLevelNextAssets(html),
    hasPrefixedNavigation: exportHtmlReferencesPrefixedNavigationHrefs(
      html,
      basePath,
      navigationHrefs,
    ),
    hasPrefixedSearchBootstrap,
    hasUnprefixedSearchBootstrap:
      !hasPrefixedSearchBootstrap && hasBareApiSearchLiteral,
    hasCssAssetUrl: cssAssetUrl?.startsWith(`${basePath}/_next/`) === true,
    hasJsChunkUrl: jsChunkUrl?.startsWith(`${basePath}/_next/`) === true,
  };
}

function evaluationFailureReason(
  evaluation: PagesDeployedArtifactProbeEvaluation,
  basePath: string,
): string | null {
  if (!evaluation.hasPrefixedNextAssets) {
    return `probed HTML missing ${basePath}/_next asset references`;
  }
  if (evaluation.hasRootLevelNextAssets) {
    return "probed HTML references root-level /_next assets";
  }
  if (!evaluation.hasPrefixedNavigation) {
    return `probed HTML missing representative home/getting-started/comparing-agent-factories hrefs under ${basePath}`;
  }
  if (!evaluation.hasCssAssetUrl) {
    return `probed HTML missing a CSS asset URL under ${basePath}/_next`;
  }
  if (!evaluation.hasJsChunkUrl) {
    return `probed HTML missing a JS chunk URL under ${basePath}/_next`;
  }
  if (!evaluation.hasPrefixedSearchBootstrap) {
    return `JS chunks missing prefixed search bootstrap ${basePath}/api/search`;
  }
  if (evaluation.hasUnprefixedSearchBootstrap) {
    return "JS chunks reference unprefixed /api/search bootstrap";
  }
  return null;
}

/**
 * Serves a trusted project-site `out/` with the static-export HTTP harness and
 * probes home, getting-started, comparing-agent-factories, search bootstrap,
 * one CSS asset, and a representative JS chunk for `/you-agent-factory-docs`
 * prefix correctness.
 */
export async function probePagesDeployedArtifact(
  options: ProbePagesDeployedArtifactOptions = {},
): Promise<PagesDeployedArtifactProbeResult> {
  const cwd = options.cwd ?? process.cwd();
  const outDir = options.outDir ?? DEFAULT_EXPORT_OUT_DIR;
  const basePath = normalizeGitHubPagesBasePath(
    options.basePath ?? BUILT_APP_GITHUB_PAGES_BASE_PATH,
  );
  const fetchTimeoutMs = options.fetchTimeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS;

  if (basePath === "") {
    return {
      ok: false,
      reason: "pages deployed-artifact guard requires a non-empty base path",
      evaluation: EMPTY_EVALUATION,
    };
  }

  const lifecycle = await runStaticExportServerLifecycle({
    outDir,
    cwd,
    basePath,
    host: options.host,
    port: options.port,
    startupTimeoutMs: options.startupTimeoutMs,
  });

  if (lifecycle.status === "fail") {
    return {
      ok: false,
      reason: lifecycle.reason,
      evaluation: EMPTY_EVALUATION,
    };
  }

  const { session, baseUrl } = lifecycle;
  const probedRoutes: string[] = [];
  const htmlParts: string[] = [];

  try {
    for (const route of PAGES_DEPLOYED_ARTIFACT_PROBE_ROUTES) {
      // baseUrl already includes basePath; append the app route only.
      const requestUrl = route === "/" ? `${baseUrl}/` : `${baseUrl}${route}`;
      const response = await httpGetText(requestUrl, fetchTimeoutMs);
      if (response.status !== 200) {
        return {
          ok: false,
          reason: `probe ${route} returned HTTP ${response.status}`,
          evaluation: EMPTY_EVALUATION,
          probedRoutes,
        };
      }
      probedRoutes.push(route);
      htmlParts.push(response.body);
    }

    const searchBootstrapUrl = `${baseUrl}${DOCS_SEARCH_API_PATH}`;
    const searchResponse = await httpGetText(
      searchBootstrapUrl,
      fetchTimeoutMs,
    );
    if (searchResponse.status !== 200) {
      return {
        ok: false,
        reason: `search bootstrap ${DOCS_SEARCH_API_PATH} returned HTTP ${searchResponse.status}`,
        evaluation: EMPTY_EVALUATION,
        probedRoutes,
        searchBootstrapUrl,
      };
    }

    const combinedHtml = htmlParts.join("\n");
    const cssAssetPath = extractNextAssetUrlFromHtml(
      combinedHtml,
      "css",
      basePath,
    );
    const jsChunkPath = extractNextAssetUrlFromHtml(
      combinedHtml,
      "js",
      basePath,
    );

    if (cssAssetPath === null) {
      return {
        ok: false,
        reason: "probed HTML missing a CSS asset URL under _next",
        evaluation: {
          ...EMPTY_EVALUATION,
          hasPrefixedNextAssets: exportHtmlReferencesBasePathAssets(
            combinedHtml,
            basePath,
          ),
          hasRootLevelNextAssets:
            exportHtmlReferencesRootLevelNextAssets(combinedHtml),
        },
        probedRoutes,
        searchBootstrapUrl,
      };
    }

    if (jsChunkPath === null) {
      return {
        ok: false,
        reason: "probed HTML missing a JS chunk URL under _next",
        evaluation: {
          ...EMPTY_EVALUATION,
          hasPrefixedNextAssets: exportHtmlReferencesBasePathAssets(
            combinedHtml,
            basePath,
          ),
          hasRootLevelNextAssets:
            exportHtmlReferencesRootLevelNextAssets(combinedHtml),
          hasCssAssetUrl: cssAssetPath.startsWith(`${basePath}/_next/`),
        },
        probedRoutes,
        cssAssetUrl: cssAssetPath,
        searchBootstrapUrl,
      };
    }

    // Asset hrefs in HTML are absolute from the site root (include basePath).
    // The static-export server baseUrl already includes basePath, so strip it
    // when composing the request URL from an absolute asset path.
    const cssRequestUrl = absoluteSitePathToRequestUrl(
      baseUrl,
      basePath,
      cssAssetPath,
    );
    const jsRequestUrl = absoluteSitePathToRequestUrl(
      baseUrl,
      basePath,
      jsChunkPath,
    );

    const cssResponse = await httpGetText(cssRequestUrl, fetchTimeoutMs);
    if (cssResponse.status !== 200) {
      return {
        ok: false,
        reason: `CSS asset ${cssAssetPath} returned HTTP ${cssResponse.status}`,
        evaluation: EMPTY_EVALUATION,
        probedRoutes,
        cssAssetUrl: cssAssetPath,
        jsChunkUrl: jsChunkPath,
        searchBootstrapUrl,
      };
    }

    const jsResponse = await httpGetText(jsRequestUrl, fetchTimeoutMs);
    if (jsResponse.status !== 200) {
      return {
        ok: false,
        reason: `JS chunk ${jsChunkPath} returned HTTP ${jsResponse.status}`,
        evaluation: EMPTY_EVALUATION,
        probedRoutes,
        cssAssetUrl: cssAssetPath,
        jsChunkUrl: jsChunkPath,
        searchBootstrapUrl,
      };
    }

    const evaluation = evaluatePagesDeployedArtifactProbes({
      html: combinedHtml,
      jsChunkContent: jsResponse.body,
      basePath,
      cssAssetUrl: cssAssetPath,
      jsChunkUrl: jsChunkPath,
    });

    const reason = evaluationFailureReason(evaluation, basePath);
    if (reason !== null) {
      return {
        ok: false,
        reason,
        evaluation,
        probedRoutes,
        cssAssetUrl: cssAssetPath,
        jsChunkUrl: jsChunkPath,
        searchBootstrapUrl,
      };
    }

    return {
      ok: true,
      evaluation,
      probedRoutes,
      cssAssetUrl: cssAssetPath,
      jsChunkUrl: jsChunkPath,
      searchBootstrapUrl,
    };
  } finally {
    await session.cleanup().catch(() => {});
  }
}

/**
 * Maps an absolute site path (may include basePath) to a loopback request URL
 * against a static-export session whose `baseUrl` already includes basePath.
 */
export function absoluteSitePathToRequestUrl(
  baseUrl: string,
  basePath: string,
  absoluteSitePath: string,
): string {
  if (basePath !== "" && absoluteSitePath.startsWith(basePath)) {
    const stripped = absoluteSitePath.slice(basePath.length);
    return `${baseUrl}${stripped === "" ? "/" : stripped}`;
  }
  return `${baseUrl}${absoluteSitePath}`;
}
