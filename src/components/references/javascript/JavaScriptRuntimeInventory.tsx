"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";
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
import { assignJavascriptRuntimeRegistryAnchors } from "@/lib/references/assign-family-reference-anchors";
import type {
  JavascriptSharedSchemaNormalized,
  JavascriptSymbolNormalized,
} from "@/lib/references/family-normalized-models";
import { cn } from "@/lib/utils";
import { JavaScriptSharedSchemaReference } from "./JavaScriptSharedSchemaReference";
import { JavaScriptSymbolReference } from "./JavaScriptSymbolReference";
import { JAVASCRIPT_RUNTIME_SECTION_ANCHORS } from "./javascript-runtime-section-anchors";
import { filterJavascriptSymbolsExcludingSharedSchemaDuplicates } from "./javascript-shared-schema-presentation";
import type {
  JavaScriptRuntimeInventoryInput,
  JavaScriptRuntimeInventoryProps,
} from "./types";

type JsFilterableSymbol = ReferenceInventoryFilterableItem & {
  kind: "symbol";
  symbol: JavascriptSymbolNormalized;
};

type JsFilterableSchema = ReferenceInventoryFilterableItem & {
  kind: "schema";
  schema: JavascriptSharedSchemaNormalized;
};

type JsFilterableItem = JsFilterableSymbol | JsFilterableSchema;

type SuccessInventory = Extract<
  JavaScriptRuntimeInventoryInput,
  { state: "success" }
>;

type AnchoredInventory = {
  symbols: readonly JavascriptSymbolNormalized[];
  sharedSchemas: readonly JavascriptSharedSchemaNormalized[];
};

type JavaScriptRuntimeInventoryContextValue = {
  inventory: SuccessInventory;
  anchored: AnchoredInventory;
  filter: ReferenceInventoryFilterState;
  setFilter: (next: ReferenceInventoryFilterState) => void;
  filteredSymbols: readonly JsFilterableSymbol[];
  filteredSchemas: readonly JsFilterableSchema[];
  filteredCount: number;
  totalCount: number;
};

const JavaScriptRuntimeInventoryContext =
  createContext<JavaScriptRuntimeInventoryContextValue | null>(null);

function useJavaScriptRuntimeInventoryContext(): JavaScriptRuntimeInventoryContextValue {
  const value = useContext(JavaScriptRuntimeInventoryContext);
  if (!value) {
    throw new Error(
      "JavaScript runtime inventory parts must render inside JavaScriptRuntimeInventoryProvider.",
    );
  }
  return value;
}

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

function InventoryEmptyState({
  className,
  description,
  title,
}: {
  className?: string;
  description: string;
  title: string;
}) {
  const chrome = useOptionalReferenceChrome();
  return (
    <div
      className={cn(className)}
      data-inventory-state="empty"
      data-javascript-runtime-inventory=""
    >
      <ReferenceEmptyState
        chrome={chrome}
        description={description}
        family="javascript"
        title={title}
      />
    </div>
  );
}

function InventoryErrorState({
  className,
  description,
  detail,
  title,
}: {
  className?: string;
  description: string;
  detail?: string;
  title: string;
}) {
  const chrome = useOptionalReferenceChrome();
  return (
    <div
      className={cn(className)}
      data-inventory-state="error"
      data-javascript-runtime-inventory=""
    >
      <ReferenceErrorState
        chrome={chrome}
        description={description}
        detail={detail}
        family="javascript"
        title={title}
      />
    </div>
  );
}

export type JavaScriptRuntimeInventoryProviderProps = {
  inventory: JavaScriptRuntimeInventoryInput;
  children: ReactNode;
  className?: string;
};

/**
 * Shared filter + anchored inventory state for composed page sections
 * (Symbols / Shared schemas as MDX `<Section>` TOC destinations) or the
 * default harness layout.
 */
export function JavaScriptRuntimeInventoryProvider({
  inventory,
  children,
  className,
}: JavaScriptRuntimeInventoryProviderProps) {
  const chrome = useOptionalReferenceChrome();
  const inv = chrome?.inventory.javascript;
  const [filter, setFilter] = useState<ReferenceInventoryFilterState>(() =>
    createReferenceInventoryFilterState(),
  );

  const anchored = useMemo(() => {
    if (inventory.state !== "success") {
      return { symbols: [], sharedSchemas: [] };
    }
    // Drop shared-schema duplicates before registry assignment so identical
    // identities do not collide as both symbol and schema-pointer anchors.
    const symbolsForDisplay =
      filterJavascriptSymbolsExcludingSharedSchemaDuplicates(
        inventory.symbols,
        inventory.sharedSchemas,
      );
    const result = assignJavascriptRuntimeRegistryAnchors(
      symbolsForDisplay,
      inventory.sharedSchemas,
    );
    return {
      symbols: result.symbols,
      sharedSchemas: result.sharedSchemas,
    };
  }, [inventory]);

  if (inventory.state === "empty") {
    return (
      <InventoryEmptyState
        className={className}
        description={
          inv?.emptyDescription ??
          "No published JavaScript symbols or shared schemas were found in the resolved contract."
        }
        title={inv?.emptyTitle ?? "No JavaScript runtime items"}
      />
    );
  }

  if (inventory.state === "error") {
    return (
      <InventoryErrorState
        className={className}
        description={
          inv?.errorDescription ??
          "The JavaScript inventory could not be normalized from the package contract."
        }
        detail={inventory.detail}
        title={inv?.errorTitle ?? "JavaScript inventory error"}
      />
    );
  }

  if (anchored.symbols.length === 0 && anchored.sharedSchemas.length === 0) {
    return (
      <InventoryEmptyState
        className={className}
        description={
          inv?.emptyDescription ??
          "No published JavaScript symbols or shared schemas were found in the resolved contract."
        }
        title={inv?.emptyTitle ?? "No JavaScript runtime items"}
      />
    );
  }

  // Shared-schema identities were already dropped from Symbols before anchors.
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

  const contextValue: JavaScriptRuntimeInventoryContextValue = {
    inventory,
    anchored,
    filter,
    setFilter,
    filteredSymbols,
    filteredSchemas,
    filteredCount: filtered.length,
    totalCount,
  };

  return (
    <JavaScriptRuntimeInventoryContext.Provider value={contextValue}>
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
        {children}
      </div>
    </JavaScriptRuntimeInventoryContext.Provider>
  );
}

