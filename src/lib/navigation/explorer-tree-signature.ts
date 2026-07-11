import type * as PageTree from "fumadocs-core/page-tree";
import type { Node } from "fumadocs-core/page-tree";

/** Observable explorer node used for desktop/mobile IA parity comparisons. */
export type ExplorerNodeSignature =
  | {
      type: "folder";
      name: string;
      children: ExplorerNodeSignature[];
    }
  | {
      type: "separator";
      name: string;
    }
  | {
      type: "page";
      name: string;
      url: string;
    };

export type ExplorerTreeSignature = {
  rootName: string;
  children: ExplorerNodeSignature[];
};

function nodeSignature(node: Node): ExplorerNodeSignature | null {
  if (node.type === "separator" && typeof node.name === "string") {
    return { type: "separator", name: node.name };
  }

  if (
    node.type === "page" &&
    typeof node.name === "string" &&
    "url" in node &&
    typeof node.url === "string"
  ) {
    return { type: "page", name: node.name, url: node.url };
  }

  if (node.type === "folder" && typeof node.name === "string") {
    return {
      type: "folder",
      name: node.name,
      children: node.children
        .map((child) => nodeSignature(child))
        .filter((child): child is ExplorerNodeSignature => child !== null),
    };
  }

  return null;
}

/**
 * Serialize a page tree into the explorer IA contract: top-level order, FAQ
 * placement, subgroup separators, and page membership/labels/hrefs.
 */
export function buildExplorerTreeSignature(
  tree: PageTree.Root,
): ExplorerTreeSignature {
  return {
    rootName: String(tree.name),
    children: tree.children
      .map((child) => nodeSignature(child))
      .filter((child): child is ExplorerNodeSignature => child !== null),
  };
}

export function topLevelFolderNames(
  signature: ExplorerTreeSignature,
): string[] {
  return signature.children
    .filter((node) => node.type === "folder")
    .map((node) => node.name);
}

export function topLevelPageEntries(
  signature: ExplorerTreeSignature,
): Array<{ name: string; url: string }> {
  return signature.children
    .filter((node) => node.type === "page")
    .map((node) => ({ name: node.name, url: node.url }));
}

export function folderSignatureByName(
  signature: ExplorerTreeSignature,
  folderName: string,
): Extract<ExplorerNodeSignature, { type: "folder" }> | undefined {
  return signature.children.find(
    (node): node is Extract<ExplorerNodeSignature, { type: "folder" }> =>
      node.type === "folder" && node.name === folderName,
  );
}

export function separatorNamesInFolder(
  folder: Extract<ExplorerNodeSignature, { type: "folder" }>,
): string[] {
  return folder.children
    .filter((node) => node.type === "separator")
    .map((node) => node.name);
}

export function pageEntriesInFolder(
  folder: Extract<ExplorerNodeSignature, { type: "folder" }>,
): Array<{ name: string; url: string }> {
  return folder.children
    .filter((node) => node.type === "page")
    .map((node) => ({ name: node.name, url: node.url }));
}

/**
 * Pages listed under a named subgroup separator until the next separator.
 * Used to prove declared explorer membership (e.g. mock-workers under Functions).
 */
export function pageEntriesUnderSeparator(
  folder: Extract<ExplorerNodeSignature, { type: "folder" }>,
  separatorName: string,
): Array<{ name: string; url: string }> {
  const start = folder.children.findIndex(
    (node) => node.type === "separator" && node.name === separatorName,
  );
  if (start === -1) {
    return [];
  }

  const pages: Array<{ name: string; url: string }> = [];
  for (let index = start + 1; index < folder.children.length; index += 1) {
    const node = folder.children[index];
    if (!node) {
      break;
    }
    if (node.type === "separator") {
      break;
    }
    if (node.type === "page") {
      pages.push({ name: node.name, url: node.url });
    }
  }
  return pages;
}
