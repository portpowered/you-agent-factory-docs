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
      className="my-8"
    >
      <figcaption>
        <h2
          className="m-0 text-2xl font-semibold tracking-tight text-foreground"
          id={titleId}
        >
          {title}
        </h2>
        <p className="mb-0 mt-2 text-muted-foreground" id={descriptionId}>
          {description}
        </p>
      </figcaption>

      <div className="mt-4 rounded-xl border bg-card p-3 sm:p-4">
        {renderState.status === "loading" ? (
          <p aria-live="polite" className="m-0 text-sm text-muted-foreground">
            Rendering Mermaid diagram from checked-in source…
          </p>
        ) : null}

        {renderState.status === "error" ? (
          <p
            className="m-0 text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            Mermaid rendering failed: {renderState.message}
          </p>
        ) : null}

        <div
          aria-busy={renderState.status === "loading" ? true : undefined}
          aria-label={title}
          className="overflow-hidden rounded-lg border bg-muted"
          ref={graphicRef}
          role="img"
          suppressHydrationWarning
          style={{
            minHeight: "clamp(16rem, 42vw, 28rem)",
          }}
        />
      </div>

      <div className="mt-4 rounded-xl border bg-card p-4">
        <p className="m-0 text-sm font-semibold text-foreground" id={sourceId}>
          Mermaid source of truth
        </p>
        <pre className="mb-0 mt-3 overflow-x-auto rounded-lg bg-background p-4 text-sm text-foreground">
          <code>{definition}</code>
        </pre>
      </div>
    </figure>
  );
}
