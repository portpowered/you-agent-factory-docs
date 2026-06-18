import { DocsEntryContent } from "@/components/docs/docs-entry-content";
import { DocsRouteChrome } from "@/components/docs/docs-route-chrome";
import { loadDocsShellNavigation } from "@/lib/content";
import { DOCS_ENTRY_ROUTE } from "@/lib/site";

export default function DocsShellPage() {
  const navigation = loadDocsShellNavigation();

  return (
    <DocsRouteChrome currentPath={DOCS_ENTRY_ROUTE} navigation={navigation}>
      <DocsEntryContent />
    </DocsRouteChrome>
  );
}
