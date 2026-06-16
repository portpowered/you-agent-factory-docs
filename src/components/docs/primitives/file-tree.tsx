import {
  DEFAULT_FILE_TREE_LABEL,
  type FileTreeNode,
  formatFileTreeNodeAccessibleName,
} from "@/lib/docs-primitives";
import type { CSSProperties } from "react";

type FileTreeProps = {
  nodes: FileTreeNode[];
  label?: string;
};

type FileTreeListProps = {
  nodes: FileTreeNode[];
  depth: number;
};

function FileTreeList({ nodes, depth }: FileTreeListProps) {
  return (
    <ul
      className={
        depth > 0
          ? "docs-file-tree__list docs-file-tree__list--nested"
          : "docs-file-tree__list"
      }
      data-depth={depth}
    >
      {nodes.map((node) => (
        <li
          aria-label={formatFileTreeNodeAccessibleName(node.kind, node.name)}
          className={`docs-file-tree__item docs-file-tree__item--${node.kind}`}
          data-depth={depth}
          key={`${depth}-${node.name}`}
          style={{ "--file-tree-depth": depth } as CSSProperties}
        >
          <span aria-hidden="true" className="docs-file-tree__icon">
            {node.kind === "folder" ? "📁" : "📄"}
          </span>
          <span className="docs-file-tree__name">{node.name}</span>
          {node.children && node.children.length > 0 ? (
            <FileTreeList depth={depth + 1} nodes={node.children} />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function FileTree({
  nodes,
  label = DEFAULT_FILE_TREE_LABEL,
}: FileTreeProps) {
  if (nodes.length === 0) {
    return (
      <nav aria-label={label} className="docs-file-tree">
        <p className="docs-file-tree__empty">No files to display.</p>
      </nav>
    );
  }

  return (
    <nav aria-label={label} className="docs-file-tree">
      <FileTreeList depth={0} nodes={nodes} />
    </nav>
  );
}
