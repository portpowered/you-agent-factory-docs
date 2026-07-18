import {
  ReferenceEmptyState,
  ReferenceErrorState,
} from "@/components/references/shared";
import { cn } from "@/lib/utils";
import { CliCommandReference } from "./CliCommandReference";
import type { CliCommandInventoryProps } from "./types";

/**
 * Render a full CLI command inventory from W04-normalized projections.
 *
 * Empty and malformed inventories surface accessible shared chrome states.
 * Does not load page-local copied CLI inventory JSON.
 */
export function CliCommandInventory({
  inventory,
  className,
}: CliCommandInventoryProps) {
  if (inventory.state === "empty") {
    return (
      <div
        className={cn(className)}
        data-cli-command-inventory=""
        data-inventory-state="empty"
      >
        <ReferenceEmptyState
          description="No published CLI commands were found in the resolved contract."
          family="cli"
          title="No CLI commands"
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
          description="The CLI inventory could not be normalized from the package contract."
          detail={inventory.detail}
          family="cli"
          title="CLI inventory error"
        />
      </div>
    );
  }

  if (inventory.commands.length === 0) {
    return (
      <div
        className={cn(className)}
        data-cli-command-inventory=""
        data-inventory-state="empty"
      >
        <ReferenceEmptyState
          description="No published CLI commands were found in the resolved contract."
          family="cli"
          title="No CLI commands"
        />
      </div>
    );
  }

  return (
    <div
      className={cn("flex flex-col gap-6", className)}
      data-cli-command-count={String(inventory.commands.length)}
      data-cli-command-inventory=""
      data-inventory-state="success"
    >
      <p className="m-0 text-sm text-muted-foreground">
        {inventory.commands.length} published CLI{" "}
        {inventory.commands.length === 1 ? "command" : "commands"} from the
        package contract.
      </p>
      <div className="flex flex-col gap-4">
        {inventory.commands.map((command) => (
          <CliCommandReference
            command={command}
            key={command.id}
            packageVersion={inventory.packageVersion}
          />
        ))}
      </div>
    </div>
  );
}
