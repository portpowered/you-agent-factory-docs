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
import { assignJavascriptRuntimeRegistryAnchors } from "@/lib/references/assign-family-reference-anchors";
import type {
  JavascriptSharedSchemaNormalized,
  JavascriptSymbolNormalized,
} from "@/lib/references/family-normalized-models";
import { cn } from "@/lib/utils";
import { JavaScriptSharedSchemaReference } from "./JavaScriptSharedSchemaReference";
import { JavaScriptSymbolReference } from "./JavaScriptSymbolReference";
import type { JavaScriptRuntimeInventoryProps } from "./types";

type JsFilterableSymbol = ReferenceInventoryFilterableItem & {
  kind: "symbol";
  symbol: JavascriptSymbolNormalized;
};

type JsFilterableSchema = ReferenceInventoryFilterableItem & {
  kind: "schema";
  schema: JavascriptSharedSchemaNormalized;
};

type JsFilterableItem = JsFilterableSymbol | JsFilterableSchema;

function toFilterableSymbol(
  symbol: JavascriptSymbolNormalized,
): JsFilterableSymbol {
  const item: JsFilterableSymbol = {
    kind: "symbol",
    identityText: symbol.symbolPath,
    aliases: [symbol.id, symbol.name],
    symbol,
  };
  if (symbol.description !== undefined) {
    item.description = symbol.description;
  }
  if (symbol.lifecycle !== undefined) {
    item.lifecycle = symbol.lifecycle;
  }
  if (symbol.visibility !== undefined) {
    item.visibility = symbol.visibility;
  }
  return item;
}

function toFilterableSchema(
  schema: JavascriptSharedSchemaNormalized,
): JsFilterableSchema {
  const item: JsFilterableSchema = {
    kind: "schema",
    identityText: schema.id,
    schema,
  };
  if (schema.name.length > 0) {
    item.aliases = [schema.name];
  }
  if (schema.title !== undefined) {
    item.description = schema.title;
  } else if (schema.description !== undefined) {
    item.description = schema.description;
  }
  if (schema.lifecycle !== undefined) {
    item.lifecycle = schema.lifecycle;
  }
  if (schema.visibility !== undefined) {
    item.visibility = schema.visibility;
  }
  return item;
}

/**
 * Render a full JavaScript runtime inventory (symbols + shared schemas) from
 * W04-normalized projections.
 *
 * Assigns stable ReferenceAnchorRegistry anchors and keyboard-accessible
 * inventory filters as ephemeral presentation state. Empty and malformed
 * inventories surface accessible shared chrome states.
 */
export function JavaScriptRuntimeInventory({
  inventory,
  className,
}: JavaScriptRuntimeInventoryProps) {
  const [filter, setFilter] = useState<ReferenceInventoryFilterState>(() =>
    createReferenceInventoryFilterState(),
  );

  const anchored = useMemo(() => {
    if (inventory.state !== "success") {
      return { symbols: [], sharedSchemas: [] };
    }
    const result = assignJavascriptRuntimeRegistryAnchors(
      inventory.symbols,
      inventory.sharedSchemas,
    );
    return {
      symbols: result.symbols,
      sharedSchemas: result.sharedSchemas,
    };
  }, [inventory]);

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

  if (anchored.symbols.length === 0 && anchored.sharedSchemas.length === 0) {
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

  const filterable: JsFilterableItem[] = [
    ...anchored.symbols.map(toFilterableSymbol),
    ...anchored.sharedSchemas.map(toFilterableSchema),
  ];
  const filtered = filterReferenceInventoryItems(filterable, filter);
  const filteredSymbols = filtered.filter(
    (item): item is JsFilterableSymbol => item.kind === "symbol",
  );
  const filteredSchemas = filtered.filter(
    (item): item is JsFilterableSchema => item.kind === "schema",
  );
  const totalCount = anchored.symbols.length + anchored.sharedSchemas.length;

  return (
    <div
      className={cn("flex flex-col gap-8", className)}
      data-inventory-state="success"
      data-javascript-runtime-inventory=""
      data-javascript-shared-schema-count={String(
        anchored.sharedSchemas.length,
      )}
      data-javascript-symbol-count={String(anchored.symbols.length)}
      data-javascript-filtered-count={String(filtered.length)}
    >
      <p className="m-0 text-sm text-muted-foreground">
        {anchored.symbols.length} published JavaScript{" "}
        {anchored.symbols.length === 1 ? "symbol" : "symbols"} and{" "}
        {anchored.sharedSchemas.length} shared{" "}
        {anchored.sharedSchemas.length === 1 ? "schema" : "schemas"} from the
        package contract.
      </p>

      <ReferenceInventoryFilter
        filter={filter}
        legend="Filter JavaScript runtime items"
        onFilterChange={setFilter}
        publishedVisibilities={[
          ...anchored.symbols.map((symbol) => symbol.visibility),
          ...anchored.sharedSchemas.map((schema) => schema.visibility),
        ]}
        queryLabel="Symbol or schema"
        queryPlaceholder="Filter by symbol path, schema id, or description…"
        resultCount={filtered.length}
        totalCount={totalCount}
      />

      {filtered.length === 0 ? (
        <p
          className="m-0 text-sm text-muted-foreground"
          data-javascript-filter-empty=""
          role="status"
        >
          No JavaScript runtime items match the current filters.
        </p>
      ) : (
        <>
          {filteredSymbols.length > 0 ? (
            <section className="flex flex-col gap-4" data-javascript-symbols="">
              <h2 className="m-0 text-lg font-semibold tracking-tight">
                Symbols
              </h2>
              <div className="flex flex-col gap-4">
                {filteredSymbols.map((item) => (
                  <JavaScriptSymbolReference
                    key={item.symbol.id}
                    packageVersion={inventory.packageVersion}
                    symbol={item.symbol}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {filteredSchemas.length > 0 ? (
            <section
              className="flex flex-col gap-4"
              data-javascript-shared-schemas=""
            >
              <h2 className="m-0 text-lg font-semibold tracking-tight">
                Shared schemas
              </h2>
              <div className="flex flex-col gap-4">
                {filteredSchemas.map((item) => (
                  <JavaScriptSharedSchemaReference
                    key={item.schema.id}
                    packageVersion={inventory.packageVersion}
                    schema={item.schema}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
