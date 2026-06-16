import { SharedShell } from "@/components/shell/shared-shell";
import { DOCS_SHELL_FRAMING_TEXT, DOCS_SHELL_TITLE } from "@/lib/shell";

export function DocsShell() {
  return (
    <SharedShell currentDocsItemId="overview" surface="docs">
      <article aria-labelledby="docs-shell-title">
        <h1 id="docs-shell-title">{DOCS_SHELL_TITLE}</h1>
        <p className="docs-shell__framing">{DOCS_SHELL_FRAMING_TEXT}</p>
      </article>
    </SharedShell>
  );
}
