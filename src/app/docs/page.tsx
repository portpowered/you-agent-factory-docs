import { DocsShell } from "@/components/docs/docs-shell";
import { loadDocsShellNavigation } from "@/lib/content";
import { DOCS_ENTRY_ROUTE } from "@/lib/site";
import { enMessages } from "@/localization/messages/en";

export default function DocsShellPage() {
  const navigation = loadDocsShellNavigation();

  return (
    <DocsShell currentPath={DOCS_ENTRY_ROUTE} navigation={navigation}>
      <article aria-labelledby="docs-shell-title">
        <h1 id="docs-shell-title">{enMessages.docs.shellTitle}</h1>
        <p className="docs-shell__framing">{enMessages.docs.framingText}</p>
      </article>
    </DocsShell>
  );
}
