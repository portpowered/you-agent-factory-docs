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
} from "@/features/references/shared";
import { useOptionalReferenceChrome } from "@/lib/i18n/reference-chrome-context";
import { formatReferenceChromeTemplate } from "@/lib/i18n/reference-chrome-labels";
import { assignCliCommandRegistryAnchors } from "@/lib/references/assign-family-reference-anchors";
import { groupCliCommands } from "@/lib/references/cli-command-groups";
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
 * Commands are grouped into the families a reader navigates by (`you factory`,
 * `you session`, …) using the same pure helper that builds the page's
 * right-rail table of contents, so headings and rail links cannot drift.
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
  const groups = groupCliCommands(filtered.map((item) => item.command));
  const countTemplate =
    anchoredCommands.length === 1
      ? (inv?.countOne ??
        "{count} published CLI command from the package contract.")
      : (inv?.countMany ??
        "{count} published CLI commands from the package contract.");

  return (
    <div
      // `not-prose` is load-bearing: fumadocs prose margins outrank a plain
      // `m-0` utility, so without it every heading, paragraph, and table here
      // carries an inherited margin on top of the flex gap. That is what made
      // the rhythm uneven and pushed each command heading half its 24px top
      // margin below its own anchor control.
      className={cn("not-prose flex flex-col gap-12", className)}
      data-cli-command-count={String(anchoredCommands.length)}
      data-cli-command-filtered-count={String(filtered.length)}
      data-cli-command-inventory=""
      data-inventory-state="success"
    >
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
        groups.map((group) => (
          <section
            className="flex scroll-mt-24 flex-col gap-5"
            data-cli-command-group={group.path}
            id={group.anchor}
            key={group.path}
          >
            <h2 className="m-0 border-b border-border pb-3 font-mono text-3xl font-bold leading-tight tracking-tight">
              {group.path}
            </h2>
            {group.commands.map((command) => (
              <CliCommandReference
                chrome={chrome}
                command={command}
                key={command.id}
                packageVersion={inventory.packageVersion}
              />
            ))}
          </section>
        ))
      )}

      <p className="m-0 text-sm text-muted-foreground">
        {formatReferenceChromeTemplate(countTemplate, {
          count: anchoredCommands.length,
        })}
      </p>
    </div>
  );
}
