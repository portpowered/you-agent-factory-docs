/**
 * Page-local MDX components for references/packaged-factories-index.
 * Index-only map: mounts the generated-index renderer and nothing from
 * replay, recordings, visualizers, or playback state.
 * Merged by route-family-local-docs-page-load when this file is present.
 * Do not register these in the shared module MDX map.
 */
import { PackagedFactoriesIndex } from "./PackagedFactoriesIndex";

export const pageMdxComponents = {
  PackagedFactoriesIndex,
};
