import { ChartExample } from "@/components/docs/chart-example";
import { DocsShell } from "@/components/docs/docs-shell";
import { loadDocsShellNavigation } from "@/lib/content";
import { CHART_EXAMPLE_ROUTE } from "@/lib/docs-charts";

export default function ChartExamplePage() {
  const navigation = loadDocsShellNavigation();

  return (
    <DocsShell currentPath={CHART_EXAMPLE_ROUTE} navigation={navigation}>
      <ChartExample />
    </DocsShell>
  );
}
