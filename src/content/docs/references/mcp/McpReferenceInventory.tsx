/**
 * Page-local MCP inventory mount for `/docs/references/mcp`.
 *
 * Resolves the package MCP contract at build/static-render time (W03 → W04)
 * and passes already-normalized inventory props into the public W10
 * `McpToolInventory` surface. Server-only — do not import into client
 * bundles.
 */
import { McpToolInventory } from "@/components/references/mcp";
import { loadMcpReferenceInventory } from "@/lib/references/load-mcp-reference-inventory";

export function McpReferenceInventory() {
  const inventory = loadMcpReferenceInventory();
  return <McpToolInventory inventory={inventory} />;
}
