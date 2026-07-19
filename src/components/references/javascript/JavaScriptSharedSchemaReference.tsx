import {
  CopyableReferenceAnchor,
  ReferenceLifecycleVisibility,
  SchemaDefinitionEmbed,
} from "@/components/references/shared";
import { CodePanel } from "@/features/factory-ui/data-display";
import { ContractDescriptionProse } from "@/lib/i18n/contract-description-prose";
import type { JavascriptSharedSchemaNormalized } from "@/lib/references/family-normalized-models";
import { cn } from "@/lib/utils";
import { trimJavascriptSharedSchemaDefinitionForCard } from "./javascript-shared-schema-presentation";
import { mapJavascriptVisibilityToReferenceVisibility } from "./javascript-visibility";
import type { JavaScriptSharedSchemaReferenceProps } from "./types";

/**
 * Render one normalized JavaScript shared schema with a thin
 * SchemaDefinitionModel embed (no W07 fork). Does not invent schema
 * properties, titles, or examples.
 *
 * Shared-schema cards keep lifecycle/visibility as pills only — no family /
 * package-version / source-artifact chrome, no schema-id / name / title /
 * object-policy / type metadata rows, and no duplicated visibility text field.
 */
export function JavaScriptSharedSchemaReference({
  schema,
  chrome,
  className,
}: JavaScriptSharedSchemaReferenceProps) {
  const sharedVisibility = mapJavascriptVisibilityToReferenceVisibility(
    schema.visibility,
  );
  const heading = schema.title ?? schema.name;
  const schemaBody =
    schema.schema !== undefined
      ? trimJavascriptSharedSchemaDefinitionForCard(schema.schema)
      : undefined;

  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-md border border-border bg-background px-4 py-4",
        className,
      )}
      data-javascript-shared-schema-id={schema.id}
      data-javascript-shared-schema-reference=""
      id={schema.anchor}
    >
      <header className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="m-0 font-mono text-base font-semibold tracking-tight">
            <a
              className="text-foreground no-underline hover:underline"
              href={`#${schema.anchor}`}
            >
              {heading}
            </a>
          </h3>
          <CopyableReferenceAnchor
            anchor={schema.anchor}
            chrome={chrome}
            family="javascript"
          />
        </div>
        {schema.description !== undefined ? (
          <ContractDescriptionProse className="m-0 text-sm text-muted-foreground">
            {schema.description}
          </ContractDescriptionProse>
        ) : null}
      </header>

      <ReferenceLifecycleVisibility
        chrome={chrome}
        lifecycle={schema.lifecycle}
        visibility={sharedVisibility}
      />

      <section className="space-y-2" data-javascript-shared-schema-body="">
        <h4 className="m-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Schema
        </h4>
        {schemaBody !== undefined ? (
          <SchemaDefinitionEmbed definition={schemaBody} />
        ) : (
          <p
            className="m-0 text-sm text-muted-foreground"
            data-javascript-shared-schema-absent=""
          >
            Schema body was not published on this projection.
          </p>
        )}
      </section>

      {schema.examples !== undefined && schema.examples.length > 0 ? (
        <section
          className="space-y-2"
          data-javascript-shared-schema-examples=""
        >
          <h4 className="m-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Examples
          </h4>
          {schema.examples.map((example) => (
            <CodePanel data-javascript-shared-schema-example="" key={example}>
              {example}
            </CodePanel>
          ))}
        </section>
      ) : null}
    </article>
  );
}

/** Pure helper for tests: list identity keys rendered from a schema list. */
export function javascriptSharedSchemaInventoryIdentities(
  schemas: readonly JavascriptSharedSchemaNormalized[],
): string[] {
  return schemas.map((schema) => schema.id);
}
