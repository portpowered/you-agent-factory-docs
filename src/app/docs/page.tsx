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
      <article aria-labelledby="docs-shell-title">
        <h1 id="docs-shell-title">{enMessages.docs.shellTitle}</h1>
        <p className="docs-shell__framing">{enMessages.docs.framingText}</p>
        <section
          aria-labelledby="docs-shell-examples-title"
          className="docs-shell__examples"
        >
          <h2 id="docs-shell-examples-title">
            {enMessages.docs.examplesHeading}
          </h2>
          <p className="docs-shell__examples-copy">
            {enMessages.docs.examplesText}
          </p>
          <ul className="docs-shell__examples-list">
            <li>{enMessages.docs.mermaidExampleLabel}</li>
            <li>{enMessages.docs.reactFlowExampleLabel}</li>
          </ul>
        </section>
        <MermaidDiagram
          definition={FACTORY_WORKFLOW_MERMAID_DIAGRAM.definition}
          description={FACTORY_WORKFLOW_MERMAID_DIAGRAM.description}
          title={FACTORY_WORKFLOW_MERMAID_DIAGRAM.title}
        />
        <ReactFlowDiagram definition={FACTORY_AGENT_GRAPH_REACT_FLOW_DIAGRAM} />
      </article>
    </DocsShell>
  );
}
