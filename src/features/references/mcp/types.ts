/**
 * Prop contracts for W10 MCP family reference renderers.
 *
 * Callers pass already-normalized MCP projections (W03 → W04). These types do
 * not acquire package artifacts or invent missing input schema fields.
 */

import type { ReferenceChromeMessages } from "@/lib/content/ui-messages.types";
import type { McpToolNormalized } from "@/lib/references/family-normalized-models";

export type McpToolReferenceProps = {
  /** Normalized MCP tool from W04 projections. */
  tool: McpToolNormalized;
  /**
   * Package version from the resolved manifest identity. Accepted for call-site
   * compatibility with inventory shells; MCP tool cards do not render it.
   */
  packageVersion?: string;
  chrome?: ReferenceChromeMessages;
  className?: string;
};

/**
 * Inventory input for the MCP reference list. Success carries normalized
 * tools only — never page-local copied inventory JSON as source of truth.
 */
export type McpToolInventoryInput =
  | {
      state: "success";
      tools: readonly McpToolNormalized[];
      packageVersion?: string;
    }
  | { state: "empty" }
  | { state: "error"; detail?: string };

export type McpToolInventoryProps = {
  inventory: McpToolInventoryInput;
  className?: string;
};
