/**
 * Top-level SchemaReference entry for complete schemas or addressed definitions.
 *
 * Composes SchemaSurface status outcomes, SchemaDefinition, SchemaFilter, and
 * prior field/composition/example/anchor displays into one ownership surface.
 * Invalid or missing addresses yield explicit status UI — never a crash.
 */

import type { ReferenceCrossLinkOutcome } from "@/lib/references/reference-cross-link-resolver";
import type { ReferenceDisplayProjection } from "@/lib/references/reference-display-projection";
import type {
  SchemaAddress,
  SchemaDefinitionModel,
} from "@/lib/references/schema-model";
import { cn } from "@/lib/utils";
import {
  SchemaDefinition,
  type SchemaExamplesPlacement,
} from "./schema-definition";
import type {
  SchemaExampleDisplay,
  SchemaExampleInput,
} from "./schema-example-display";
import { schemaFieldTreeNodesFromProperties } from "./schema-field-path";
import { SchemaFilter } from "./schema-filter";
import { resolveSchemaReferenceInput } from "./schema-reference-display";
import { SchemaSurface } from "./schema-surface";
import type { SchemaFieldTreeNode, SchemaUiStatus } from "./types";

export type SchemaReferenceProps = {
  /**
   * Explicit status. Non-ready values short-circuit to SchemaStatus messaging.
   * When omitted (or `ready`), status is derived from root/definitions/address.
   */
  status?: SchemaUiStatus;
  statusTitle?: string;
  statusMessage?: string;
  /**
   * Root definition for complete-schema mode (root + nested/catalog defs).
   */
  root?: SchemaDefinitionModel;
  /**
   * Flat definition catalog for filter listing and address lookup.
   */
  definitions?: readonly SchemaDefinitionModel[];
  /**
   * When set, render only the addressed definition. Missing targets produce
   * an invalid status outcome rather than crashing.
   */
  address?: SchemaAddress;
  /**
   * Pre-resolved definition. Used for addressed mode when `address` is omitted,
   * or as a preferred match when `address` is set.
   */
  definition?: SchemaDefinitionModel;
  /**
   * Optional W04 display projection for the primary definition view.
   */
  projection?: ReferenceDisplayProjection;
  /**
   * Pre-resolved field tree for the primary definition. Defaults to the
   * definition's property map (no `$ref` expansion).
   */
  fieldNodes?: readonly SchemaFieldTreeNode[];
  /**
   * Optional one-hop resolver for composition / discriminator members.
   */
  resolve?: (address: SchemaAddress) => ReferenceCrossLinkOutcome;
  examples?: readonly SchemaExampleDisplay[];
  exampleInputs?: readonly SchemaExampleInput[];
  showEmptyExamples?: boolean;
  /**
   * Placement for the primary SchemaDefinition examples panel relative to
   * composition/fields. Default `"after-fields"`; pass `"before-body"` to
   * render examples above the definition body.
   */
  examplesPlacement?: SchemaExamplesPlacement;
  /** Owning page path for deep-link href values. */
  pagePath?: string;
  /** Initial expansion for nested field rows. */
  defaultExpanded?: boolean;
  /**
   * When true (default), show SchemaFilter over the catalog and/or primary
   * field tree. Filtering is UI state only.
   */
  showFilter?: boolean;
  /**
   * When true (default), complete mode also renders each catalog definition
   * below the primary root. Set false for large schemas (filter still lists
   * definitions when `showFilter` is enabled).
   */
  showCatalog?: boolean;
  className?: string;
  "data-testid"?: string;
};

export function SchemaReference({
  status,
  statusTitle,
  statusMessage,
  root,
  definitions,
  address,
  definition,
  projection,
  fieldNodes,
  resolve,
  examples,
  exampleInputs,
  showEmptyExamples = false,
  examplesPlacement = "after-fields",
  pagePath,
  defaultExpanded = false,
  showFilter = true,
  showCatalog = true,
  className,
  "data-testid": testId = "schema-reference",
}: SchemaReferenceProps) {
  const resolved = resolveSchemaReferenceInput({
    status,
    statusTitle,
    statusMessage,
    root,
    definitions,
    address,
    definition,
  });

  if (resolved.status !== "ready") {
    return (
      <SchemaSurface
        className={className}
        data-testid={testId}
        status={resolved.status}
        statusMessage={resolved.message}
        statusTitle={resolved.title}
      />
    );
  }

  const primary = resolved.definition;
  const nodes =
    fieldNodes ??
    (primary.properties !== undefined
      ? schemaFieldTreeNodesFromProperties(primary.properties)
      : []);
  const filterDefinitions =
    resolved.mode === "complete"
      ? [primary, ...resolved.catalog]
      : resolved.catalog.length > 0
        ? resolved.catalog
        : undefined;
  const showDefinitionFilter =
    showFilter &&
    filterDefinitions !== undefined &&
    filterDefinitions.length > 0;
  const showFieldFilter = showFilter && nodes.length > 0;

  return (
    <SchemaSurface
      className={cn("space-y-6", className)}
      data-testid={testId}
      definition={{ definition: primary, address: primary.address }}
      status="ready"
    >
      <div
        className="min-w-0 space-y-6"
        data-schema-reference-mode={resolved.mode}
        data-schema-reference-pointer={primary.address.pointer}
      >
        {showDefinitionFilter || showFieldFilter ? (
          <SchemaFilter
            data-testid={`${testId}-filter`}
            defaultExpanded={defaultExpanded}
            definitions={showDefinitionFilter ? filterDefinitions : undefined}
            fieldNodes={showFieldFilter ? nodes : undefined}
            pagePath={pagePath}
            showDefinitionList={showDefinitionFilter}
            showFieldTree={false}
          />
        ) : null}

        <SchemaDefinition
          data-testid={`${testId}-definition`}
          defaultExpanded={defaultExpanded}
          definition={primary}
          exampleInputs={exampleInputs}
          examples={examples}
          examplesPlacement={examplesPlacement}
          fieldNodes={nodes}
          pagePath={pagePath}
          projection={projection}
          resolve={resolve}
          showEmptyExamples={showEmptyExamples}
        />

        {resolved.mode === "complete" &&
        showCatalog &&
        resolved.catalog.length > 0 ? (
          <section
            aria-label="Schema definitions"
            className="min-w-0 space-y-6"
            data-schema-reference="catalog"
          >
            <h2 className="font-semibold text-foreground text-base">
              Definitions
            </h2>
            {resolved.catalog.map((entry) => (
              <SchemaDefinition
                data-testid={`${testId}-catalog-${entry.address.pointer}`}
                defaultExpanded={defaultExpanded}
                definition={entry}
                key={formatCatalogKey(entry.address)}
                pagePath={pagePath}
                resolve={resolve}
              />
            ))}
          </section>
        ) : null}
      </div>
    </SchemaSurface>
  );
}

function formatCatalogKey(address: SchemaAddress): string {
  return `${address.publicArtifactId}:${address.pointer}`;
}
