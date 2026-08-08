/**
 * Top-level SchemaReference entry for complete schemas or addressed definitions.
 *
 * Composes SchemaSurface status outcomes, SchemaDefinition, SchemaFilter, and
 * prior field/composition/example/anchor displays into one ownership surface.
 * Invalid or missing addresses yield explicit status UI — never a crash.
 */

import type { ReactNode } from "react";
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
import type { SchemaTypeScale } from "./schema-type-scale";
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
  /**
   * Forwarded to SchemaFilter. Pass false on a page that renders the whole
   * catalog below the filter, so the list is a search result rather than a
   * standing duplicate of the page body.
   */
  showDefinitionListWhenEmpty?: boolean;
  /**
   * Ordered, titled sections over the catalog. When set, complete mode renders
   * these instead of one flat "Definitions" list, and each section heading gets
   * a stable anchor a right-rail table of contents can link to. Grouping is the
   * owning page's call — this surface only renders what it is handed, and a
   * definition missing from every group is simply not rendered.
   */
  catalogGroups?: readonly SchemaCatalogGroup[];
  /**
   * Section chrome for the primary (root) definition, so it reads as the first
   * titled section rather than an untitled block above the groups. Omit to
   * render the primary definition bare, as embeds do.
   */
  primarySection?: SchemaCatalogSection;
  /**
   * Heading scale. `"page"` also renders each definition as a separated card;
   * `"embed"` (default) keeps the flat, quiet treatment every embed uses.
   */
  typeScale?: SchemaTypeScale;
  className?: string;
  "data-testid"?: string;
};

/** Heading, blurb, and stable fragment for one titled section. */
export type SchemaCatalogSection = {
  id: string;
  title: string;
  description?: string;
  /** In-page fragment for the section heading. */
  anchor: string;
};

/** One titled section of the definition catalog. */
export type SchemaCatalogGroup = SchemaCatalogSection & {
  definitions: readonly SchemaDefinitionModel[];
};

/**
 * `page` scale renders every definition as its own bordered block so a reader
 * can tell where one schema object ends and the next begins — the flat scale
 * relies on the surrounding prose for that separation.
 */
const PAGE_DEFINITION_CARD_CLASS =
  "scroll-mt-24 rounded-lg border border-border bg-background px-5 py-5";

/**
 * Titled section wrapper shared by the primary definition and each catalog
 * group, so both carry the same heading weight and the same anchor contract.
 */
function SchemaCatalogSectionShell({
  section,
  children,
}: {
  section: SchemaCatalogSection;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={`${section.anchor}-heading`}
      className="min-w-0 scroll-mt-24 space-y-5"
      data-schema-catalog-group={section.id}
      id={section.anchor}
    >
      <div className="space-y-2 border-border border-b pb-3">
        <h2
          className="m-0 font-bold text-3xl text-foreground leading-tight tracking-tight"
          id={`${section.anchor}-heading`}
        >
          {section.title}
        </h2>
        {section.description !== undefined ? (
          <p className="m-0 text-base text-muted-foreground">
            {section.description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

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
  showDefinitionListWhenEmpty = true,
  catalogGroups,
  primarySection,
  typeScale = "embed",
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
  const isPageScale = typeScale === "page";
  const definitionCardClass = isPageScale
    ? PAGE_DEFINITION_CARD_CLASS
    : undefined;

  const primaryDefinition = (
    <SchemaDefinition
      className={definitionCardClass}
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
      typeScale={typeScale}
    />
  );

  const catalogEntry = (entry: SchemaDefinitionModel) => (
    <SchemaDefinition
      className={definitionCardClass}
      data-testid={`${testId}-catalog-${entry.address.pointer}`}
      defaultExpanded={defaultExpanded}
      definition={entry}
      key={formatCatalogKey(entry.address)}
      pagePath={pagePath}
      resolve={resolve}
      typeScale={typeScale}
    />
  );

  return (
    <SchemaSurface
      className={cn(
        // `not-prose` is load-bearing at page scale: fumadocs prose margins
        // outrank a plain `m-0` utility, so without it every heading and
        // paragraph carries an inherited margin on top of the explicit rhythm.
        isPageScale ? "not-prose space-y-12" : "space-y-6",
        className,
      )}
      data-testid={testId}
      definition={{ definition: primary, address: primary.address }}
      status="ready"
    >
      <div
        className={cn("min-w-0", isPageScale ? "space-y-12" : "space-y-6")}
        data-schema-reference-mode={resolved.mode}
        data-schema-reference-pointer={primary.address.pointer}
        data-schema-reference-type-scale={typeScale}
      >
        {showDefinitionFilter || showFieldFilter ? (
          <SchemaFilter
            data-testid={`${testId}-filter`}
            defaultExpanded={defaultExpanded}
            definitions={showDefinitionFilter ? filterDefinitions : undefined}
            fieldNodes={showFieldFilter ? nodes : undefined}
            pagePath={pagePath}
            showDefinitionList={showDefinitionFilter}
            showDefinitionListWhenEmpty={showDefinitionListWhenEmpty}
            showFieldTree={false}
          />
        ) : null}

        {primarySection !== undefined ? (
          <SchemaCatalogSectionShell section={primarySection}>
            {primaryDefinition}
          </SchemaCatalogSectionShell>
        ) : (
          primaryDefinition
        )}

        {resolved.mode === "complete" &&
        showCatalog &&
        resolved.catalog.length > 0 ? (
          <section
            aria-label="Schema definitions"
            className={cn("min-w-0", isPageScale ? "space-y-12" : "space-y-6")}
            data-schema-reference="catalog"
          >
            {catalogGroups !== undefined && catalogGroups.length > 0 ? (
              catalogGroups.map((group) => (
                <SchemaCatalogSectionShell key={group.id} section={group}>
                  {group.definitions.map(catalogEntry)}
                </SchemaCatalogSectionShell>
              ))
            ) : (
              <>
                <h2
                  className={
                    isPageScale
                      ? "m-0 border-border border-b pb-3 font-bold text-3xl text-foreground leading-tight tracking-tight"
                      : "font-semibold text-foreground text-base"
                  }
                >
                  Definitions
                </h2>
                {resolved.catalog.map(catalogEntry)}
              </>
            )}
          </section>
        ) : null}
      </div>
    </SchemaSurface>
  );
}

function formatCatalogKey(address: SchemaAddress): string {
  return `${address.publicArtifactId}:${address.pointer}`;
}
