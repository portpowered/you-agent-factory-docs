/**
 * Full schema definition view: metadata, copyable anchors, composition, fields.
 *
 * Consumes W04 `SchemaDefinitionModel` (and optional display projection). Does
 * not invent missing descriptions/examples or unstable fragment IDs.
 */

import { ContractDescriptionProse } from "@/lib/i18n/contract-description-prose";
import type { ReferenceCrossLinkOutcome } from "@/lib/references/reference-cross-link-resolver";
import type { ReferenceDisplayProjection } from "@/lib/references/reference-display-projection";
import type {
  SchemaAddress,
  SchemaDefinitionModel,
} from "@/lib/references/schema-model";
import { cn } from "@/lib/utils";
import {
  schemaAddressDeepLink,
  schemaPointerBreadcrumbSegments,
} from "./schema-anchor";
import { SchemaBreadcrumb } from "./schema-breadcrumb";
import { SchemaComposition } from "./schema-composition";
import {
  SchemaConstraintList,
  schemaConstraintListPropsFromProjection,
} from "./schema-constraint-list";
import { SchemaDefaultValue } from "./schema-default-value";
import type {
  SchemaExampleDisplay,
  SchemaExampleInput,
} from "./schema-example-display";
import { SchemaExamplePanel } from "./schema-example-panel";
import { schemaFieldTreeNodesFromProperties } from "./schema-field-path";
import { SchemaFieldTree } from "./schema-field-tree";
import { schemaRefLinkDisplayFromAddress } from "./schema-ref-display";
import { SchemaRefLink } from "./schema-ref-link";
import { SchemaTypeBadge } from "./schema-type-badge";
import type { SchemaFieldTreeNode } from "./types";

export type SchemaDefinitionProps = {
  definition: SchemaDefinitionModel;
  /**
   * Optional W04 display projection for title/description/type/anchor.
   * When omitted, metadata is derived from the definition model and the
   * address pointer via `anchorForIdentity`.
   */
  projection?: ReferenceDisplayProjection;
  /**
   * Pre-resolved field tree nodes. Defaults to flat property map nodes
   * (no nested `$ref` expansion).
   */
  fieldNodes?: readonly SchemaFieldTreeNode[];
  /**
   * Optional one-hop resolver for composition / discriminator members.
   */
  resolve?: (address: SchemaAddress) => ReferenceCrossLinkOutcome;
  /**
   * Pre-projected example display entries. When set, takes precedence over
   * `exampleInputs` and the definition's raw `examples`.
   */
  examples?: readonly SchemaExampleDisplay[];
  /**
   * Annotated examples with optional authored/generated origin. Used when
   * `examples` is omitted; takes precedence over raw definition examples.
   */
  exampleInputs?: readonly SchemaExampleInput[];
  /**
   * When true, render an empty examples affordance even if the definition has
   * no examples. Default false so absent examples stay omitted (never
   * fabricated).
   */
  showEmptyExamples?: boolean;
  /** Owning page path used to build full deep-link href values. */
  pagePath?: string;
  /** Initial expansion for nested field rows. Default: false. */
  defaultExpanded?: boolean;
  /**
   * When true, omit secondary field path labels that equal the leaf name so
   * each field is listed once. Events catalog views opt in; other reference
   * families keep the default name+path chrome.
   */
  showFieldPathWhenDistinct?: boolean;
  className?: string;
  "data-testid"?: string;
};

function definitionTypeSummary(
  definition: SchemaDefinitionModel,
): string | undefined {
  if (definition.type === undefined) {
    return undefined;
  }
  return Array.isArray(definition.type)
    ? definition.type.join(" | ")
    : definition.type;
}

function definitionTitle(
  definition: SchemaDefinitionModel,
  projection: ReferenceDisplayProjection | undefined,
): string {
  if (projection?.title !== undefined && projection.title.length > 0) {
    return projection.title;
  }
  if (definition.title !== undefined && definition.title.length > 0) {
    return definition.title;
  }
  const leaf = definition.address.pointer
    .split("/")
    .filter((segment) => segment.length > 0)
    .at(-1);
  return leaf ?? definition.address.pointer;
}

