import type { FileTreeNode } from "@/lib/docs-primitives";
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
    <ul className="docs-file-tree__list">
      {nodes.map((node) => (
        <li
          className={`docs-file-tree__item docs-file-tree__item--${node.kind}`}
          key={`${depth}-${node.name}`}
          style={{ "--file-tree-depth": depth } as CSSProperties}
        >
          <span
            aria-hidden={node.kind === "folder" ? undefined : true}
            className="docs-file-tree__icon"
          >
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
  label = "Example file tree",
}: FileTreeProps) {
  return (
    <nav aria-label={label} className="docs-file-tree">
      <FileTreeList depth={0} nodes={nodes} />
    </nav>
  );
}
