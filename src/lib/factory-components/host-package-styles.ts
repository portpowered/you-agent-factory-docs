/**
 * Host resolution helper for `@you-agent-factory/components/styles.css`.
 *
 * The app shell loads this entry once via `src/app/globals.css`. This module
 * only proves Node/Bun can resolve the published styles export map entry.
 */

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

/** Stable package styles export path used by the host global stylesheet. */
export const FACTORY_COMPONENTS_STYLES_EXPORT =
  "@you-agent-factory/components/styles.css" as const;

/**
 * Resolve the absolute filesystem path for the package styles entry.
 * Throws if the export map entry cannot be resolved (missing install / bad export).
 */
export function resolveFactoryComponentsStylesPath(): string {
  return require.resolve(FACTORY_COMPONENTS_STYLES_EXPORT);
}
