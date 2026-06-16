import { DocsShell } from "@/components/docs/docs-shell";
import { loadDocsShellNavigation } from "@/lib/content";
import { DOCS_ENTRY_ROUTE } from "@/lib/site";

export default function DocsShellPage() {
  const navigation = loadDocsShellNavigation();

  return <DocsShell currentPath={DOCS_ENTRY_ROUTE} navigation={navigation} />;
}
