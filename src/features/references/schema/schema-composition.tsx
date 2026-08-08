/**
 * Composition and discriminator display for the W07 schema UI.
 *
 * Renders oneOf / anyOf / allOf branches and discriminator mappings as
 * SchemaRefLink rows. Members stay as links — never recursive definition trees.
 */

import type { ReferenceCrossLinkOutcome } from "@/lib/references/reference-cross-link-resolver";
import type {
  SchemaAddress,
  SchemaCompositionModel,
} from "@/lib/references/schema-model";
import { cn } from "@/lib/utils";
import {
  projectSchemaCompositionDisplay,
  type SchemaCompositionDisplay,
  type SchemaDiscriminatorDisplay,
  schemaCompositionKindLabel,
} from "./schema-ref-display";
import { SchemaRefLink } from "./schema-ref-link";
import {
  SCHEMA_SECTION_HEADING_CLASS,
  SCHEMA_SECTION_HEADING_TAG,
  type SchemaTypeScale,
} from "./schema-type-scale";

export type SchemaCompositionProps = {
  /**
   * Either a raw W04 composition model (projected internally) or a pre-built
   * display projection from `projectSchemaCompositionDisplay`.
   */
  composition?: SchemaCompositionModel;
  display?: SchemaCompositionDisplay;
  /**
   * Optional one-hop resolver for member / mapping addresses. When omitted,
   * addresses render as navigable stable-anchor links without catalog checks.
   */
  resolve?: (address: SchemaAddress) => ReferenceCrossLinkOutcome;
  /** Owning page path used to build full `href` values on member links. */
  pagePath?: string;
  /** Heading weight for branch/discriminator labels. See schema-type-scale. */
  typeScale?: SchemaTypeScale;
  className?: string;
  "data-testid"?: string;
};

function SchemaDiscriminatorPanel({
  discriminator,
  typeScale,
}: {
  discriminator: SchemaDiscriminatorDisplay;
  typeScale: SchemaTypeScale;
}) {
  const Heading = SCHEMA_SECTION_HEADING_TAG[typeScale];
  return (
    <section
      aria-label={`Discriminator on ${discriminator.propertyName}`}
      className="space-y-2"
      data-schema-discriminator=""
      data-schema-discriminator-property={discriminator.propertyName}
    >
      <Heading className={SCHEMA_SECTION_HEADING_CLASS[typeScale]}>
        Discriminator:{" "}
        <code className="font-mono text-xs">{discriminator.propertyName}</code>
      </Heading>
      {discriminator.mappings.length === 0 ? null : (
        <ul className="m-0 list-none space-y-1 p-0">
          {discriminator.mappings.map((mapping) => (
            <li
              className="flex min-w-0 flex-wrap items-baseline gap-2"
              data-schema-discriminator-value={mapping.value}
              key={mapping.value}
            >
              <code className="font-mono text-foreground text-xs">
                {mapping.value}
              </code>
              <span aria-hidden="true" className="text-muted-foreground">
                →
              </span>
              <SchemaRefLink display={mapping.link} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function SchemaComposition({
  composition,
  display: displayProp,
  resolve,
  pagePath,
  typeScale = "embed",
  className,
  "data-testid": testId = "schema-composition",
}: SchemaCompositionProps) {
  const BranchHeading = SCHEMA_SECTION_HEADING_TAG[typeScale];
  const display =
    displayProp ??
    (composition !== undefined
      ? projectSchemaCompositionDisplay(composition, { resolve, pagePath })
      : undefined);

  if (
    display === undefined ||
    (display.branches.length === 0 && display.discriminator === undefined)
  ) {
    return null;
  }

  return (
    <section
      aria-label="Schema composition"
      className={cn("space-y-4", className)}
      data-testid={testId}
    >
      {display.branches.map((branch) => (
        <section
          aria-label={`${schemaCompositionKindLabel(branch.kind)} composition`}
          className="space-y-2"
          data-schema-composition-kind={branch.kind}
          key={branch.kind}
        >
          <BranchHeading className={SCHEMA_SECTION_HEADING_CLASS[typeScale]}>
            {schemaCompositionKindLabel(branch.kind)}
          </BranchHeading>
          <ul className="m-0 list-none space-y-1 p-0">
            {branch.members.map((member) => {
              const memberKey = [
                branch.kind,
                member.kind,
                member.targetAddress?.publicArtifactId ?? "",
                member.targetAddress?.pointer ?? member.label,
                member.anchor ?? "",
              ].join("\0");
              return (
                <li
                  className="min-w-0"
                  data-schema-composition-member=""
                  key={memberKey}
                >
                  <SchemaRefLink display={member} />
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {display.discriminator !== undefined ? (
        <SchemaDiscriminatorPanel
          discriminator={display.discriminator}
          typeScale={typeScale}
        />
      ) : null}
    </section>
  );
}
