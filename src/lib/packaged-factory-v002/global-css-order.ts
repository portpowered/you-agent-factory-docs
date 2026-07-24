/**
 * Host global CSS order for packaged-factory 0.0.2 Batch 1.
 *
 * Pure constants/helpers only. The docs host must load components styles
 * before factory-visualizers styles, and must not import the React Flow
 * stylesheet directly (visualizer styles already pull it in).
 */

/** Package styles entry that must appear first among the Batch 1 pair. */
export const PACKAGED_FACTORY_V002_COMPONENTS_STYLES_IMPORT =
  "@you-agent-factory/components/styles.css" as const;

/** Package styles entry that must follow components (includes React Flow CSS). */
export const PACKAGED_FACTORY_V002_VISUALIZERS_STYLES_IMPORT =
  "@you-agent-factory/factory-visualizers/styles.css" as const;

/** Direct React Flow stylesheet paths that must not appear in host globals. */
export const PACKAGED_FACTORY_V002_FORBIDDEN_REACT_FLOW_STYLE_IMPORTS = [
  "@xyflow/react/dist/style.css",
  "@xyflow/react/dist/base.css",
  "@xyflow/react/dist/style.min.css",
] as const;

export class GlobalCssOrderError extends Error {
  readonly code:
    | "missing-components-styles"
    | "missing-visualizers-styles"
    | "duplicate-styles-import"
    | "styles-out-of-order"
    | "forbidden-react-flow-import";

  constructor(code: GlobalCssOrderError["code"], message: string) {
    super(message);
    this.name = "GlobalCssOrderError";
    this.code = code;
  }
}

/**
 * Extract `@import` targets from a CSS source string (quote-delimited only).
 * Ignores `@import url(...)` forms that are not used by the host global entry.
 */
export function extractCssImportTargets(cssSource: string): string[] {
  const targets: string[] = [];
  const importPattern =
    /@import\s+(?:"([^"]+)"|'([^']+)')\s*(?:layer\([^)]*\))?\s*;/g;
  for (const match of cssSource.matchAll(importPattern)) {
    const target = match[1] ?? match[2];
    if (target !== undefined && target.length > 0) {
      targets.push(target);
    }
  }
  return targets;
}

function countOccurrences(targets: readonly string[], needle: string): number {
  return targets.filter((target) => target === needle).length;
}

/**
 * Fail closed when host global CSS import order violates the Batch 1 contract.
 */
export function assertPackagedFactoryV002GlobalCssOrder(
  cssSource: string,
): void {
  const targets = extractCssImportTargets(cssSource);

  const componentsCount = countOccurrences(
    targets,
    PACKAGED_FACTORY_V002_COMPONENTS_STYLES_IMPORT,
  );
  const visualizersCount = countOccurrences(
    targets,
    PACKAGED_FACTORY_V002_VISUALIZERS_STYLES_IMPORT,
  );

  if (componentsCount === 0) {
    throw new GlobalCssOrderError(
      "missing-components-styles",
      `Host global CSS must import ${PACKAGED_FACTORY_V002_COMPONENTS_STYLES_IMPORT} exactly once.`,
    );
  }
  if (componentsCount > 1) {
    throw new GlobalCssOrderError(
      "duplicate-styles-import",
      `Host global CSS must import ${PACKAGED_FACTORY_V002_COMPONENTS_STYLES_IMPORT} exactly once (found ${componentsCount}).`,
    );
  }

  if (visualizersCount === 0) {
    throw new GlobalCssOrderError(
      "missing-visualizers-styles",
      `Host global CSS must import ${PACKAGED_FACTORY_V002_VISUALIZERS_STYLES_IMPORT} exactly once.`,
    );
  }
  if (visualizersCount > 1) {
    throw new GlobalCssOrderError(
      "duplicate-styles-import",
      `Host global CSS must import ${PACKAGED_FACTORY_V002_VISUALIZERS_STYLES_IMPORT} exactly once (found ${visualizersCount}).`,
    );
  }

  const componentsIndex = targets.indexOf(
    PACKAGED_FACTORY_V002_COMPONENTS_STYLES_IMPORT,
  );
  const visualizersIndex = targets.indexOf(
    PACKAGED_FACTORY_V002_VISUALIZERS_STYLES_IMPORT,
  );
  if (componentsIndex >= visualizersIndex) {
    throw new GlobalCssOrderError(
      "styles-out-of-order",
      `Host global CSS must import ${PACKAGED_FACTORY_V002_COMPONENTS_STYLES_IMPORT} before ${PACKAGED_FACTORY_V002_VISUALIZERS_STYLES_IMPORT}.`,
    );
  }

  for (const forbidden of PACKAGED_FACTORY_V002_FORBIDDEN_REACT_FLOW_STYLE_IMPORTS) {
    if (targets.includes(forbidden)) {
      throw new GlobalCssOrderError(
        "forbidden-react-flow-import",
        `Host global CSS must not import ${forbidden} directly; React Flow base styles come from ${PACKAGED_FACTORY_V002_VISUALIZERS_STYLES_IMPORT}.`,
      );
    }
  }

  // Catch alternate direct React Flow stylesheet forms (url(), unquoted path).
  const forbiddenReactFlowPattern =
    /@import\s+(?:url\()?["']?[^"')]*@xyflow\/react\/[^"')]+["']?\)?\s*;/i;
  if (forbiddenReactFlowPattern.test(cssSource)) {
    throw new GlobalCssOrderError(
      "forbidden-react-flow-import",
      `Host global CSS must not import an @xyflow/react stylesheet directly; React Flow base styles come from ${PACKAGED_FACTORY_V002_VISUALIZERS_STYLES_IMPORT}.`,
    );
  }
}
