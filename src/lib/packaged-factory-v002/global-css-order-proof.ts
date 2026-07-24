/**
 * Observable host proof for packaged-factory 0.0.2 global CSS order.
 *
 * Reads `src/app/globals.css` and asserts the Batch 1 stylesheet contract:
 * components styles before visualizers styles; no direct React Flow import.
 * Also resolves the visualizers styles export so the host pin is installable.
 */

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import {
  assertPackagedFactoryV002GlobalCssOrder,
  PACKAGED_FACTORY_V002_VISUALIZERS_STYLES_IMPORT,
} from "./global-css-order";

const require = createRequire(import.meta.url);

/** Default host global stylesheet relative to the docs repo root. */
export const PACKAGED_FACTORY_V002_HOST_GLOBALS_CSS_PATH = join(
  "src",
  "app",
  "globals.css",
);

/**
 * Resolve the absolute filesystem path for the visualizers styles export.
 * Throws if the export map entry cannot be resolved (missing install / bad export).
 */
export function resolveFactoryVisualizersStylesPath(): string {
  return require.resolve(PACKAGED_FACTORY_V002_VISUALIZERS_STYLES_IMPORT);
}

/**
 * Prove host globals.css satisfies the Batch 1 CSS order contract and that
 * factory-visualizers styles resolve (including nested React Flow import).
 */
export function provePackagedFactoryV002GlobalCssOrder(
  repoRoot: string = process.cwd(),
): {
  globalsCssPath: string;
  visualizersStylesPath: string;
  visualizersStylesContainsReactFlowImport: boolean;
} {
  const globalsCssPath = join(
    repoRoot,
    PACKAGED_FACTORY_V002_HOST_GLOBALS_CSS_PATH,
  );
  const cssSource = readFileSync(globalsCssPath, "utf8");
  assertPackagedFactoryV002GlobalCssOrder(cssSource);

  const visualizersStylesPath = resolveFactoryVisualizersStylesPath();
  const visualizersCss = readFileSync(visualizersStylesPath, "utf8");
  const visualizersStylesContainsReactFlowImport =
    /@import\s+["']@xyflow\/react\/dist\/style\.css["']\s*;/.test(
      visualizersCss,
    );

  if (!visualizersStylesContainsReactFlowImport) {
    throw new Error(
      `${PACKAGED_FACTORY_V002_VISUALIZERS_STYLES_IMPORT} must import @xyflow/react/dist/style.css so the host can omit a direct React Flow stylesheet.`,
    );
  }

  return {
    globalsCssPath,
    visualizersStylesPath,
    visualizersStylesContainsReactFlowImport,
  };
}
