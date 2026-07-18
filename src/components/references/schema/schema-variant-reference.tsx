/**
 * Overlay-aware schema display adapter for Worker/Workstation variant pages.
 *
 * Renders a base W04 definition with selected/excluded/conditional field
 * highlights from overlay-*shaped* presentation data. Does not implement W06
 * overlay validators, fixture validators, or migration rules.
 */

import type { ReferenceCrossLinkOutcome } from "@/lib/references/reference-cross-link-resolver";
import type { ReferenceDisplayProjection } from "@/lib/references/reference-display-projection";
import type {
  SchemaAddress,
  SchemaDefinitionModel,
} from "@/lib/references/schema-model";
import { cn } from "@/lib/utils";
import { SchemaDefinition } from "./schema-definition";
import type {
  SchemaExampleDisplay,
  SchemaExampleInput,
} from "./schema-example-display";
import { schemaFieldTreeNodesFromProperties } from "./schema-field-path";
import { SchemaSurface } from "./schema-surface";
import {
  annotateSchemaFieldTreeWithVariant,
  resolveSchemaVariantInput,
  type SchemaVariantOverlayPresentation,
} from "./schema-variant-display";
import type { SchemaFieldTreeNode, SchemaUiStatus } from "./types";

export type SchemaVariantReferenceProps = {
  /**
   * Explicit status. Non-ready values short-circuit to SchemaStatus messaging.
   * When omitted (or `ready`), status is derived from base + overlay inputs.
   */
  status?: SchemaUiStatus;
  statusTitle?: string;
  statusMessage?: string;
  /**
   * Base definition whose field descriptions/types remain authoritative.
   * Overlay presentation never invents or copies contract prose.
   */
  definition?: SchemaDefinitionModel;
  /**
   * Overlay-shaped presentation (selected/excluded/conditional fields).
   * Missing or incomplete overlay yields invalid/empty status outcomes.
   */
  overlay?: SchemaVariantOverlayPresentation | null;
  /** Optional W04 display projection for the base definition view. */
  projection?: ReferenceDisplayProjection;
  /**
   * Pre-resolved field tree for the base definition. Defaults to the
   * definition's property map (no `$ref` expansion).
   */
  fieldNodes?: readonly SchemaFieldTreeNode[];
  resolve?: (address: SchemaAddress) => ReferenceCrossLinkOutcome;
  examples?: readonly SchemaExampleDisplay[];
  exampleInputs?: readonly SchemaExampleInput[];
  showEmptyExamples?: boolean;
  pagePath?: string;
  defaultExpanded?: boolean;
  className?: string;
  "data-testid"?: string;
};

export function SchemaVariantReference({
  status,
  statusTitle,
  statusMessage,
  definition,
  overlay,
  projection,
  fieldNodes,
  resolve,
  examples,
  exampleInputs,
  showEmptyExamples = false,
  pagePath,
  defaultExpanded = false,
  className,
  "data-testid": testId = "schema-variant-reference",
}: SchemaVariantReferenceProps) {
  const resolved = resolveSchemaVariantInput({
    status,
    statusTitle,
    statusMessage,
    definition,
    overlay,
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

  const base = resolved.definition;
  const baseNodes =
    fieldNodes ??
    (base.properties !== undefined
      ? schemaFieldTreeNodesFromProperties(base.properties)
      : []);
  const annotatedNodes = annotateSchemaFieldTreeWithVariant(
    baseNodes,
    resolved.applicabilityByPath,
  );
  const variantLabel = resolved.overlay.variantLabel;

  return (
    <SchemaSurface
      className={cn("space-y-4", className)}
      data-testid={testId}
      definition={{ definition: base, address: base.address }}
      status="ready"
    >
      <div
        className="min-w-0 space-y-4"
        data-schema-variant-reference=""
        data-schema-variant-label={variantLabel ?? ""}
      >
        <header className="space-y-1">
          <p
            className="font-medium text-foreground text-sm"
            data-schema-variant-heading=""
          >
            {variantLabel !== undefined && variantLabel.trim().length > 0
              ? `Variant: ${variantLabel}`
              : "Schema variant"}
          </p>
        </header>

        <SchemaDefinition
          data-testid={`${testId}-definition`}
          defaultExpanded={defaultExpanded}
          definition={base}
          exampleInputs={exampleInputs}
          examples={examples}
          fieldNodes={annotatedNodes}
          pagePath={pagePath}
          projection={projection}
          resolve={resolve}
          showEmptyExamples={showEmptyExamples}
        />
      </div>
    </SchemaSurface>
  );
}
