import { CodePresentationExample } from "@/components/docs/code-presentation-example";
import { DocsRouteChrome } from "@/components/docs/docs-route-chrome";
import { loadDocsShellNavigation } from "@/lib/content";
import { CODE_PRESENTATION_EXAMPLE_ROUTE } from "@/lib/docs-primitives";

export default function CodePresentationExamplePage() {
  const navigation = loadDocsShellNavigation();

  return (
    <DocsRouteChrome
      currentPath={CODE_PRESENTATION_EXAMPLE_ROUTE}
      navigation={navigation}
    >
      <CodePresentationExample />
    </DocsRouteChrome>
  );
}
