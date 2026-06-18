import { DocsRouteChrome } from "@/components/docs/docs-route-chrome";
import { UIPrimitivesExample } from "@/components/docs/ui-primitives-example";
import { loadDocsShellNavigation } from "@/lib/content";
import { UI_PRIMITIVES_ROUTE } from "@/lib/docs-primitives";

export default function UIPrimitivesExamplePage() {
  const navigation = loadDocsShellNavigation();

  return (
    <DocsRouteChrome currentPath={UI_PRIMITIVES_ROUTE} navigation={navigation}>
      <UIPrimitivesExample />
    </DocsRouteChrome>
  );
}
