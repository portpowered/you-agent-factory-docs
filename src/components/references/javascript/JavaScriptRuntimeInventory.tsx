import {
  ReferenceEmptyState,
  ReferenceErrorState,
} from "@/components/references/shared";
import { cn } from "@/lib/utils";
import { JavaScriptSharedSchemaReference } from "./JavaScriptSharedSchemaReference";
import { JavaScriptSymbolReference } from "./JavaScriptSymbolReference";
import type { JavaScriptRuntimeInventoryProps } from "./types";

/**
 * Render a full JavaScript runtime inventory (symbols + shared schemas) from
 * W04-normalized projections.
 *
 * Empty and malformed inventories surface accessible shared chrome states.
 */
export function JavaScriptRuntimeInventory({
  inventory,
  className,
}: JavaScriptRuntimeInventoryProps) {
  if (inventory.state === "empty") {
    return (
      <div
        className={cn(className)}
        data-inventory-state="empty"
        data-javascript-runtime-inventory=""
      >
        <ReferenceEmptyState
          description="No published JavaScript symbols or shared schemas were found in the resolved contract."
          family="javascript"
          title="No JavaScript runtime items"
        />
      </div>
    );
  }

  if (inventory.state === "error") {
    return (
      <div
        className={cn(className)}
        data-inventory-state="error"
        data-javascript-runtime-inventory=""
      >
        <ReferenceErrorState
          description="The JavaScript inventory could not be normalized from the package contract."
          detail={inventory.detail}
          family="javascript"
          title="JavaScript inventory error"
        />
      </div>
    );
  }

  if (inventory.symbols.length === 0 && inventory.sharedSchemas.length === 0) {
    return (
      <div
        className={cn(className)}
        data-inventory-state="empty"
        data-javascript-runtime-inventory=""
      >
        <ReferenceEmptyState
          description="No published JavaScript symbols or shared schemas were found in the resolved contract."
          family="javascript"
          title="No JavaScript runtime items"
        />
      </div>
    );
  }

  return (
    <div
      className={cn("flex flex-col gap-8", className)}
      data-inventory-state="success"
      data-javascript-runtime-inventory=""
      data-javascript-shared-schema-count={String(
        inventory.sharedSchemas.length,
      )}
      data-javascript-symbol-count={String(inventory.symbols.length)}
    >
      <p className="m-0 text-sm text-muted-foreground">
        {inventory.symbols.length} published JavaScript{" "}
        {inventory.symbols.length === 1 ? "symbol" : "symbols"} and{" "}
        {inventory.sharedSchemas.length} shared{" "}
        {inventory.sharedSchemas.length === 1 ? "schema" : "schemas"} from the
        package contract.
      </p>

      {inventory.symbols.length > 0 ? (
        <section className="flex flex-col gap-4" data-javascript-symbols="">
          <h2 className="m-0 text-lg font-semibold tracking-tight">Symbols</h2>
          <div className="flex flex-col gap-4">
            {inventory.symbols.map((symbol) => (
              <JavaScriptSymbolReference
                key={symbol.id}
                packageVersion={inventory.packageVersion}
                symbol={symbol}
              />
            ))}
          </div>
        </section>
      ) : null}

      {inventory.sharedSchemas.length > 0 ? (
        <section
          className="flex flex-col gap-4"
          data-javascript-shared-schemas=""
        >
          <h2 className="m-0 text-lg font-semibold tracking-tight">
            Shared schemas
          </h2>
          <div className="flex flex-col gap-4">
            {inventory.sharedSchemas.map((schema) => (
              <JavaScriptSharedSchemaReference
                key={schema.id}
                packageVersion={inventory.packageVersion}
                schema={schema}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
