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
import { useOptionalReferenceChrome } from "@/lib/i18n/reference-chrome-context";
import { formatReferenceChromeTemplate } from "@/lib/i18n/reference-chrome-labels";
import { assignCliCommandRegistryAnchors } from "@/lib/references/assign-family-reference-anchors";
import type { CliCommandNormalized } from "@/lib/references/family-normalized-models";
import { cn } from "@/lib/utils";
import { CliCommandReference } from "./CliCommandReference";
import type { CliCommandInventoryProps } from "./types";

type CliFilterableCommand = ReferenceInventoryFilterableItem & {
  command: CliCommandNormalized;
};

function toFilterable(command: CliCommandNormalized): CliFilterableCommand {
  const item: CliFilterableCommand = {
    identityText: command.commandPath,
    aliases: command.aliases,
    command,
  };
  if (command.description !== undefined) {
    item.description = command.description;
  } else if (command.shortDescription !== undefined) {
    item.description = command.shortDescription;
  }
  if (command.lifecycle !== undefined) {
    item.lifecycle = command.lifecycle;
  }
  if (command.visibility !== undefined) {
    item.visibility = command.visibility;
  }
  return item;
}

/**
 * Render a full CLI command inventory from W04-normalized projections.
 *
 * Assigns stable ReferenceAnchorRegistry anchors, exposes keyboard-accessible
 * inventory filters as ephemeral presentation state, and surfaces empty/error
 * chrome for missing or malformed inventories. Does not load page-local
 * copied CLI inventory JSON.
 */
export function CliCommandInventory({
  inventory,
  className,
}: CliCommandInventoryProps) {
  const chrome = useOptionalReferenceChrome();
  const inv = chrome?.inventory.cli;
  const [filter, setFilter] = useState<ReferenceInventoryFilterState>(() =>
    createReferenceInventoryFilterState(),
  );

  const anchoredCommands = useMemo(() => {
    if (inventory.state !== "success") {
      return [];
    }
    return assignCliCommandRegistryAnchors(inventory.commands).commands;
  }, [inventory]);

  if (inventory.state === "empty") {
    return (
      <div
        className={cn(className)}
        data-cli-command-inventory=""
        data-inventory-state="empty"
      >
        <ReferenceEmptyState
          chrome={chrome}
          description={
            inv?.emptyDescription ??
            "No published CLI commands were found in the resolved contract."
          }
          family="cli"
          title={inv?.emptyTitle ?? "No CLI commands"}
        />
      </div>
    );
  }

  if (inventory.state === "error") {
    return (
      <div
        className={cn(className)}
        data-cli-command-inventory=""
        data-inventory-state="error"
      >
        <ReferenceErrorState
          chrome={chrome}
          description={
            inv?.errorDescription ??
            "The CLI inventory could not be normalized from the package contract."
          }
          detail={inventory.detail}
          family="cli"
          title={inv?.errorTitle ?? "CLI inventory error"}
        />
      </div>
    );
  }

  if (anchoredCommands.length === 0) {
    return (
      <div
        className={cn(className)}
        data-cli-command-inventory=""
        data-inventory-state="empty"
      >
        <ReferenceEmptyState
          chrome={chrome}
          description={
            inv?.emptyDescription ??
            "No published CLI commands were found in the resolved contract."
          }
          family="cli"
          title={inv?.emptyTitle ?? "No CLI commands"}
        />
      </div>
    );
  }

  const filterable = anchoredCommands.map(toFilterable);
  const filtered = filterReferenceInventoryItems(filterable, filter);
  const countTemplate =
    anchoredCommands.length === 1
      ? (inv?.countOne ??
        "{count} published CLI command from the package contract.")
      : (inv?.countMany ??
        "{count} published CLI commands from the package contract.");

  return (
    <div
      className={cn("flex flex-col gap-6", className)}
      data-cli-command-count={String(anchoredCommands.length)}
      data-cli-command-filtered-count={String(filtered.length)}
      data-cli-command-inventory=""
      data-inventory-state="success"
    >
      <p className="m-0 text-sm text-muted-foreground">
        {formatReferenceChromeTemplate(countTemplate, {
          count: anchoredCommands.length,
        })}
      </p>

      <ReferenceInventoryFilter
        chrome={chrome}
        filter={filter}
        legend={inv?.filterLegend ?? "Filter CLI commands"}
        onFilterChange={setFilter}
        publishedVisibilities={anchoredCommands.map(
          (command) => command.visibility,
        )}
        queryLabel={inv?.queryLabel ?? "Command path"}
        queryPlaceholder={
          inv?.queryPlaceholder ??
          "Filter by command path, alias, or description…"
        }
        resultCount={filtered.length}
        totalCount={anchoredCommands.length}
      />

      {filtered.length === 0 ? (
        <p
          className="m-0 text-sm text-muted-foreground"
          data-cli-command-filter-empty=""
          role="status"
        >
          {inv?.filterEmpty ?? "No CLI commands match the current filters."}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((item) => (
            <CliCommandReference
              chrome={chrome}
              command={item.command}
              key={item.command.id}
              packageVersion={inventory.packageVersion}
            />
          ))}
        </div>
      )}
    </div>
  );
}
