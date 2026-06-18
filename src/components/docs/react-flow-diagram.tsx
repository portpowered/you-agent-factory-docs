"use client";

import type {
  DiagramPortPosition,
  ReactFlowDiagramDefinition,
  ReactFlowDiagramNodeDefinition,
} from "@/content/docs-diagrams";
import {
  Background,
  type Edge,
  MarkerType,
  type Node,
  type NodeHandle,
  Position,
  ReactFlow,
} from "@xyflow/react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type ReactFlowDiagramProps = {
  definition: ReactFlowDiagramDefinition;
};

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
      fill: "var(--foreground)",
      fontWeight: 600,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 18,
      height: 18,
      color: "var(--accent)",
    },
    style: {
      stroke: "var(--accent)",
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

function projectStageScale(
  definition: ReactFlowDiagramDefinition,
  width: number,
  height: number,
): {
  scale: number;
  x: number;
  y: number;
} {
  const padding = Math.max(32, Math.min(width, height) * 0.12);
  const availableWidth = Math.max(width - padding * 2, 1);
  const availableHeight = Math.max(height - padding * 2, 1);
  const zoom = Math.min(
    availableWidth / definition.viewport.width,
    availableHeight / definition.viewport.height,
    1,
  );
  const scaledWidth = definition.viewport.width * zoom;
  const scaledHeight = definition.viewport.height * zoom;

  return {
    scale: zoom,
    x: (width - scaledWidth) / 2,
    y: (height - scaledHeight) / 2,
  };
}

export function ReactFlowDiagram({ definition }: ReactFlowDiagramProps) {
  const nodes = definition.nodes.map(toReactFlowNode);
  const edges = definition.edges.map(toReactFlowEdge);
  const sourcePreview = createSourcePreview(definition);
  const graphicRef = useRef<HTMLDivElement>(null);
  const [frameSize, setFrameSize] = useState(definition.viewport);
  const titleId = `${definition.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-title`;
  const descriptionId = `${titleId}-description`;
  const sourceId = `${titleId}-source`;
  const stageProjection = useMemo(
    () => projectStageScale(definition, frameSize.width, frameSize.height),
    [definition, frameSize.height, frameSize.width],
  );

  useEffect(() => {
    if (typeof ResizeObserver === "undefined" || !graphicRef.current) {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const nextEntry = entries[0];

      if (!nextEntry) {
        return;
      }

      const nextWidth = Math.round(nextEntry.contentRect.width);
      const nextHeight = Math.round(nextEntry.contentRect.height);

      if (nextWidth <= 0 || nextHeight <= 0) {
        return;
      }

      setFrameSize((current) =>
        current.width === nextWidth && current.height === nextHeight
          ? current
          : { width: nextWidth, height: nextHeight },
      );
    });

    resizeObserver.observe(graphicRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

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
          <div
            className="docs-diagram__react-flow-stage"
            style={{
              width: `${definition.viewport.width}px`,
              height: `${definition.viewport.height}px`,
              transform: `translate(${stageProjection.x}px, ${stageProjection.y}px) scale(${stageProjection.scale})`,
            }}
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
              maxZoom={1}
              minZoom={1}
              nodes={nodes}
              nodesConnectable={false}
              nodesDraggable={false}
              nodesFocusable
              panOnDrag={false}
              panOnScroll={false}
              preventScrolling={false}
              style={{
                width: "100%",
                height: "100%",
              }}
              zoomOnDoubleClick={false}
              zoomOnPinch={false}
              zoomOnScroll={false}
            >
              <Background
                color="color-mix(in srgb, var(--accent) 22%, transparent)"
                gap={20}
              />
            </ReactFlow>
          </div>
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
