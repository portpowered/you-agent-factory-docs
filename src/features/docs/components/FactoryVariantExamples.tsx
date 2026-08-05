import type { ReactElement } from "react";
import { T } from "@/features/docs/components/T";

/**
 * Shared body for every worker / workstation variant page's authored examples.
 *
 * Each variant page used to carry its own copy of this component, differing
 * only in the slug substituted into the `data-*` attributes, the two example
 * constants it imported, and the misuse block's identifier. Attribute names are
 * derived from `id` so the per-page assertions
 * (`[data-cron-behavior-examples]`, `[data-agent-worker-example="minimal"]`, …)
 * keep matching without change.
 *
 * JSON payloads stay outside message auto-link so field names remain literal.
 */
export type FactoryVariantExamplesProps = {
  /** Attribute stem, e.g. `cron-behavior` or `agent-worker`. */
  id: string;
  /** Authored minimal example payload. */
  minimalExample: unknown;
  /** Authored misuse example payload. */
  misuseExample: unknown;
  /** Misuse block identifier, e.g. `misuse-missing-cron`. */
  misuseKind: string;
};

function formatExample(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function FactoryVariantExamples({
  id,
  minimalExample,
  misuseExample,
  misuseKind,
}: FactoryVariantExamplesProps) {
  const exampleAttribute = `data-${id}-example`;

  return (
    <div className="min-w-0 space-y-4" {...{ [`data-${id}-examples`]: "" }}>
      <div {...{ [exampleAttribute]: "minimal" }}>
        <p>
          <T k="links.minimalExampleLabel" />
        </p>
        <pre>
          <code>{formatExample(minimalExample)}</code>
        </pre>
      </div>
      <div {...{ [exampleAttribute]: misuseKind }}>
        <p>
          <T k="links.misuseExampleLabel" />
        </p>
        <pre>
          <code>{formatExample(misuseExample)}</code>
        </pre>
        <p>
          <T k="links.misuseNote" />
        </p>
      </div>
    </div>
  );
}

/**
 * Builds one variant page's examples component, so a page module stays a short
 * declaration instead of a copied component.
 */
export function createFactoryVariantExamples(
  options: FactoryVariantExamplesProps,
): () => ReactElement {
  return function Examples() {
    return <FactoryVariantExamples {...options} />;
  };
}
