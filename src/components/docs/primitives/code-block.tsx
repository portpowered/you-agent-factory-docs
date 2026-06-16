type CodeBlockProps = {
  code: string;
  language?: string;
  title?: string;
};

export function CodeBlock({ code, language, title }: CodeBlockProps) {
  const label = title ?? (language ? `${language} example` : "Code example");

  return (
    <figure className="docs-code-block" aria-label={label}>
      {(language || title) && (
        <figcaption className="docs-code-block__label">
          {title ?? language}
        </figcaption>
      )}
      <pre className="docs-code-block__pre">
        <code
          className={
            language
              ? `docs-code-block__code language-${language}`
              : "docs-code-block__code"
          }
        >
          {code}
        </code>
      </pre>
    </figure>
  );
}
