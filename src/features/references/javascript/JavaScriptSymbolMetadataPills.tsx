import { cn } from "@/lib/utils";
import {
  JAVASCRIPT_SYMBOL_METADATA_FACET_LABELS,
  JAVASCRIPT_SYMBOL_METADATA_GLOSSARY_ANCHORS,
  type JavascriptSymbolMetadataFacet,
  javascriptSymbolBindingLifecycleLabel,
  javascriptSymbolKindLabel,
  javascriptSymbolMutabilityLabel,
  javascriptSymbolNullabilityLabel,
} from "./javascript-symbol-metadata";

const metadataPillClassName =
  "inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/60 px-2 py-0.5 text-xs font-medium text-foreground no-underline hover:underline";

export type JavaScriptSymbolMetadataPillsProps = {
  kind?: string;
  mutability?: string;
  nullability?: string;
  bindingLifecycle?: string;
  className?: string;
  /**
   * When true, pills link to on-page glossary anchors. Defaults to true so
   * card chrome points at visible definitions rather than hover-only help.
   */
  linkToGlossary?: boolean;
};

type PillSpec = {
  facet: JavascriptSymbolMetadataFacet;
  contractValue: string;
  displayValue: string;
};

function MetadataPill({
  facet,
  contractValue,
  displayValue,
  linkToGlossary,
}: PillSpec & { linkToGlossary: boolean }) {
  const facetLabel = JAVASCRIPT_SYMBOL_METADATA_FACET_LABELS[facet];
  const label = `${facetLabel}: ${displayValue}`;
  const glossaryHref = `#${JAVASCRIPT_SYMBOL_METADATA_GLOSSARY_ANCHORS[facet]}`;
  const dataAttrs = {
    "data-javascript-metadata-facet": facet,
    "data-javascript-metadata-value": contractValue,
  } as const;

  if (linkToGlossary) {
    return (
      <a
        {...dataAttrs}
        className={metadataPillClassName}
        href={glossaryHref}
        title={`See glossary: ${facetLabel}`}
      >
        {label}
      </a>
    );
  }

  return (
    <span
      {...dataAttrs}
      className={metadataPillClassName}
      title={`${facetLabel}: ${contractValue}`}
    >
      {label}
    </span>
  );
}

/**
 * Glossary-backed pills for published kind / mutability / nullability /
 * binding-lifecycle metadata. Omits facets the projection left absent.
 */
export function JavaScriptSymbolMetadataPills({
  kind,
  mutability,
  nullability,
  bindingLifecycle,
  className,
  linkToGlossary = true,
}: JavaScriptSymbolMetadataPillsProps) {
  const pills: PillSpec[] = [];

  if (kind !== undefined) {
    pills.push({
      facet: "kind",
      contractValue: kind,
      displayValue: javascriptSymbolKindLabel(kind),
    });
  }
  if (mutability !== undefined) {
    pills.push({
      facet: "mutability",
      contractValue: mutability,
      displayValue: javascriptSymbolMutabilityLabel(mutability),
    });
  }
  if (nullability !== undefined) {
    pills.push({
      facet: "nullability",
      contractValue: nullability,
      displayValue: javascriptSymbolNullabilityLabel(nullability),
    });
  }
  if (bindingLifecycle !== undefined) {
    pills.push({
      facet: "bindingLifecycle",
      contractValue: bindingLifecycle,
      displayValue: javascriptSymbolBindingLifecycleLabel(bindingLifecycle),
    });
  }

  if (pills.length === 0) {
    return null;
  }

  return (
    <div
      className={cn("flex flex-wrap items-center gap-2", className)}
      data-javascript-symbol-metadata-pills=""
    >
      {pills.map((pill) => (
        <MetadataPill
          key={pill.facet}
          {...pill}
          linkToGlossary={linkToGlossary}
        />
      ))}
    </div>
  );
}