/** Count line + keyboard-accessible inventory filters. */
export function JavaScriptRuntimeInventoryChrome() {
  const chrome = useOptionalReferenceChrome();
  const inv = chrome?.inventory.javascript;
  const { anchored, filter, setFilter, filteredCount, totalCount } =
    useJavaScriptRuntimeInventoryContext();

  const countTemplate =
    totalCount === 1
      ? (inv?.countOne ??
        "{count} published JavaScript runtime item from the package contract.")
      : (inv?.countMany ??
        "{count} published JavaScript runtime items from the package contract.");

  return (
    <>
      <p className="m-0 text-sm text-muted-foreground">
        {formatReferenceChromeTemplate(countTemplate, { count: totalCount })}
      </p>

      <ReferenceInventoryFilter
        chrome={chrome}
        filter={filter}
        legend={inv?.filterLegend ?? "Filter JavaScript runtime items"}
        onFilterChange={setFilter}
        publishedVisibilities={[
          ...anchored.symbols.map((symbol) => symbol.visibility),
          ...anchored.sharedSchemas.map((schema) => schema.visibility),
        ]}
        queryLabel={inv?.queryLabel ?? "Symbol or schema"}
        queryPlaceholder={
          inv?.queryPlaceholder ??
          "Filter by symbol path, schema id, or description…"
        }
        resultCount={filteredCount}
        totalCount={totalCount}
      />

      {filteredCount === 0 ? (
        <p
          className="m-0 text-sm text-muted-foreground"
          data-javascript-filter-empty=""
          role="status"
        >
          {inv?.filterEmpty ??
            "No JavaScript runtime items match the current filters."}
        </p>
      ) : null}
    </>
  );
}

export type JavaScriptRuntimeSymbolsListProps = {
  /**
   * When true, render the local Symbols heading with the stable TOC anchor.
   * Page MDX composition sets this false because `<Section id="symbols">`
   * owns the heading for On this page.
   */
  showHeading?: boolean;
};

/** Filtered symbol cards (shared-schema duplicates already removed). */
export function JavaScriptRuntimeSymbolsList({
  showHeading = true,
}: JavaScriptRuntimeSymbolsListProps) {
  const { inventory, filteredSymbols, filteredCount } =
    useJavaScriptRuntimeInventoryContext();

  if (filteredCount === 0 || filteredSymbols.length === 0) {
    return null;
  }

  // Standalone mounts own the TOC anchor on the local heading. Page MDX
  // composition leaves the anchor on `<Section id="symbols">` instead.
  return (
    <section className="flex flex-col gap-4" data-javascript-symbols="">
      {showHeading ? (
        <h2
          className="m-0 text-lg font-semibold tracking-tight"
          id={JAVASCRIPT_RUNTIME_SECTION_ANCHORS.symbols}
        >
          Symbols
        </h2>
      ) : null}
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
  );
}

export type JavaScriptRuntimeSharedSchemasListProps = {
  /**
   * When true, render the local Shared schemas heading with the stable TOC
   * anchor. Page MDX composition sets this false because
   * `<Section id="shared-schemas">` owns the heading for On this page.
   */
  showHeading?: boolean;
};

/** Filtered shared-schema cards. */
export function JavaScriptRuntimeSharedSchemasList({
  showHeading = true,
}: JavaScriptRuntimeSharedSchemasListProps) {
  const { inventory, filteredSchemas, filteredCount } =
    useJavaScriptRuntimeInventoryContext();

  if (filteredCount === 0 || filteredSchemas.length === 0) {
    return null;
  }

  // Standalone mounts own the TOC anchor on the local heading. Page MDX
  // composition leaves the anchor on `<Section id="shared-schemas">` instead.
  return (
    <section className="flex flex-col gap-4" data-javascript-shared-schemas="">
      {showHeading ? (
        <h2
          className="m-0 text-lg font-semibold tracking-tight"
          id={JAVASCRIPT_RUNTIME_SECTION_ANCHORS.sharedSchemas}
        >
          Shared schemas
        </h2>
      ) : null}
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
  );
}

/**
 * Render a full JavaScript runtime inventory (symbols + shared schemas) from
 * W04-normalized projections.
 *
 * Assigns stable ReferenceAnchorRegistry anchors and keyboard-accessible
 * inventory filters as ephemeral presentation state. Empty and malformed
 * inventories surface accessible shared chrome states.
 *
 * Standalone mounts (harness / unit tests) keep local Symbols / Shared schemas
 * headings with stable anchors. The published page composes provider parts
 * under MDX `<Section>` tags so On this page can traverse those destinations.
 */
export function JavaScriptRuntimeInventory({
  inventory,
  className,
}: JavaScriptRuntimeInventoryProps) {
  return (
    <JavaScriptRuntimeInventoryProvider
      className={className}
      inventory={inventory}
    >
      <JavaScriptRuntimeInventoryChrome />
      <JavaScriptRuntimeSymbolsList showHeading />
      <JavaScriptRuntimeSharedSchemasList showHeading />
    </JavaScriptRuntimeInventoryProvider>
  );
}
