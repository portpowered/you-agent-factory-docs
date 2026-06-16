import { CodePresentationExample } from "@/components/docs/code-presentation-example";
import { DocsShellLayout } from "@/components/docs/docs-shell-layout";

export default function CodePresentationExamplePage() {
  return (
    <DocsShellLayout activeNav="code-presentation">
      <CodePresentationExample />
    </DocsShellLayout>
  );
}
