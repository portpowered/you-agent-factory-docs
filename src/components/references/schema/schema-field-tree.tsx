"use client";

import type { SchemaFieldModel } from "@/lib/references/schema-model";
import { cn } from "@/lib/utils";
import {
  schemaFieldTreeNodeCanExpand,
  schemaFieldTreeNodesFromFields,
} from "./schema-field-path";
import { SchemaFieldRow } from "./schema-field-row";
import type { SchemaFieldTreeNode } from "./types";

export type SchemaFieldTreeProps = {
  /**
   * Pre-built tree nodes (preferred). Use when nested children are already
   * resolved from W04 models.
   */
  nodes?: readonly SchemaFieldTreeNode[];
  /**
   * Flat field list adapter. Equivalent to nodes without children; ignored
   * when `nodes` is provided.
   */
  fields?: readonly SchemaFieldModel[];
  /** Nesting depth for nested trees. Callers normally omit this. */
  depth?: number;
  /** Initial expansion for rows that have children. Default: false. */
  defaultExpanded?: boolean;
  /** Owning page path forwarded to `$ref` links for full href values. */
  pagePath?: string;
  /**
   * When true, omit secondary path labels that equal the leaf name. Forwarded
   * to each {@link SchemaFieldRow}. Default false.
   */
  showFieldPathWhenDistinct?: boolean;
  className?: string;
  "data-testid"?: string;
};

/**
 * Recursive, keyboard-accessible field hierarchy.
 *
 * `$ref` fields render SchemaRefLink (stable-anchor / cycle / unresolved)
 * instead of expanding targets recursively.
 */
export function SchemaFieldTree({
  nodes,
  fields,
  depth = 0,
  defaultExpanded = false,
  pagePath,
  showFieldPathWhenDistinct = false,
  className,
  "data-testid": testId = "schema-field-tree",
}: SchemaFieldTreeProps) {
  const resolvedNodes =
    nodes ??
    (fields !== undefined ? schemaFieldTreeNodesFromFields(fields) : []);

  if (resolvedNodes.length === 0) {
    return null;
  }

  return (
    <ul
      aria-label={depth === 0 ? "Schema fields" : undefined}
      className={cn("m-0 min-w-0 list-none p-0", className)}
      data-schema-field-tree-depth={depth}
      data-testid={testId}
    >
      {resolvedNodes.map((node) => {
        const canExpand = schemaFieldTreeNodeCanExpand(node);
        const nested =
          canExpand &&
          node.children !== undefined &&
          node.children.length > 0 ? (
            <SchemaFieldTree
              defaultExpanded={defaultExpanded}
              depth={depth + 1}
              nodes={node.children}
              pagePath={pagePath}
              showFieldPathWhenDistinct={showFieldPathWhenDistinct}
            />
          ) : null;

        return (
          <SchemaFieldRow
            defaultExpanded={defaultExpanded}
            depth={depth}
            key={node.field.path}
            node={node}
            pagePath={pagePath}
            showFieldPathWhenDistinct={showFieldPathWhenDistinct}
          >
            {nested}
          </SchemaFieldRow>
        );
      })}
    </ul>
  );
}
