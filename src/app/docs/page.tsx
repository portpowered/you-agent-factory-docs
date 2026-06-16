import { DocsShell } from "@/components/docs/docs-shell";
import { loadDocsShellNavigation } from "@/lib/content";
import { DOCS_SHELL_FRAMING_TEXT, DOCS_SHELL_TITLE } from "@/lib/shell";
import { DOCS_ENTRY_ROUTE } from "@/lib/site";

export default function DocsShellPage() {
  const navigation = loadDocsShellNavigation();

  return (
    <DocsShell currentPath={DOCS_ENTRY_ROUTE} navigation={navigation}>
      <article aria-labelledby="docs-shell-title">
        <h1 id="docs-shell-title">{DOCS_SHELL_TITLE}</h1>
        <p className="docs-shell__framing">{DOCS_SHELL_FRAMING_TEXT}</p>
      </article>
    </DocsShell>
  );
}
