import type { ReactElement } from "react";
import { SchemaVariantReference } from "@/features/references/schema";
import { factoryVariantOverlayToSchemaVariantPresentation } from "@/lib/references/overlays/factory-variant-overlay-presentation";
import type { FactoryVariantOverlaySchema } from "@/lib/references/overlays/factory-variant-overlay-schema";
import type { SchemaDefinitionModel } from "@/lib/references/schema-model";

/**
 * Shared body for every worker / workstation variant page's schema embed.
 *
 * Each of those pages used to carry its own ~40-line copy of this component,
 * differing only in the slug substituted into the `data-*` attributes, the
 * overlay id, and which family loader it called. The markup, class names, and
 * `SchemaVariantReference` flags were identical everywhere, so they live here
 * once and the pages supply the three values that actually vary.
 *
 * `data-*` attribute names are derived from `id` so the per-page assertions
 * (`[data-cron-behavior-schema-embed]`, `[data-agent-worker-schema-embed]`, …)
 * keep matching without change.
 */
export type FactoryVariantSchemaEmbedProps = {
  /** Attribute stem, e.g. `cron-behavior` or `agent-worker`. */
  id: string;
  /** Overlay identifier, e.g. `behavior:CRON` or `worker:AGENT_WORKER`. */
  overlayId: string;
  /** Canonical route for the page hosting this embed. */
  pagePath: string;
  /** Base definition the overlay refines. */
  definition: SchemaDefinitionModel;
  /** Validated production overlay for this variant. */
  overlay: FactoryVariantOverlaySchema;
};

export function FactoryVariantSchemaEmbed({
  id,
  overlayId,
  pagePath,
  definition,
  overlay,
}: FactoryVariantSchemaEmbedProps) {
  const presentation =
    factoryVariantOverlayToSchemaVariantPresentation(overlay);

  return (
    <div
      className="min-w-0 space-y-3"
      data-discriminator={overlay.discriminator.value}
      data-overlay-id={overlayId}
      {...{ [`data-${id}-schema-embed`]: "" }}
    >
      <SchemaVariantReference
        data-testid={`${id}-variant-schema`}
        definition={definition}
        overlay={presentation}
        pagePath={pagePath}
        showEmptyExamples={false}
        showPointerBreadcrumb={false}
        showVariantHeading={false}
      />
    </div>
  );
}

export type FactoryVariantSchemaEmbedDefinition = {
  /** Canonical route for the page hosting this embed. */
  pagePath: string;
  /** Overlay identifier, e.g. `behavior:CRON`. */
  overlayId: string;
  /**
   * Ready-to-render component for the page's MDX map.
   *
   * Typed as a zero-prop element factory rather than `ComponentType` so it
   * stays assignable to Fumadocs' `MDXComponents` map, which the per-page
   * components satisfied as plain `() => JSX.Element` declarations.
   */
  Embed: () => ReactElement;
};

export type CreateFactoryVariantSchemaEmbedOptions = {
  id: string;
  pagePath: string;
  overlayId: string;
  /** Loads the base definition. Called at render time, on the server. */
  loadDefinition: () => SchemaDefinitionModel;
  /** Builds the validated overlay. Called at render time, on the server. */
  loadOverlay: () => FactoryVariantOverlaySchema;
};

/**
 * Builds one variant page's embed plus the two constants its page test asserts
 * on, so a page module stays a short declaration instead of a copied component.
 */
export function createFactoryVariantSchemaEmbed(
  options: CreateFactoryVariantSchemaEmbedOptions,
): FactoryVariantSchemaEmbedDefinition {
  const { id, pagePath, overlayId, loadDefinition, loadOverlay } = options;

  function Embed() {
    return (
      <FactoryVariantSchemaEmbed
        definition={loadDefinition()}
        id={id}
        overlay={loadOverlay()}
        overlayId={overlayId}
        pagePath={pagePath}
      />
    );
  }

  return { pagePath, overlayId, Embed };
}
