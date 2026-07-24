/**
 * Batch 5 packaged-factory reference family closeout — story 006 proofs.
 *
 * Tip-owned evidence that:
 * - parent index / deep-research / home Youi remain useful with JavaScript off
 * - Pages-prefixed static export resolves family routes under the project base
 * - visualizer CSS tokens resolve under factory-dark + factory-light
 * - host globals keep one components + one visualizers stylesheet (React Flow
 *   comes only via visualizers — no standalone `@xyflow/react` import)
 *
 * Composes Batch 1 global-CSS / theme-token proofs and shared export helpers.
 * Does not redesign package pins, globals.css, or landing composition.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";
import {
  DEFAULT_EXPORT_OUT_DIR,
  resolveExportHtmlFilePath,
} from "@/lib/build/export-out-directory";
import {
  exportHtmlReferencesBasePathAssets,
  exportHtmlReferencesRootLevelNextAssets,
} from "@/lib/build/verify-export-base-path";
import { verifyProjectSiteExportDirectory } from "@/lib/build/verify-project-site-export-consumers";
import { withBasePath } from "@/lib/navigation/site-path";
import {
  PACKAGED_FACTORY_V002_COMPONENTS_STYLES_IMPORT,
  PACKAGED_FACTORY_V002_FORBIDDEN_REACT_FLOW_STYLE_IMPORTS,
  PACKAGED_FACTORY_V002_VISUALIZERS_STYLES_IMPORT,
} from "@/lib/packaged-factory-v002/global-css-order";
import { provePackagedFactoryV002GlobalCssOrder } from "@/lib/packaged-factory-v002/global-css-order-proof";
import { PACKAGED_FACTORIES_ALLOWLIST_SLUGS } from "@/lib/packaged-factory-v002/packaged-factories-allowlist";
import {
  PACKAGED_FACTORY_V002_HOST_THEME_PALETTES,
  PACKAGED_FACTORY_V002_REQUIRED_VISUALIZER_THEME_PROPERTIES,
} from "@/lib/packaged-factory-v002/visualizer-theme-tokens";
import { provePackagedFactoryV002VisualizerThemeTokens } from "@/lib/packaged-factory-v002/visualizer-theme-tokens-proof";
import { stripScriptsFromHtml } from "./a11y-reference-no-js-html-contract";

/** Project-site Pages base path locked for closeout export proofs. */
export const PACKAGED_FACTORY_CLOSEOUT_PAGES_BASE_PATH =
  BUILT_APP_GITHUB_PAGES_BASE_PATH;

/** Family routes that must stay useful without client JavaScript. */
export const PACKAGED_FACTORY_CLOSEOUT_NO_JS_ROUTES = [
  {
    id: "parent-index",
    path: "/docs/references/packaged-factories-index",
    label: "Packaged factories index",
  },
  {
    id: "deep-research-child",
    path: "/docs/references/packaged-factories-index/deep-research",
    label: "Deep-research child",
  },
  {
    id: "home-youi",
    path: "/",
    label: "Home Youi",
  },
] as const;

export type PackagedFactoryCloseoutNoJsRouteId =
  (typeof PACKAGED_FACTORY_CLOSEOUT_NO_JS_ROUTES)[number]["id"];

/**
 * Family routes that must resolve under the Pages base path after a prefixed
 * static export (filesystem landings stay unprefixed under `out/`; hrefs and
 * `/_next` assets carry the base path).
 */
export const PACKAGED_FACTORY_CLOSEOUT_BASE_PATH_FAMILY_ROUTES = [
  "/",
  "/docs/references/packaged-factories-index",
  "/docs/references/packaged-factories-index/goal",
  "/docs/references/packaged-factories-index/deep-research",
] as const;

export const PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_PURPOSE_SNIPPET =
  "@you/deep-research investigates a research topic" as const;

export const PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_USAGE_SNIPPET =
  "you run --named @you/deep-research" as const;

