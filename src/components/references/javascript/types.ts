/**
 * Prop contracts for W10 JavaScript family reference renderers.
 *
 * Callers pass already-normalized JavaScript projections (W03 → W04). These
 * types do not acquire package artifacts or invent missing schema fields.
 */

import type {
  JavascriptSharedSchemaNormalized,
  JavascriptSymbolNormalized,
} from "@/lib/references/family-normalized-models";

export type JavaScriptSymbolReferenceProps = {
  /** Normalized JavaScript symbol from W04 projections. */
  symbol: JavascriptSymbolNormalized;
  /**
   * Package version when known from the resolved manifest identity. Absent
   * when the caller has no package version — never invent a version string.
   */
  packageVersion?: string;
  className?: string;
};

export type JavaScriptSharedSchemaReferenceProps = {
  /** Normalized shared schema from W04 projections. */
  schema: JavascriptSharedSchemaNormalized;
  packageVersion?: string;
  className?: string;
};

/**
 * Inventory input for the JavaScript runtime reference list. Success carries
 * normalized symbols and shared schemas only — never page-local copied
 * inventory JSON as source of truth.
 */
export type JavaScriptRuntimeInventoryInput =
  | {
      state: "success";
      symbols: readonly JavascriptSymbolNormalized[];
      sharedSchemas: readonly JavascriptSharedSchemaNormalized[];
      packageVersion?: string;
    }
  | { state: "empty" }
  | { state: "error"; detail?: string };

export type JavaScriptRuntimeInventoryProps = {
  inventory: JavaScriptRuntimeInventoryInput;
  className?: string;
};
