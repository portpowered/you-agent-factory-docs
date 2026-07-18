"use client";

import { useMemo, useState } from "react";
import {
  createReferenceInventoryFilterState,
  filterReferenceInventoryItems,
  ReferenceEmptyState,
  ReferenceErrorState,
  ReferenceInventoryFilter,
  type ReferenceInventoryFilterableItem,
  type ReferenceInventoryFilterState,
} from "@/components/references/shared";
import { assignMcpToolRegistryAnchors } from "@/lib/references/assign-family-reference-anchors";
import type { McpToolNormalized } from "@/lib/references/family-normalized-models";
import { cn } from "@/lib/utils";
import { McpToolReference } from "./McpToolReference";
import type { McpToolInventoryProps } from "./types";

type McpFilterableTool = ReferenceInventoryFilterableItem & {
  tool: McpToolNormalized;
};

function toFilterable(tool: McpToolNormalized): McpFilterableTool {
  const item: McpFilterableTool = {
    identityText: tool.name,
    tool,
  };
  if (tool.description !== undefined) {
    item.description = tool.description;
  }
  if (tool.lifecycle !== undefined) {
    item.lifecycle = tool.lifecycle;
  }
  return item;
}

/**
 * Render a full MCP tool inventory from W04-normalized projections.
 *
 * Assigns stable ReferenceAnchorRegistry anchors and keyboard-accessible
 * inventory filters (text + lifecycle). MCP tools do not publish visibility,
 * so the visibility facet is omitted. Empty and malformed inventories surface
 * accessible shared chrome states.
 */
export function McpToolInventory({
  inventory,
  className,
}: McpToolInventoryProps) {
  const [filter, setFilter] = useState<ReferenceInventoryFilterState>(() =>
    createReferenceInventoryFilterState(),
  );

  const anchoredTools = useMemo(() => {
    if (inventory.state !== "success") {
      return [];
    }
    return assignMcpToolRegistryAnchors(inventory.tools).tools;
  }, [inventory]);

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

  if (anchoredTools.length === 0) {
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

  const filterable = anchoredTools.map(toFilterable);
  const filtered = filterReferenceInventoryItems(filterable, filter);

  return (
    <div
      className={cn("flex flex-col gap-6", className)}
      data-inventory-state="success"
      data-mcp-tool-count={String(anchoredTools.length)}
      data-mcp-tool-filtered-count={String(filtered.length)}
      data-mcp-tool-inventory=""
    >
      <p className="m-0 text-sm text-muted-foreground">
        {anchoredTools.length} published MCP{" "}
        {anchoredTools.length === 1 ? "tool" : "tools"} from the package
        contract.
      </p>

      <ReferenceInventoryFilter
        filter={filter}
        legend="Filter MCP tools"
        onFilterChange={setFilter}
        queryLabel="Tool name"
        queryPlaceholder="Filter by tool name or description…"
        resultCount={filtered.length}
        showVisibilityFilter={false}
        totalCount={anchoredTools.length}
      />

      {filtered.length === 0 ? (
        <p
          className="m-0 text-sm text-muted-foreground"
          data-mcp-tool-filter-empty=""
          role="status"
        >
          No MCP tools match the current filters.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((item) => (
            <McpToolReference
              key={item.tool.id}
              packageVersion={inventory.packageVersion}
              tool={item.tool}
            />
          ))}
        </div>
      )}
    </div>
  );
}
