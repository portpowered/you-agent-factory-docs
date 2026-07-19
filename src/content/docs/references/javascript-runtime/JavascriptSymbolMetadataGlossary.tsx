/**
 * On-page glossary for JavaScript symbol metadata pills (kind, mutability,
 * nullability, binding lifecycle). Definitions are visible page content —
 * not hover-only discovery.
 *
 * Term copy lives in JavaScript-owned glossary constants because page message
 * sections only accept `title` / `body` strings. The section intro still comes
 * from page messages via the surrounding MDX `<T />`.
 */

import { JAVASCRIPT_SYMBOL_METADATA_GLOSSARY_TERMS } from "@/components/references/javascript/javascript-symbol-metadata-glossary";

/**
 * Renders the visible symbol-metadata glossary definition list used by
 * glossary-backed pills on JavaScript symbol cards.
 */
export function JavascriptSymbolMetadataGlossary() {
  return (
    <dl className="m-0 grid gap-4" data-javascript-symbol-metadata-glossary="">
      {JAVASCRIPT_SYMBOL_METADATA_GLOSSARY_TERMS.map((term) => (
        <div
          className="space-y-1"
          data-javascript-glossary-term={term.facet}
          id={term.anchor}
          key={term.facet}
        >
          <dt className="m-0 text-sm font-semibold tracking-tight">
            {term.term}
          </dt>
          <dd className="m-0 text-sm text-muted-foreground">
            {term.definition}
          </dd>
        </div>
      ))}
    </dl>
  );
}
