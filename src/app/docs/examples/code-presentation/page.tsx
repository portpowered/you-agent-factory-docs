import { CodePresentationExample } from "@/components/docs/code-presentation-example";
import { DocsShell } from "@/components/docs/docs-shell";
import { loadDocsShellNavigation } from "@/lib/content";
import { CODE_PRESENTATION_EXAMPLE_ROUTE } from "@/lib/docs-primitives";

export default function CodePresentationExamplePage() {
  const navigation = loadDocsShellNavigation();

  return (
    <DocsShell
      currentPath={CODE_PRESENTATION_EXAMPLE_ROUTE}
      navigation={navigation}
    >
      <CodePresentationExample />
    </DocsShell>
  );
}