export function SchemaDefinition({
  definition,
  projection,
  fieldNodes,
  resolve,
  examples,
  exampleInputs,
  showEmptyExamples = false,
  pagePath,
  defaultExpanded = false,
  showFieldPathWhenDistinct = false,
  className,
  "data-testid": testId = "schema-definition",
}: SchemaDefinitionProps) {
  const deepLink = schemaAddressDeepLink(definition.address, pagePath);
  const anchor = projection?.anchor ?? deepLink.anchor;
  const href =
    projection !== undefined &&
    pagePath !== undefined &&
    pagePath.trim().length > 0
      ? `${pagePath.replace(/\/$/, "")}#${anchor}`
      : deepLink.href;
  const title = definitionTitle(definition, projection);
  const description = projection?.description ?? definition.description;
  const typeSummary =
    projection?.typeSummary ?? definitionTypeSummary(definition);
  const format = projection?.format ?? definition.format;
  const defaultValue =
    projection !== undefined && "default" in projection
      ? projection.default
      : definition.default;
  const breadcrumbSegments = schemaPointerBreadcrumbSegments(
    definition.address.pointer,
  );

  const constraintProps = schemaConstraintListPropsFromProjection(
    {
      constraints: projection?.constraints ?? definition.constraints,
      enum: projection?.enum ?? definition.enum,
    },
    {
      const: definition.const,
      additionalProperties: definition.additionalProperties,
    },
  );

  const nodes =
    fieldNodes ??
    (definition.properties !== undefined
      ? schemaFieldTreeNodesFromProperties(definition.properties)
      : []);

  const hasComposition =
    definition.composition !== undefined &&
    ((definition.composition.oneOf?.length ?? 0) > 0 ||
      (definition.composition.anyOf?.length ?? 0) > 0 ||
      (definition.composition.allOf?.length ?? 0) > 0 ||
      definition.composition.discriminator !== undefined);

  const refTarget = definition.refTarget;
  const headingId = `schema-def-${anchor}`;

  return (
    <article
      aria-labelledby={headingId}
      className={cn(
        "scroll-mt-20 min-w-0 space-y-4 outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      data-schema-definition-pointer={definition.address.pointer}
      data-testid={testId}
      id={anchor}
      tabIndex={-1}
    >
      <header className="space-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h2
            className="font-semibold text-foreground text-lg"
            data-schema-definition-title=""
            id={headingId}
          >
            {title}
          </h2>
          <SchemaTypeBadge format={format} typeSummary={typeSummary} />
        </div>

        <SchemaBreadcrumb
          anchor={anchor}
          aria-label={`Deep link for ${title}`}
          href={href}
          segments={breadcrumbSegments}
        />

        {description !== undefined ? (
          <ContractDescriptionProse
            className="text-muted-foreground text-sm"
            data-schema-definition-description=""
          >
            {description}
          </ContractDescriptionProse>
        ) : null}

        {defaultValue !== undefined ? (
          <SchemaDefaultValue value={defaultValue} />
        ) : null}

        <SchemaConstraintList {...constraintProps} />

        {refTarget !== undefined ? (
          <div
            className="flex min-w-0 flex-wrap items-baseline gap-1"
            data-schema-definition-ref=""
          >
            <span className="font-mono text-muted-foreground text-xs">
              $ref →
            </span>
            <SchemaRefLink
              display={schemaRefLinkDisplayFromAddress(refTarget, {
                pagePath,
              })}
            />
          </div>
        ) : null}
      </header>

      {hasComposition && definition.composition !== undefined ? (
        <SchemaComposition
          composition={definition.composition}
          pagePath={pagePath}
          resolve={resolve}
        />
      ) : null}

      {nodes.length > 0 ? (
        <section
          aria-label={`Fields for ${title}`}
          className="min-w-0"
          data-schema-definition-fields=""
        >
          <h3 className="mb-2 font-medium text-foreground text-sm">Fields</h3>
          <SchemaFieldTree
            defaultExpanded={defaultExpanded}
            nodes={nodes}
            pagePath={pagePath}
            showFieldPathWhenDistinct={showFieldPathWhenDistinct}
          />
        </section>
      ) : null}

      <SchemaExamplePanel
        data-testid="schema-definition-examples"
        exampleInputs={exampleInputs}
        examples={examples}
        showEmpty={showEmptyExamples}
        values={
          examples === undefined && exampleInputs === undefined
            ? definition.examples
            : undefined
        }
      />
    </article>
  );
}
