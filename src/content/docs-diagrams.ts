export type MermaidDiagramDefinition = {
  title: string;
  description: string;
  definition: string;
};

export type DiagramPortPosition = "top" | "right" | "bottom" | "left";

export type ReactFlowDiagramNodeDefinition = {
  id: string;
  title: string;
  detail: string;
  position: {
    x: number;
    y: number;
  };
  width: number;
  height: number;
  sourcePort?: DiagramPortPosition;
  targetPort?: DiagramPortPosition;
};

export type ReactFlowDiagramEdgeDefinition = {
  id: string;
  source: string;
  target: string;
  label: string;
};

export type ReactFlowDiagramDefinition = {
  title: string;
  description: string;
  viewport: {
    width: number;
    height: number;
  };
  nodes: ReactFlowDiagramNodeDefinition[];
  edges: ReactFlowDiagramEdgeDefinition[];
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

export const FACTORY_AGENT_GRAPH_REACT_FLOW_DIAGRAM: ReactFlowDiagramDefinition =
  {
    title: "Agent orchestration handoff graph",
    description:
      "A docs-owned React Flow graph shows the reviewable handoff between authored inputs, factory execution, verification, and the reviewer-visible docs result.",
    viewport: {
      width: 960,
      height: 360,
    },
    nodes: [
      {
        id: "authoring",
        title: "Authored content",
        detail: "PRD, progress log, and checked-in diagram definitions.",
        position: {
          x: 0,
          y: 108,
        },
        width: 212,
        height: 96,
        sourcePort: "right",
      },
      {
        id: "factory",
        title: "Factory executor",
        detail:
          "Implements one story, runs checks, and keeps the branch pushable.",
        position: {
          x: 284,
          y: 0,
        },
        width: 228,
        height: 108,
        sourcePort: "right",
        targetPort: "left",
      },
      {
        id: "verification",
        title: "Verification lane",
        detail:
          "Typecheck, lint, tests, and browser validation prove the projection.",
        position: {
          x: 284,
          y: 196,
        },
        width: 228,
        height: 108,
        sourcePort: "right",
        targetPort: "left",
      },
      {
        id: "docs",
        title: "Docs surface",
        detail:
          "Published diagrams stay reviewer-visible on the current docs route.",
        position: {
          x: 612,
          y: 108,
        },
        width: 232,
        height: 96,
        targetPort: "left",
      },
    ],
    edges: [
      {
        id: "authoring-to-factory",
        source: "authoring",
        target: "factory",
        label: "story intent",
      },
      {
        id: "factory-to-verification",
        source: "factory",
        target: "verification",
        label: "implementation proof",
      },
      {
        id: "verification-to-docs",
        source: "verification",
        target: "docs",
        label: "mergeable output",
      },
      {
        id: "factory-to-docs",
        source: "factory",
        target: "docs",
        label: "rendered diagram",
      },
    ],
  };
