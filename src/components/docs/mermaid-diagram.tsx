"use client";

import { loadMermaid } from "@/lib/mermaid-loader";
import { useEffect, useId, useRef, useState } from "react";

type MermaidDiagramProps = {
  title: string;
  description: string;
  definition: string;
  loader?: typeof loadMermaid;
};

type RenderState =
  | {
      status: "loading";
      message: string | null;
    }
  | {
      status: "ready";
      message: string | null;
    }
  | {
      status: "error";
      message: string;
    };

const INITIAL_RENDER_STATE: RenderState = {
  status: "loading",
  message: null,
};

export function MermaidDiagram({
  title,
  description,
  definition,
  loader = loadMermaid,
}: MermaidDiagramProps) {
  const instanceId = useId().replace(/:/g, "");
  const graphicRef = useRef<HTMLDivElement>(null);
  const titleId = `${instanceId}-title`;
  const descriptionId = `${instanceId}-description`;
  const sourceId = `${instanceId}-source`;
  const [renderState, setRenderState] =
    useState<RenderState>(INITIAL_RENDER_STATE);

  useEffect(() => {
    let isActive = true;

    async function renderDiagram() {
      if (graphicRef.current) {
        graphicRef.current.textContent = "";
      }

      setRenderState(INITIAL_RENDER_STATE);

      try {
        const mermaid = await loader();

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          suppressErrorRendering: true,
          theme: "neutral",
          fontFamily: "inherit",
          flowchart: {
            useMaxWidth: true,
            htmlLabels: false,
          },
        });

        const { svg, bindFunctions } = await mermaid.render(
          `${instanceId}-diagram`,
          definition,
        );

        if (!isActive) {
          return;
        }

        if (graphicRef.current) {
          graphicRef.current.innerHTML = svg;
        }

        setRenderState({
          status: "ready",
          message: null,
        });

        queueMicrotask(() => {
          if (isActive && graphicRef.current) {
            bindFunctions?.(graphicRef.current);
          }
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        setRenderState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Unknown Mermaid rendering failure",
        });
      }
    }

    void renderDiagram();

    return () => {
      isActive = false;
    };
  }, [definition, instanceId, loader]);

  return (
    <figure
      aria-describedby={`${descriptionId} ${sourceId}`}
      aria-labelledby={titleId}
      className="docs-diagram"
    >
      <figcaption className="docs-diagram__header">
        <h2 id={titleId}>{title}</h2>
        <p className="docs-diagram__description" id={descriptionId}>
          {description}
        </p>
      </figcaption>

      <div className="docs-diagram__surface">
        {renderState.status === "loading" ? (
          <p aria-live="polite" className="docs-diagram__status">
            Rendering Mermaid diagram from checked-in source…
          </p>
        ) : null}

        {renderState.status === "error" ? (
          <p className="docs-diagram__error" role="alert">
            Mermaid rendering failed: {renderState.message}
          </p>
        ) : null}

        <div
          aria-busy={renderState.status === "loading" ? true : undefined}
          aria-label={title}
          className="docs-diagram__graphic"
          ref={graphicRef}
          role="img"
          suppressHydrationWarning
        />
      </div>

      <div className="docs-diagram__source">
        <p className="docs-diagram__source-label" id={sourceId}>
          Mermaid source of truth
        </p>
        <pre className="docs-diagram__code">
          <code>{definition}</code>
        </pre>
      </div>
    </figure>
  );
}
