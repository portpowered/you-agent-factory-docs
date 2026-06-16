"use client";

import { formatCodeBlockLanguageLabel } from "@/lib/docs-primitives";
import { useId } from "react";

type CodeBlockProps = {
  code: string;
  language?: string;
  title?: string;
};

export function CodeBlock({ code, language, title }: CodeBlockProps) {
  const labelId = useId();
  const languageLabel = language
    ? formatCodeBlockLanguageLabel(language)
    : undefined;
  const visibleLabel = title ?? languageLabel;
  const accessibleName =
    title ?? (languageLabel ? `${languageLabel} code example` : "Code example");

  return (
    <figure
      aria-labelledby={visibleLabel ? labelId : undefined}
      aria-label={visibleLabel ? undefined : accessibleName}
      className="docs-code-block"
    >
      {visibleLabel && (
        <figcaption className="docs-code-block__label" id={labelId}>
          {visibleLabel}
        </figcaption>
      )}
      <pre className="docs-code-block__pre">
        <code
          className={
            language
              ? `docs-code-block__code language-${language}`
              : "docs-code-block__code"
          }
          lang={language}
        >
          {code}
        </code>
      </pre>
    </figure>
  );
}
