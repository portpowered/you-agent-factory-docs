export type MermaidDiagramDefinition = {
  title: string;
  description: string;
  definition: string;
};

export const FACTORY_WORKFLOW_MERMAID_DIAGRAM: MermaidDiagramDefinition = {
  title: "Workflow review loop",
  description:
    "A checked-in Mermaid flowchart shows how authored workflow intent moves from a docs author through factory execution and into reviewer validation.",
  definition: `flowchart LR
    Author[Docs author] --> PRD[Checked-in PRD]
    PRD --> Factory[You Agent Factory]
    Factory --> Review[Reviewer validation]
    Review --> Publish[Published docs]`,
};
