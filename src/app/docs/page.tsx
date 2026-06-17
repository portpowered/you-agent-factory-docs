import {
  DocsContentCard,
  DocsContentSurface,
} from "@/components/docs/docs-content";
import { DocsShell } from "@/components/docs/docs-shell";
import { MermaidDiagram } from "@/components/docs/mermaid-diagram";
import { ReactFlowDiagram } from "@/components/docs/react-flow-diagram";
import {
  FACTORY_AGENT_GRAPH_REACT_FLOW_DIAGRAM,
  FACTORY_WORKFLOW_MERMAID_DIAGRAM,
} from "@/content/docs-diagrams";
import { loadDocsShellNavigation } from "@/lib/content";
import { DOCS_ENTRY_ROUTE } from "@/lib/site";
import { enMessages } from "@/localization/messages/en";

export default function DocsShellPage() {
  const navigation = loadDocsShellNavigation();

  return (
    <DocsShell currentPath={DOCS_ENTRY_ROUTE} navigation={navigation}>
      <DocsContentSurface aria-labelledby="docs-shell-title">
        <DocsContentCard
          aria-labelledby="docs-shell-title"
          aria-describedby="docs-shell-framing"
        >
          <h1
            className="m-0 text-[clamp(1.75rem,4vw,2.5rem)] leading-tight tracking-tight text-card-foreground"
            id="docs-shell-title"
          >
            {enMessages.docs.shellTitle}
          </h1>
          <p
            className="docs-content-lead docs-shell__framing"
            id="docs-shell-framing"
          >
            {enMessages.docs.framingText}
          </p>
        </DocsContentCard>
        <DocsContentCard
          as="section"
          aria-labelledby="docs-shell-examples-title"
          className="docs-shell__examples"
        >
          <h2
            className="m-0 text-[clamp(1.25rem,3vw,1.75rem)] leading-tight tracking-tight text-card-foreground"
            id="docs-shell-examples-title"
          >
            {enMessages.docs.examplesHeading}
          </h2>
          <p className="docs-content-lead docs-shell__examples-copy mt-3 text-base">
            {enMessages.docs.examplesText}
          </p>
          <ul className="docs-shell__examples-list m-0 mt-4 grid gap-3 pl-5 text-muted-foreground">
            <li>{enMessages.docs.mermaidExampleLabel}</li>
            <li>{enMessages.docs.reactFlowExampleLabel}</li>
          </ul>
        </DocsContentCard>
        <MermaidDiagram
          definition={FACTORY_WORKFLOW_MERMAID_DIAGRAM.definition}
          description={FACTORY_WORKFLOW_MERMAID_DIAGRAM.description}
          title={FACTORY_WORKFLOW_MERMAID_DIAGRAM.title}
        />
        <ReactFlowDiagram definition={FACTORY_AGENT_GRAPH_REACT_FLOW_DIAGRAM} />
      </DocsContentSurface>
    </DocsShell>
  );
}
