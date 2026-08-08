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
  /**
   * When false, rows omit their per-field copyable deep-link control. A copy
   * button on every parameter is more chrome than signal; the owning definition
   * still carries one. Default true preserves per-field anchors.
   */
  showAnchorCopy?: boolean;
  /**
   * When true, show full OpenAPI pointer breadcrumbs and full-pointer `$ref`
   * labels. Forwarded to each {@link SchemaFieldRow}. Default false prefers
   * leaf names and compact `$ref` labels while keeping copyable deep links.
   */
  showPointerPathChrome?: boolean;
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
  showAnchorCopy = true,
  showPointerPathChrome = false,
  className,
  "data-testid": testId = "schema-field-tree",
}: SchemaFieldTreeProps) {
  const resolvedNodes =
    nodes ??
    (fields !== undefined ? schemaFieldTreeNodesFromFields(fields) : []);

  if (resolvedNodes.length === 0) {
    return null;
  }

  // Reserve the expand column only when a sibling actually uses it. On a flat
  // list it is dead indent that pushes every field off the block's left edge.
  const showExpandColumn = resolvedNodes.some(schemaFieldTreeNodeCanExpand);

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
              showAnchorCopy={showAnchorCopy}
              showFieldPathWhenDistinct={showFieldPathWhenDistinct}
              showPointerPathChrome={showPointerPathChrome}
            />
          ) : null;

        return (
          <SchemaFieldRow
            defaultExpanded={defaultExpanded}
            depth={depth}
            key={node.field.path}
            node={node}
            pagePath={pagePath}
            showAnchorCopy={showAnchorCopy}
            showExpandColumn={showExpandColumn}
            showFieldPathWhenDistinct={showFieldPathWhenDistinct}
            showPointerPathChrome={showPointerPathChrome}
          >
            {nested}
          </SchemaFieldRow>
        );
      })}
    </ul>
  );
}
