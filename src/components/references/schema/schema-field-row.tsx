"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import { cn } from "@/lib/utils";
import {
  schemaFieldLeafName,
  schemaFieldTreeNodeCanExpand,
} from "./schema-field-path";
import { SchemaRequiredBadge } from "./schema-required-badge";
import { SchemaTypeBadge } from "./schema-type-badge";
import type { SchemaFieldTreeNode } from "./types";

export type SchemaFieldRowProps = {
  node: SchemaFieldTreeNode;
  /** Nesting depth (0 = root). Used for indentation and aria-level. */
  depth?: number;
  /** Initial expansion when the row has nested children. Default: false. */
  defaultExpanded?: boolean;
  /** Nested field tree rendered when expanded. */
  children?: ReactNode;
  className?: string;
  "data-testid"?: string;
};

export function SchemaFieldRow({
  node,
  depth = 0,
  defaultExpanded = false,
  children,
  className,
  "data-testid": testId = "schema-field-row",
}: SchemaFieldRowProps) {
  const { field } = node;
  const canExpand = schemaFieldTreeNodeCanExpand(node) && children != null;
  const [expanded, setExpanded] = useState(defaultExpanded && canExpand);
  const panelId = useId();
  const leafName = schemaFieldLeafName(field.path);
  const refTarget = field.refTarget;

  return (
    <li
      className={cn("min-w-0 list-none", className)}
      data-schema-field-depth={depth}
      data-schema-field-path={field.path}
      data-testid={testId}
    >
      <div
        className="flex min-w-0 flex-wrap items-start gap-2 border-border border-b py-2"
        style={{ paddingInlineStart: `${depth * 1.25}rem` }}
      >
        {canExpand ? (
          <button
            aria-controls={panelId}
            aria-expanded={expanded}
            aria-label={
              expanded
                ? `Collapse fields under ${field.path}`
                : `Expand fields under ${field.path}`
            }
            className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            data-schema-field-expand=""
            onClick={() => {
              setExpanded((current) => !current);
            }}
            type="button"
          >
            {expanded ? (
              <ChevronDown aria-hidden="true" className="size-4" />
            ) : (
              <ChevronRight aria-hidden="true" className="size-4" />
            )}
          </button>
        ) : (
          <span
            aria-hidden="true"
            className="mt-0.5 inline-flex size-7 shrink-0"
            data-schema-field-expand-spacer=""
          />
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span
              className="font-mono font-medium text-foreground text-sm"
              data-schema-field-name=""
            >
              {leafName}
            </span>
            <code
              className="max-w-full truncate font-mono text-muted-foreground text-xs"
              data-schema-field-path-label=""
              title={field.path}
            >
              {field.path}
            </code>
            <SchemaRequiredBadge required={field.required} />
            <SchemaTypeBadge
              format={field.format}
              nullable={field.nullable}
              typeSummary={field.typeSummary}
            />
          </div>

          {field.description !== undefined ? (
            <p
              className="text-muted-foreground text-sm"
              data-schema-field-description=""
            >
              {field.description}
            </p>
          ) : null}

          {refTarget !== undefined ? (
            <p
              className="font-mono text-muted-foreground text-xs"
              data-schema-ref-placeholder=""
            >
              $ref → {refTarget.pointer}
              <span className="sr-only">
                {" "}
                (reference link; not expanded recursively)
              </span>
            </p>
          ) : null}
        </div>
      </div>

      {canExpand && expanded ? (
        <div data-schema-field-children="" id={panelId}>
          {children}
        </div>
      ) : null}
    </li>
  );
}
