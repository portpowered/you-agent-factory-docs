import {
  ReferenceEmptyState,
  ReferenceErrorState,
} from "@/components/references/shared";
import { cn } from "@/lib/utils";
import { McpToolReference } from "./McpToolReference";
import type { McpToolInventoryProps } from "./types";

/**
 * Render a full MCP tool inventory from W04-normalized projections.
 *
 * Empty and malformed inventories surface accessible shared chrome states.
 */
export function McpToolInventory({
  inventory,
  className,
}: McpToolInventoryProps) {
  if (inventory.state === "empty") {
    return (
      <div
        className={cn(className)}
        data-inventory-state="empty"
        data-mcp-tool-inventory=""
      >
        <ReferenceEmptyState
          description="No published MCP tools were found in the resolved contract."
          family="mcp"
          title="No MCP tools"
        />
      </div>
    );
  }

  if (inventory.state === "error") {
    return (
      <div
        className={cn(className)}
        data-inventory-state="error"
        data-mcp-tool-inventory=""
      >
        <ReferenceErrorState
          description="The MCP inventory could not be normalized from the package contract."
          detail={inventory.detail}
          family="mcp"
          title="MCP inventory error"
        />
      </div>
    );
  }

  if (inventory.tools.length === 0) {
    return (
      <div
        className={cn(className)}
        data-inventory-state="empty"
        data-mcp-tool-inventory=""
      >
        <ReferenceEmptyState
          description="No published MCP tools were found in the resolved contract."
          family="mcp"
          title="No MCP tools"
        />
      </div>
    );
  }

  return (
    <div
      className={cn("flex flex-col gap-6", className)}
      data-inventory-state="success"
      data-mcp-tool-count={String(inventory.tools.length)}
      data-mcp-tool-inventory=""
    >
      <p className="m-0 text-sm text-muted-foreground">
        {inventory.tools.length} published MCP{" "}
        {inventory.tools.length === 1 ? "tool" : "tools"} from the package
        contract.
      </p>
      <div className="flex flex-col gap-4">
        {inventory.tools.map((tool) => (
          <McpToolReference
            key={tool.id}
            packageVersion={inventory.packageVersion}
            tool={tool}
          />
        ))}
      </div>
    </div>
  );
}
