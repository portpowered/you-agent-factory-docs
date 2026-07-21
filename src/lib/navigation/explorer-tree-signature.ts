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
  const pages: Array<{ name: string; url: string }> = [];

  for (const node of folder.children) {
    if (node.type === "page") {
      pages.push({ name: node.name, url: node.url });
      continue;
    }
    if (node.type === "folder") {
      pages.push(...pageEntriesInFolder(node));
    }
  }

  return pages;
}

/**
 * Pages listed under a named subgroup separator until the next separator,
 * including pages nested inside secondary folders under that separator.
 * Used to prove declared explorer membership (e.g. resources under
 * Operations → Configuring).
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
      continue;
    }
    if (node.type === "folder") {
      pages.push(...pageEntriesInFolder(node));
    }
  }
  return pages;
}

/**
 * Secondary folder names listed under a named top-group separator until the
 * next separator. Empty when the top group has no nested secondaries.
 */
export function secondaryFolderNamesUnderSeparator(
  folder: Extract<ExplorerNodeSignature, { type: "folder" }>,
  separatorName: string,
): string[] {
  const start = folder.children.findIndex(
    (node) => node.type === "separator" && node.name === separatorName,
  );
  if (start === -1) {
    return [];
  }

  const names: string[] = [];
  for (let index = start + 1; index < folder.children.length; index += 1) {
    const node = folder.children[index];
    if (!node) {
      break;
    }
    if (node.type === "separator") {
      break;
    }
    if (node.type === "folder") {
      names.push(node.name);
    }
  }
  return names;
}

/**
 * Pages listed inside a named secondary folder under a top-group separator.
 * Empty when the secondary folder is absent under that separator.
 */
export function pageEntriesInSecondaryFolderUnderSeparator(
  folder: Extract<ExplorerNodeSignature, { type: "folder" }>,
  separatorName: string,
  secondaryFolderName: string,
): Array<{ name: string; url: string }> {
  const start = folder.children.findIndex(
    (node) => node.type === "separator" && node.name === separatorName,
  );
  if (start === -1) {
    return [];
  }

  for (let index = start + 1; index < folder.children.length; index += 1) {
    const node = folder.children[index];
    if (!node || node.type === "separator") {
      break;
    }
    if (node.type === "folder" && node.name === secondaryFolderName) {
      return pageEntriesInFolder(node);
    }
  }
  return [];
}