export const PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_REQUIRED_HREFS = {
  javascriptRuntime: "/docs/references/javascript-runtime",
  dynamicWorkflows: "/docs/factories/dynamic-workflows",
} as const;

export const PACKAGED_FACTORY_CLOSEOUT_YOUI_GRAPH_FALLBACK_SELECTOR =
  "[data-youi-showcase-graph-fallback]" as const;

export type PackagedFactoryCloseoutNoJsEvidence = {
  readonly routeId: PackagedFactoryCloseoutNoJsRouteId;
  readonly scriptsAbsent: true;
  readonly usefulOutput: true;
};

export type PackagedFactoryCloseoutCssEvidence = {
  readonly componentsStylesImport: typeof PACKAGED_FACTORY_V002_COMPONENTS_STYLES_IMPORT;
  readonly visualizersStylesImport: typeof PACKAGED_FACTORY_V002_VISUALIZERS_STYLES_IMPORT;
  readonly forbiddenReactFlowImports: readonly string[];
  readonly visualizersContainsReactFlowImport: true;
  readonly themePalettes: readonly (typeof PACKAGED_FACTORY_V002_HOST_THEME_PALETTES)[number][];
  readonly requiredThemeProperties: readonly (typeof PACKAGED_FACTORY_V002_REQUIRED_VISUALIZER_THEME_PROPERTIES)[number][];
};

export type PackagedFactoryCloseoutBasePathEvidence = {
  readonly basePath: typeof PACKAGED_FACTORY_CLOSEOUT_PAGES_BASE_PATH;
  readonly familyRouteUrls: readonly string[];
  readonly hasPrefixedNextAssets: true;
  readonly hasRootLevelNextAssets: false;
  readonly familyHtmlPresent: true;
};

export type PackagedFactoryCloseoutExportCssEvidence = {
  readonly noJsRoutes: readonly PackagedFactoryCloseoutNoJsRouteId[];
  readonly css: PackagedFactoryCloseoutCssEvidence;
  readonly basePath: typeof PACKAGED_FACTORY_CLOSEOUT_PAGES_BASE_PATH;
  readonly basePathFamilyRoutes: readonly (typeof PACKAGED_FACTORY_CLOSEOUT_BASE_PATH_FAMILY_ROUTES)[number][];
};

export class PackagedFactoryCloseoutExportCssError extends Error {
  readonly code:
    | "no-js-missing-output"
    | "css-contract-failed"
    | "base-path-contract-failed"
    | "export-html-missing"
    | "route-contract-failed";

