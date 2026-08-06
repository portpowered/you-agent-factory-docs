import type { Node } from "fumadocs-core/page-tree";

/**
 * Shared explorer-tree lookups for navigation contract tests.
 *
 * The folder search is **recursive**. Collection folders (Guides, Program
 * documentation, Reference, …) used to be the tree's top level, so every test
 * found them with a single `children.find`. They now sit one level down inside
 * the four reader-facing groups, and a shallow lookup would report each of them
 * as missing. Recursing keeps these tests asserting what they are actually
 * about — what a folder contains and in what order — rather than how deep it
 * happens to sit.
 */
export function findFolderNode(
  nodes: readonly Node[],
  folderName: string,
): Extract<Node, { type: "folder" }> | undefined {
  for (const node of nodes) {
    if (node.type !== "folder") {
      continue;
    }
    if (String(node.name) === folderName) {
      return node;
    }
    const nested = findFolderNode(node.children, folderName);
    if (nested) {
      return nested;
    }
  }
  return undefined;
}

/** Children of the named folder, found at any depth. Throws when absent. */
export function findFolderChildren(
  pageTree: { children: Node[] },
  folderName: string,
): Node[] {
  const folder = findFolderNode(pageTree.children, folderName);
  if (!folder) {
    throw new Error(`expected ${folderName} folder in docs sidebar`);
  }
  return folder.children;
}

/**
 * Folder names one level below the four top-level groups — the level that used
 * to be the top level, and which most order contracts are written against.
 */
export function listCollectionFolderNames(pageTree: {
  children: Node[];
}): string[] {
  return pageTree.children
    .filter((node) => node.type === "folder")
    .flatMap((group) =>
      group.children
        .filter((node) => node.type === "folder")
        .map((folder) => String(folder.name)),
    );
}

/** The four reader-facing group names, in order. */
export function listTopLevelGroupNames(pageTree: {
  children: Node[];
}): string[] {
  return pageTree.children
    .filter((node) => node.type === "folder")
    .map((folder) => String(folder.name));
}
