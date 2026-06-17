"use client";

import type {
  DiagramPortPosition,
  ReactFlowDiagramDefinition,
  ReactFlowDiagramNodeDefinition,
} from "@/content/docs-diagrams";
import {
  Background,
  type Edge,
  type FitViewOptions,
  MarkerType,
  type Node,
  type NodeHandle,
  Position,
  ReactFlow,
  type ReactFlowInstance,
} from "@xyflow/react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

type ReactFlowDiagramProps = {
  definition: ReactFlowDiagramDefinition;
};

const FIT_VIEW_OPTIONS = {
  padding: 0.2,
  minZoom: 0.3,
} satisfies FitViewOptions;

function scheduleFitView(callback: () => void) {
  if (typeof window === "undefined") {
    callback();
    return () => undefined;
  }

  const frameId = window.requestAnimationFrame(() => {
    callback();
  });

  return () => {
    window.cancelAnimationFrame(frameId);
  };
}

function toPosition(position: DiagramPortPosition): Position {
  switch (position) {
    case "top":
      return Position.Top;
    case "right":
      return Position.Right;
    case "bottom":
      return Position.Bottom;
    case "left":
      return Position.Left;
  }
}

function toHandle(
  position: DiagramPortPosition,
  width: number,
  height: number,
): NodeHandle {
  switch (position) {
    case "top":
      return {
        type: "source",
        position: Position.Top,
        x: width / 2,
        y: 0,
      };
    case "right":
      return {
        type: "source",
        position: Position.Right,
        x: width,
        y: height / 2,
      };
    case "bottom":
      return {
        type: "source",
        position: Position.Bottom,
        x: width / 2,
        y: height,
      };
    case "left":
      return {
        type: "source",
        position: Position.Left,
        x: 0,
        y: height / 2,
      };
  }
}

function toTargetHandle(
  position: DiagramPortPosition,
  width: number,
  height: number,
): NodeHandle {
  const handle = toHandle(position, width, height);
  return {
    ...handle,
    type: "target",
  };
}

function toReactFlowNode(
  node: ReactFlowDiagramNodeDefinition,
): Node<{ label: ReactNode }> {
  const handles: NodeHandle[] = [];

  if (node.sourcePort) {
    handles.push(toHandle(node.sourcePort, node.width, node.height));
  }

  if (node.targetPort) {
    handles.push(toTargetHandle(node.targetPort, node.width, node.height));
  }

  return {
    id: node.id,
    position: node.position,
    width: node.width,
    height: node.height,
    sourcePosition: node.sourcePort ? toPosition(node.sourcePort) : undefined,
    targetPosition: node.targetPort ? toPosition(node.targetPort) : undefined,
    handles,
    data: {
      label: (
        <div className="docs-react-flow-node">
          <strong>{node.title}</strong>
          <span>{node.detail}</span>
        </div>
      ),
    },
    ariaLabel: `${node.title}. ${node.detail}`,
  };
}

function toReactFlowEdge(
  edge: ReactFlowDiagramDefinition["edges"][number],
): Edge {
  return {
    ...edge,
    type: "smoothstep",
    animated: false,
    labelStyle: {
      fill: "var(--landing-text)",
      fontWeight: 600,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 18,
      height: 18,
      color: "var(--landing-accent)",
    },
    style: {
      stroke: "var(--landing-accent)",
      strokeWidth: 2,
    },
    ariaLabel: edge.label,
  };
}

function createSourcePreview(definition: ReactFlowDiagramDefinition) {
  return JSON.stringify(
    {
      viewport: definition.viewport,
      nodes: definition.nodes.map((node) => ({
        id: node.id,
        title: node.title,
        detail: node.detail,
        position: node.position,
        width: node.width,
        height: node.height,
        sourcePort: node.sourcePort ?? null,
        targetPort: node.targetPort ?? null,
      })),
      edges: definition.edges,
    },
    null,
    2,
  );
}

export function ReactFlowDiagram({ definition }: ReactFlowDiagramProps) {
  const nodes = definition.nodes.map(toReactFlowNode);
  const edges = definition.edges.map(toReactFlowEdge);
  const sourcePreview = createSourcePreview(definition);
  const graphicRef = useRef<HTMLDivElement>(null);
  const [graphInstance, setGraphInstance] = useState<ReactFlowInstance | null>(
    null,
  );
  const titleId = `${definition.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-title`;
  const descriptionId = `${titleId}-description`;
  const sourceId = `${titleId}-source`;

  useEffect(() => {
    if (!graphInstance) {
      return;
    }

    let cancelScheduledFit = scheduleFitView(() => {
      graphInstance.fitView(FIT_VIEW_OPTIONS);
    });

    if (typeof ResizeObserver === "undefined" || !graphicRef.current) {
      return () => {
        cancelScheduledFit();
      };
    }

    const resizeObserver = new ResizeObserver(() => {
      cancelScheduledFit();
      cancelScheduledFit = scheduleFitView(() => {
        graphInstance.fitView(FIT_VIEW_OPTIONS);
      });
    });

    resizeObserver.observe(graphicRef.current);

    return () => {
      cancelScheduledFit();
      resizeObserver.disconnect();
    };
  }, [graphInstance]);

  return (
    <figure
      aria-describedby={`${descriptionId} ${sourceId}`}
      aria-labelledby={titleId}
      className="docs-diagram"
    >
      <figcaption className="docs-diagram__header">
        <h2 id={titleId}>{definition.title}</h2>
        <p className="docs-diagram__description" id={descriptionId}>
          {definition.description}
        </p>
      </figcaption>

      <div className="docs-diagram__surface">
        <div
          aria-label={definition.title}
          className="docs-diagram__graphic docs-diagram__graphic--react-flow"
          ref={graphicRef}
        >
          <ReactFlow
            ariaLabelConfig={{
              "node.a11yDescription.default":
                "Press tab to inspect the next workflow node in this documentation graph.",
              "edge.a11yDescription.default":
                "Press tab to inspect the next workflow relationship in this documentation graph.",
            }}
            autoPanOnNodeFocus={false}
            colorMode="light"
            edges={edges}
            edgesFocusable
            elementsSelectable={false}
            fitView
            fitViewOptions={FIT_VIEW_OPTIONS}
            maxZoom={1.1}
            minZoom={0.3}
            nodes={nodes}
            nodesConnectable={false}
            nodesDraggable={false}
            nodesFocusable
            panOnDrag={false}
            panOnScroll={false}
            preventScrolling={false}
            onInit={setGraphInstance}
            zoomOnDoubleClick={false}
            zoomOnPinch={false}
            zoomOnScroll={false}
          >
            <Background
              color="color-mix(in srgb, var(--landing-accent) 22%, transparent)"
              gap={20}
            />
          </ReactFlow>
        </div>
      </div>

      <div className="docs-diagram__source">
        <p className="docs-diagram__source-label" id={sourceId}>
          React Flow source of truth
        </p>
        <pre className="docs-diagram__code">
          <code>{sourcePreview}</code>
        </pre>
      </div>
    </figure>
  );
}
