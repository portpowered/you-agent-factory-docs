/**
 * Page-local MCP inventory mount for `/docs/references/mcp-reference`.
 *
 * Resolves the package MCP contract at build/static-render time (W03 → W04)
 * and passes already-normalized inventory props into the public W10
 * `McpToolInventory` surface. Server-only — do not import into client
 * bundles.
 */
import {
  McpToolInventory,
  type McpToolInventoryInput,
} from "@/components/references/mcp";
import { loadMcpReferenceInventory } from "@/lib/references/load-mcp-reference-inventory";

export type McpReferenceInventoryProps = {
  /**
   * Optional inventory override for page-local empty/error proofs.
   * Production MDX omits this and loads the package contract.
   */
  inventory?: McpToolInventoryInput;
};

export function McpReferenceInventory({
  inventory,
}: McpReferenceInventoryProps = {}) {
  const resolved = inventory ?? loadMcpReferenceInventory();
  return <McpToolInventory inventory={resolved} />;
}
