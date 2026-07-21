import { CodePanel } from "@/features/factory-ui/data-display";
import {
  CopyableReferenceAnchor,
  ReferenceLifecycleVisibility,
} from "@/features/references/shared";
import { ContractDescriptionProse } from "@/lib/i18n/contract-description-prose";
import type { JavascriptSymbolNormalized } from "@/lib/references/family-normalized-models";
import { cn } from "@/lib/utils";
import { JavaScriptSymbolMetadataPills } from "./JavaScriptSymbolMetadataPills";
import { mapJavascriptVisibilityToReferenceVisibility } from "./javascript-visibility";
import type { JavaScriptSymbolReferenceProps } from "./types";

/**
 * Render one normalized JavaScript runtime symbol with available published
 * metadata, shared schema links, and authored examples. Does not invent
 * mutability, nullability, examples, or schema links.
 *
 * Symbol cards keep lifecycle/visibility as pills only — no family /
 * package-version / source-artifact chrome and no duplicated visibility text
 * row beside those pills. Kind, mutability, nullability, and binding
 * lifecycle appear as glossary-backed pills when published.
 */
export function JavaScriptSymbolReference({
  symbol,
  chrome,
  className,
}: JavaScriptSymbolReferenceProps) {
  const sharedVisibility = mapJavascriptVisibilityToReferenceVisibility(
    symbol.visibility,
  );

  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-md border border-border bg-background px-4 py-4",
        className,
      )}
      data-javascript-symbol-id={symbol.id}
      data-javascript-symbol-path={symbol.symbolPath}
      data-javascript-symbol-reference=""
      id={symbol.anchor}
    >
      <header className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="m-0 font-mono text-base font-semibold tracking-tight">
            <a
              className="text-foreground no-underline hover:underline"
              href={`#${symbol.anchor}`}
            >
              {symbol.symbolPath}
            </a>
          </h3>
          <CopyableReferenceAnchor
            anchor={symbol.anchor}
            chrome={chrome}
            family="javascript"
          />
        </div>
        {symbol.description !== undefined ? (
          <ContractDescriptionProse className="m-0 text-sm text-muted-foreground">
            {symbol.description}
          </ContractDescriptionProse>
        ) : null}
      </header>

      <div className="flex flex-col gap-2">
        <ReferenceLifecycleVisibility
          chrome={chrome}
          lifecycle={symbol.lifecycle}
          visibility={sharedVisibility}
        />
        <JavaScriptSymbolMetadataPills
          bindingLifecycle={symbol.bindingLifecycle}
          kind={symbol.kind}
          mutability={symbol.mutability}
          nullability={symbol.nullability}
        />
      </div>

      <dl className="m-0 grid gap-2 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-4">
        <MetadataRow label="Symbol path" value={symbol.symbolPath} mono />
        <MetadataRow label="Symbol id" value={symbol.id} mono />
      </dl>

      {symbol.sharedSchemaLinks !== undefined &&
      symbol.sharedSchemaLinks.length > 0 ? (
        <section className="space-y-2" data-javascript-shared-schema-links="">
          <h4 className="m-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Shared schemas
          </h4>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {symbol.sharedSchemaLinks.map((link) => (
              <li key={link.schemaId}>
                <a
                  className="font-mono text-sm text-foreground underline-offset-2 hover:underline"
                  data-javascript-shared-schema-link={link.schemaId}
                  href={`#${link.anchor}`}
                >
                  {link.schemaId}
                </a>
                {link.ref !== undefined ? (
                  <span className="ml-2 font-mono text-xs text-muted-foreground">
                    {link.ref}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {symbol.examples !== undefined && symbol.examples.length > 0 ? (
        <section className="space-y-2" data-javascript-examples="">
          <h4 className="m-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Examples
          </h4>
          {symbol.examples.map((example) => (
            <CodePanel data-javascript-example="" key={example}>
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

/** Pure helper for tests: list identity keys rendered from a symbol list. */
export function javascriptSymbolInventoryIdentities(
  symbols: readonly JavascriptSymbolNormalized[],
): string[] {
  return symbols.map((symbol) => symbol.symbolPath);
}