  constructor(
    code: PackagedFactoryCloseoutExportCssError["code"],
    message: string,
    options?: { cause?: unknown },
  ) {
    super(
      message,
      options?.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "PackagedFactoryCloseoutExportCssError";
    this.code = code;
  }
}

/** Pure contract snapshot for story 006 ownership locks. */
export function provePackagedFactoryReferenceFamilyCloseoutExportCssContract(): PackagedFactoryCloseoutExportCssEvidence {
  return {
    noJsRoutes: PACKAGED_FACTORY_CLOSEOUT_NO_JS_ROUTES.map(
      (route) => route.id,
    ) as PackagedFactoryCloseoutNoJsRouteId[],
    css: {
      componentsStylesImport: PACKAGED_FACTORY_V002_COMPONENTS_STYLES_IMPORT,
      visualizersStylesImport: PACKAGED_FACTORY_V002_VISUALIZERS_STYLES_IMPORT,
      forbiddenReactFlowImports: [
        ...PACKAGED_FACTORY_V002_FORBIDDEN_REACT_FLOW_STYLE_IMPORTS,
      ],
      visualizersContainsReactFlowImport: true,
      themePalettes: [...PACKAGED_FACTORY_V002_HOST_THEME_PALETTES],
      requiredThemeProperties: [
        ...PACKAGED_FACTORY_V002_REQUIRED_VISUALIZER_THEME_PROPERTIES,
      ],
    },
    basePath: PACKAGED_FACTORY_CLOSEOUT_PAGES_BASE_PATH,
    basePathFamilyRoutes: [
      ...PACKAGED_FACTORY_CLOSEOUT_BASE_PATH_FAMILY_ROUTES,
    ],
  };
}

/**
 * Tip proof: host globals keep one components + one visualizers stylesheet,
 * and visualizers styles still pull React Flow base CSS.
 */
export function provePackagedFactoryCloseoutOneReactFlowStylesheet(
  repoRoot: string = process.cwd(),
): PackagedFactoryCloseoutCssEvidence {
  try {
    const order = provePackagedFactoryV002GlobalCssOrder(repoRoot);
    if (!order.visualizersStylesContainsReactFlowImport) {
      throw new PackagedFactoryCloseoutExportCssError(
        "css-contract-failed",
        `${PACKAGED_FACTORY_V002_VISUALIZERS_STYLES_IMPORT} must import @xyflow/react/dist/style.css.`,
      );
    }
    return {
      componentsStylesImport: PACKAGED_FACTORY_V002_COMPONENTS_STYLES_IMPORT,
      visualizersStylesImport: PACKAGED_FACTORY_V002_VISUALIZERS_STYLES_IMPORT,
      forbiddenReactFlowImports: [
        ...PACKAGED_FACTORY_V002_FORBIDDEN_REACT_FLOW_STYLE_IMPORTS,
      ],
      visualizersContainsReactFlowImport: true,
      themePalettes: [...PACKAGED_FACTORY_V002_HOST_THEME_PALETTES],
      requiredThemeProperties: [
        ...PACKAGED_FACTORY_V002_REQUIRED_VISUALIZER_THEME_PROPERTIES,
      ],
    };
  } catch (error) {
    if (error instanceof PackagedFactoryCloseoutExportCssError) {
      throw error;
    }
    throw new PackagedFactoryCloseoutExportCssError(
      "css-contract-failed",
      error instanceof Error ? error.message : String(error),
      { cause: error },
    );
  }
}

/**
 * Tip proof: required visualizer theme tokens resolve under factory-dark and
 * factory-light through the installed components cascade.
 */
export function provePackagedFactoryCloseoutVisualizerThemeTokens(
  repoRoot: string = process.cwd(),
): PackagedFactoryCloseoutCssEvidence {
  try {
    const proof = provePackagedFactoryV002VisualizerThemeTokens(repoRoot);
    for (const palette of PACKAGED_FACTORY_V002_HOST_THEME_PALETTES) {
      const resolved = proof.resolvedByPalette[palette];
      for (const property of PACKAGED_FACTORY_V002_REQUIRED_VISUALIZER_THEME_PROPERTIES) {
        if (!resolved[property] || resolved[property].trim().length === 0) {
          throw new PackagedFactoryCloseoutExportCssError(
            "css-contract-failed",
            `Missing resolved ${property} under ${palette}.`,
          );
        }
      }
    }
    return provePackagedFactoryCloseoutOneReactFlowStylesheet(repoRoot);
  } catch (error) {
    if (error instanceof PackagedFactoryCloseoutExportCssError) {
      throw error;
    }
    throw new PackagedFactoryCloseoutExportCssError(
      "css-contract-failed",
      error instanceof Error ? error.message : String(error),
      { cause: error },
    );
  }
}

function assertScriptsAbsent(html: string, routeId: string): string {
  const stripped = stripScriptsFromHtml(html);
  if (/<script\b/i.test(stripped)) {
    throw new PackagedFactoryCloseoutExportCssError(
      "no-js-missing-output",
      `Script tags remain after strip on ${routeId}; cannot prove no-JS readability.`,
    );
  }
  return stripped;
}

/**
 * Fail closed when parent-index script-stripped HTML loses mechanical
 * definition panels for the allowlisted factories.
 */
export function assertPackagedFactoryCloseoutNoJsParentIndex(
  html: string,
): PackagedFactoryCloseoutNoJsEvidence {
  const stripped = assertScriptsAbsent(html, "parent-index");
  for (const slug of PACKAGED_FACTORIES_ALLOWLIST_SLUGS) {
    const testId = `packaged-factory-definition-${slug}`;
    if (
      !stripped.includes(`data-testid="${testId}"`) &&
      !stripped.includes(`data-testid='${testId}'`)
    ) {
      throw new PackagedFactoryCloseoutExportCssError(
        "no-js-missing-output",
        `Parent index no-JS HTML missing definition panel for ${slug} (${testId}).`,
      );
    }
    if (!stripped.includes("data-packaged-factory-definition")) {
      throw new PackagedFactoryCloseoutExportCssError(
        "no-js-missing-output",
        "Parent index no-JS HTML missing data-packaged-factory-definition markers.",
      );
    }
  }
  return {
    routeId: "parent-index",
    scriptsAbsent: true,
    usefulOutput: true,
  };
}

/**
 * Fail closed when deep-research script-stripped HTML loses purpose, usage, or
 * the two required reference links.
 */
export function assertPackagedFactoryCloseoutNoJsDeepResearch(
  html: string,
): PackagedFactoryCloseoutNoJsEvidence {
  const stripped = assertScriptsAbsent(html, "deep-research-child");
  if (!stripped.includes("Purpose")) {
    throw new PackagedFactoryCloseoutExportCssError(
      "no-js-missing-output",
      "Deep-research no-JS HTML missing Purpose heading.",
    );
  }
  if (!stripped.includes("Usage")) {
    throw new PackagedFactoryCloseoutExportCssError(
      "no-js-missing-output",
      "Deep-research no-JS HTML missing Usage heading.",
    );
  }
  if (
    !stripped.includes(PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_PURPOSE_SNIPPET)
  ) {
    throw new PackagedFactoryCloseoutExportCssError(
      "no-js-missing-output",
      "Deep-research no-JS HTML missing purpose body snippet.",
    );
  }
  if (
    !stripped.includes(PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_USAGE_SNIPPET)
  ) {
    throw new PackagedFactoryCloseoutExportCssError(
      "no-js-missing-output",
      "Deep-research no-JS HTML missing usage invocation snippet.",
    );
  }
  for (const href of Object.values(
    PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_REQUIRED_HREFS,
  )) {
    if (!stripped.includes(href)) {
      throw new PackagedFactoryCloseoutExportCssError(
        "no-js-missing-output",
        `Deep-research no-JS HTML missing required href ${href}.`,
      );
    }
  }
  return {
    routeId: "deep-research-child",
    scriptsAbsent: true,
    usefulOutput: true,
  };
}

/**
 * Fail closed when home Youi script-stripped HTML loses the semantic/static
 * graph fallback (blank hole without client activation).
 */
export function assertPackagedFactoryCloseoutNoJsYoui(
  html: string,
): PackagedFactoryCloseoutNoJsEvidence {
  const stripped = assertScriptsAbsent(html, "home-youi");
  if (
    !stripped.includes("data-youi-showcase-graph-fallback") ||
    !stripped.includes('data-youi-showcase-graph-fallback=""')
  ) {
    throw new PackagedFactoryCloseoutExportCssError(
      "no-js-missing-output",
      `Home Youi no-JS HTML missing ${PACKAGED_FACTORY_CLOSEOUT_YOUI_GRAPH_FALLBACK_SELECTOR} semantic static graph.`,
    );
  }
  if (!stripped.includes("data-youi-showcase")) {
    throw new PackagedFactoryCloseoutExportCssError(
      "no-js-missing-output",
      "Home Youi no-JS HTML missing data-youi-showcase host.",
    );
  }
  return {
    routeId: "home-youi",
    scriptsAbsent: true,
    usefulOutput: true,
  };
}

export function assertPackagedFactoryCloseoutNoJsRoute(
  routeId: PackagedFactoryCloseoutNoJsRouteId,
  html: string,
): PackagedFactoryCloseoutNoJsEvidence {
  switch (routeId) {
    case "parent-index":
      return assertPackagedFactoryCloseoutNoJsParentIndex(html);
    case "deep-research-child":
      return assertPackagedFactoryCloseoutNoJsDeepResearch(html);
    case "home-youi":
      return assertPackagedFactoryCloseoutNoJsYoui(html);
    default: {
      const exhaustive: never = routeId;
      throw new PackagedFactoryCloseoutExportCssError(
        "route-contract-failed",
        `Unknown no-JS route id: ${String(exhaustive)}`,
      );
    }
  }
}

/**
 * Read trusted static-export HTML for each no-JS family route and prove useful
 * output after script stripping.
 */
export function provePackagedFactoryCloseoutNoJsFromExportDirectory(options: {
  outDir?: string;
  cwd?: string;
}): readonly PackagedFactoryCloseoutNoJsEvidence[] {
  const cwd = options.cwd ?? process.cwd();
  const outDir = options.outDir ?? DEFAULT_EXPORT_OUT_DIR;
  const absoluteOut = join(cwd, outDir);
  if (!existsSync(absoluteOut)) {
    throw new PackagedFactoryCloseoutExportCssError(
      "export-html-missing",
      `Missing export directory at ${outDir} — run \`make build\` first.`,
    );
  }

  return PACKAGED_FACTORY_CLOSEOUT_NO_JS_ROUTES.map((route) => {
    const htmlPath = resolveExportHtmlFilePath(outDir, route.path, cwd);
    if (!existsSync(htmlPath)) {
      throw new PackagedFactoryCloseoutExportCssError(
        "export-html-missing",
        `Missing export HTML for ${route.path} at ${htmlPath}.`,
      );
    }
    const html = readFileSync(htmlPath, "utf8");
    return assertPackagedFactoryCloseoutNoJsRoute(route.id, html);
  });
}

/** Pure: family routes compose to Pages-prefixed public URLs. */
export function assertPackagedFactoryCloseoutBasePathFamilyRouteUrls(
  basePath: string = PACKAGED_FACTORY_CLOSEOUT_PAGES_BASE_PATH,
): readonly string[] {
  if (basePath !== PACKAGED_FACTORY_CLOSEOUT_PAGES_BASE_PATH) {
    throw new PackagedFactoryCloseoutExportCssError(
      "base-path-contract-failed",
      `Expected Pages base path ${PACKAGED_FACTORY_CLOSEOUT_PAGES_BASE_PATH}, got ${basePath}.`,
    );
  }
  return PACKAGED_FACTORY_CLOSEOUT_BASE_PATH_FAMILY_ROUTES.map((route) => {
    const url = withBasePath(route, basePath);
    // withBasePath("/") appends "/" → `${basePath}/`; other routes stay
    // `${basePath}${route}` without an extra trailing slash.
    const expected = route === "/" ? `${basePath}/` : `${basePath}${route}`;
    if (url !== expected) {
      throw new PackagedFactoryCloseoutExportCssError(
        "base-path-contract-failed",
        `withBasePath(${route}) expected ${expected}, got ${url}.`,
      );
    }
    return url;
  });
}

/**
 * True when exported HTML looks like a Pages-prefixed project-site build
 * (prefixed `/_next`, no root `/_next`).
 */
export function isPackagedFactoryCloseoutPagesPrefixedExportHtml(
  html: string,
  basePath: string = PACKAGED_FACTORY_CLOSEOUT_PAGES_BASE_PATH,
): boolean {
  return (
    exportHtmlReferencesBasePathAssets(html, basePath) &&
    !exportHtmlReferencesRootLevelNextAssets(html)
  );
}

/**
 * Tip proof against a trusted Pages-prefixed `out/`: family HTML landings
 * exist, `/_next` assets are prefixed, and project-site consumers stay green
 * for family navigation hrefs.
 */
export function provePackagedFactoryCloseoutBasePathExport(options: {
  outDir?: string;
  cwd?: string;
  basePath?: string;
}): PackagedFactoryCloseoutBasePathEvidence {
  const cwd = options.cwd ?? process.cwd();
  const outDir = options.outDir ?? DEFAULT_EXPORT_OUT_DIR;
  const basePath =
    options.basePath ?? PACKAGED_FACTORY_CLOSEOUT_PAGES_BASE_PATH;
  const familyRouteUrls =
    assertPackagedFactoryCloseoutBasePathFamilyRouteUrls(basePath);

  for (const route of PACKAGED_FACTORY_CLOSEOUT_BASE_PATH_FAMILY_ROUTES) {
    const htmlPath = resolveExportHtmlFilePath(outDir, route, cwd);
    if (!existsSync(htmlPath)) {
      throw new PackagedFactoryCloseoutExportCssError(
        "export-html-missing",
        `Missing family export HTML for ${route} at ${htmlPath}. Reproduce with: GITHUB_PAGES_BASE_PATH=${basePath} make build`,
      );
    }
    const html = readFileSync(htmlPath, "utf8");
    if (!isPackagedFactoryCloseoutPagesPrefixedExportHtml(html, basePath)) {
      throw new PackagedFactoryCloseoutExportCssError(
        "base-path-contract-failed",
        `Export HTML for ${route} is not Pages-prefixed under ${basePath}. Reproduce with: GITHUB_PAGES_BASE_PATH=${basePath} make build`,
      );
    }
  }

  // Project-site consumer gate (home/docs/blog) on the same prefixed out/;
  // family landings are checked above for presence + `/_next` prefix shape.
  const verification = verifyProjectSiteExportDirectory({
    basePath,
    outDir,
    cwd,
  });

  if (!verification.ok) {
    throw new PackagedFactoryCloseoutExportCssError(
      "base-path-contract-failed",
      verification.reason,
    );
  }

  return {
    basePath: PACKAGED_FACTORY_CLOSEOUT_PAGES_BASE_PATH,
    familyRouteUrls,
    hasPrefixedNextAssets: true,
    hasRootLevelNextAssets: false,
    familyHtmlPresent: true,
  };
}

/**
 * Combined tip proof for CSS + no-JS (from current `out/`) + base-path URL
 * contract. Live Pages-prefixed directory verification is opt-in via
 * `proveBasePathExport` when a prefixed `out/` is available.
 */
export function provePackagedFactoryReferenceFamilyCloseoutExportCss(options?: {
  outDir?: string;
  cwd?: string;
  proveBasePathExport?: boolean;
}): {
  contract: PackagedFactoryCloseoutExportCssEvidence;
  css: PackagedFactoryCloseoutCssEvidence;
  noJs: readonly PackagedFactoryCloseoutNoJsEvidence[];
  basePathUrls: readonly string[];
  basePathExport: PackagedFactoryCloseoutBasePathEvidence | null;
} {
  const cwd = options?.cwd ?? process.cwd();
  const outDir = options?.outDir ?? DEFAULT_EXPORT_OUT_DIR;
  const contract =
    provePackagedFactoryReferenceFamilyCloseoutExportCssContract();
  const css = provePackagedFactoryCloseoutVisualizerThemeTokens(cwd);
  const noJs = provePackagedFactoryCloseoutNoJsFromExportDirectory({
    outDir,
    cwd,
  });
  const basePathUrls = assertPackagedFactoryCloseoutBasePathFamilyRouteUrls();
  const basePathExport = options?.proveBasePathExport
    ? provePackagedFactoryCloseoutBasePathExport({ outDir, cwd })
    : null;

  return { contract, css, noJs, basePathUrls, basePathExport };
}
