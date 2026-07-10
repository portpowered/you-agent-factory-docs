"use client";

import {
  Background,
  Controls,
  type Edge,
  MarkerType,
  type Node,
  type NodeProps,
  ReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import {
  GRAPH_EDGE_TYPES,
  type GraphNodeHandle,
  GraphNodeShell,
  GraphViewportSurface,
} from "@/features/factory-ui/graphs";

const DIAGRAM_TITLE = "How work moves through you-agent-factory";

type SystemDiagramNodeData = {
  handles: GraphNodeHandle[];
  label: string;
  nodeKind: string;
};

function SystemDiagramFlowNode({
  data,
}: NodeProps<Node<SystemDiagramNodeData>>) {
  return (
    <div className="w-44 max-w-full sm:w-52">
      <GraphNodeShell
        handles={data.handles}
        nodeKind={data.nodeKind}
        showStateIndicator={false}
        state="default"
      >
        <span className="text-sm font-medium text-on-surface">
          {data.label}
        </span>
      </GraphNodeShell>
    </div>
  );
}

const SYSTEM_DIAGRAM_NODE_TYPES = {
  systemDiagram: SystemDiagramFlowNode,
};

function sourceHandle(id: string, tone: GraphNodeHandle["tone"] = "output") {
  return {
    id,
    label: "Out",
    side: "right" as const,
    tone,
    type: "source" as const,
  };
}

function targetHandle(id: string, tone: GraphNodeHandle["tone"] = "input") {
  return {
    id,
    label: "In",
    side: "left" as const,
    tone,
    type: "target" as const,
  };
}

const systemDiagramNodes: Node<SystemDiagramNodeData>[] = [
  {
    id: "submitted-work",
    position: { x: 0, y: 110 },
    type: "systemDiagram",
    draggable: false,
    selectable: false,
    data: {
      label: "Submitted work",
      nodeKind: "work",
      handles: [sourceHandle("out")],
    },
  },
  {
    id: "factory-session",
    position: { x: 240, y: 110 },
    type: "systemDiagram",
    draggable: false,
    selectable: false,
    data: {
      label: "Factory Session",
      nodeKind: "session",
      handles: [
        targetHandle("in"),
        sourceHandle("out", "assignment"),
        {
          id: "back",
          label: "Back",
          side: "left",
          tone: "continue",
          type: "target",
        },
      ],
    },
  },
  {
    id: "workstation",
    position: { x: 500, y: 110 },
    type: "systemDiagram",
    draggable: false,
    selectable: false,
    data: {
      label: "Workstation",
      nodeKind: "workstation",
      handles: [
        targetHandle("in"),
        sourceHandle("out", "worker"),
        {
          id: "resource",
          label: "Resource",
          side: "left",
          tone: "resource",
          type: "target",
        },
      ],
    },
  },
  {
    id: "worker",
    position: { x: 760, y: 110 },
    type: "systemDiagram",
    draggable: false,
    selectable: false,
    data: {
      label: "Worker",
      nodeKind: "worker",
      handles: [targetHandle("in", "worker"), sourceHandle("out")],
    },
  },
  {
    id: "resource",
    position: { x: 360, y: -10 },
    type: "systemDiagram",
    draggable: false,
    selectable: false,
    data: {
      label: "Resource (optional)",
      nodeKind: "resource",
      handles: [sourceHandle("out", "resource")],
    },
  },
  {
    id: "work-states",
    position: { x: 500, y: 290 },
    type: "systemDiagram",
    draggable: false,
    selectable: false,
    data: {
      label: "Work states",
      nodeKind: "work-states",
      handles: [
        {
          id: "in",
          label: "In",
          side: "right",
          tone: "input",
          type: "target",
        },
        sourceHandle("out", "continue"),
      ],
    },
  },
];

const sessionStroke = "#1B4F72";
const workerStroke = "#0B6E4F";
const resourceStroke = "#9A3412";

function arrowMarker(color: string) {
  return {
    type: MarkerType.ArrowClosed,
    color,
    width: 14,
    height: 14,
  };
}

const systemDiagramEdges: Edge[] = [
  {
    id: "work-enters-session",
    source: "submitted-work",
    target: "factory-session",
    sourceHandle: "out",
    targetHandle: "in",
    type: "graphEdge",
    selectable: false,
    markerEnd: arrowMarker(sessionStroke),
    style: { stroke: sessionStroke, strokeWidth: 2.5 },
    data: {
      alwaysShowLabel: true,
      label: "enters session",
    },
  },
  {
    id: "session-dispatches",
    source: "factory-session",
    target: "workstation",
    sourceHandle: "out",
    targetHandle: "in",
    type: "graphEdge",
    selectable: false,
    markerEnd: arrowMarker(sessionStroke),
    style: { stroke: sessionStroke, strokeWidth: 2.5 },
    data: {
      alwaysShowLabel: true,
      label: "dispatches",
    },
  },
  {
    id: "workstation-invokes-worker",
    source: "workstation",
    target: "worker",
    sourceHandle: "out",
    targetHandle: "in",
    type: "graphEdge",
    selectable: false,
    markerEnd: arrowMarker(workerStroke),
    style: { stroke: workerStroke, strokeWidth: 2.5 },
    data: {
      alwaysShowLabel: true,
      label: "invokes worker",
    },
  },
  {
    id: "resource-bounds",
    source: "resource",
    target: "workstation",
    sourceHandle: "out",
    targetHandle: "resource",
    type: "graphEdge",
    selectable: false,
    markerEnd: arrowMarker(resourceStroke),
    style: {
      stroke: resourceStroke,
      strokeWidth: 2.5,
      strokeDasharray: "6 4",
    },
    data: {
      alwaysShowLabel: true,
      label: "bounds capacity",
    },
  },
  {
    id: "worker-outcome",
    source: "worker",
    target: "work-states",
    sourceHandle: "out",
    targetHandle: "in",
    type: "graphEdge",
    selectable: false,
    markerEnd: arrowMarker(workerStroke),
    style: { stroke: workerStroke, strokeWidth: 2.5 },
    data: {
      alwaysShowLabel: true,
      label: "outcome",
      waypoints: [
        { x: 980, y: 158 },
        { x: 980, y: 330 },
      ],
    },
  },
  {
    id: "states-route-back",
    source: "work-states",
    target: "factory-session",
    sourceHandle: "out",
    targetHandle: "back",
    type: "graphEdge",
    selectable: false,
    markerEnd: arrowMarker(sessionStroke),
    style: {
      stroke: sessionStroke,
      strokeWidth: 2.5,
      strokeDasharray: "7 5",
    },
    data: {
      alwaysShowLabel: true,
      label: "routes back",
      waypoints: [
        { x: 280, y: 330 },
        { x: 280, y: 200 },
      ],
    },
  },
];

const legendItems = [
  { color: sessionStroke, label: "Session / work flow" },
  { color: workerStroke, label: "Worker dispatch / outcome" },
  { color: resourceStroke, label: "Optional resource bound" },
] as const;

function SystemDiagramLegend() {
  return (
    <ul
      className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-on-surface-variant"
      data-system-diagram-legend=""
    >
      {legendItems.map((item) => (
        <li className="inline-flex items-center gap-2" key={item.label}>
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Page-local teaching system diagram for architecture-of-system.
 * Uses factory-ui graph wrappers; fixture topology stays page-owned.
 */
export function SystemDiagramIllustration() {
  return (
    <figure
      className="my-6"
      data-system-diagram-illustration=""
      data-testid="system-diagram-illustration"
    >
      <p className="mb-2 text-sm font-medium text-on-surface">
        {DIAGRAM_TITLE}
      </p>
      <ReactFlowProvider>
        <div className="w-full max-w-full">
          <GraphViewportSurface
            aria-label={DIAGRAM_TITLE}
            className="h-[28rem] bg-surface"
          >
            <ReactFlow
              defaultEdgeOptions={{ selectable: false }}
              edgeTypes={GRAPH_EDGE_TYPES}
              edges={systemDiagramEdges}
              fitView
              fitViewOptions={{ padding: 0.18 }}
              maxZoom={1.25}
              minZoom={0.45}
              nodeTypes={SYSTEM_DIAGRAM_NODE_TYPES}
              nodes={systemDiagramNodes}
              nodesConnectable={false}
              nodesDraggable={false}
              panOnDrag
              proOptions={{ hideAttribution: true }}
              zoomOnScroll
            >
              <Background gap={16} size={1} />
              <Controls showInteractive={false} />
            </ReactFlow>
          </GraphViewportSurface>
        </div>
      </ReactFlowProvider>
      <SystemDiagramLegend />
      <figcaption className="mt-2 text-sm text-fd-muted-foreground">
        Submitted work enters a live Factory Session. A workstation dispatches
        to a worker, may hold an optional resource bound, and routes the outcome
        back into work states.
      </figcaption>
    </figure>
  );
}
