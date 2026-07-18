import {
  ContractSourceBadge,
  SchemaDefinitionEmbed,
} from "@/components/references/shared";
import { CodePanel } from "@/features/factory-ui/data-display";
import type { JavascriptSharedSchemaNormalized } from "@/lib/references/family-normalized-models";
import { cn } from "@/lib/utils";
import {
  javascriptVisibilityDisplayLabel,
  mapJavascriptVisibilityToReferenceVisibility,
} from "./javascript-visibility";
import type { JavaScriptSharedSchemaReferenceProps } from "./types";

/**
 * Render one normalized JavaScript shared schema with a thin
 * SchemaDefinitionModel embed (no W07 fork). Does not invent schema
 * properties, titles, or examples.
 */
export function JavaScriptSharedSchemaReference({
  schema,
  packageVersion,
  className,
}: JavaScriptSharedSchemaReferenceProps) {
  const sharedVisibility = mapJavascriptVisibilityToReferenceVisibility(
    schema.visibility,
  );
  const heading = schema.title ?? schema.name;

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
        <h3 className="m-0 font-mono text-base font-semibold tracking-tight">
          <a
            className="text-foreground no-underline hover:underline"
            href={`#${schema.anchor}`}
          >
            {heading}
          </a>
        </h3>
        {schema.description !== undefined ? (
          <p className="m-0 text-sm text-muted-foreground">
            {schema.description}
          </p>
        ) : null}
      </header>

      <ContractSourceBadge
        family="javascript"
        lifecycle={schema.lifecycle}
        packageVersion={packageVersion}
        source={schema.source}
        visibility={sharedVisibility}
      />

      <dl className="m-0 grid gap-2 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-4">
        <MetadataRow label="Schema id" value={schema.id} mono />
        <MetadataRow label="Name" value={schema.name} mono />
        {schema.visibility !== undefined ? (
          <MetadataRow
            label="Visibility"
            value={javascriptVisibilityDisplayLabel(schema.visibility)}
          />
        ) : null}
      </dl>

      <section className="space-y-2" data-javascript-shared-schema-body="">
        <h4 className="m-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Schema
        </h4>
        {schema.schema !== undefined ? (
          <SchemaDefinitionEmbed definition={schema.schema} />
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

function MetadataRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="contents">
      <dt className="m-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className={cn("m-0", mono ? "font-mono text-xs" : undefined)}>
        {value}
      </dd>
    </div>
  );
}

/** Pure helper for tests: list identity keys rendered from a schema list. */
export function javascriptSharedSchemaInventoryIdentities(
  schemas: readonly JavascriptSharedSchemaNormalized[],
): string[] {
  return schemas.map((schema) => schema.id);
}
