import { DocsShellLayout } from "@/components/docs/docs-shell-layout";
import { DOCS_SHELL_FRAMING_TEXT, DOCS_SHELL_TITLE } from "@/lib/shell";

export function DocsShell() {
  return (
    <DocsShellLayout activeNav="overview">
      <article aria-labelledby="docs-shell-title">
        <h1 id="docs-shell-title">{DOCS_SHELL_TITLE}</h1>
        <p className="docs-shell__framing">{DOCS_SHELL_FRAMING_TEXT}</p>
      </article>
    </DocsShellLayout>
  );
}
