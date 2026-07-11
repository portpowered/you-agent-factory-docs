import type { Node } from "fumadocs-core/page-tree";
import {
  isDocsPageShippedForLocale,
  loadShippedLocalizedDocsPagesSync,
} from "@/lib/content/pages";
import type {
  ExplorerFolderMessages,
  ExplorerMessages,
  UiMessages,
} from "@/lib/content/ui-messages.types";
import { loadUiMessagesFromDisk } from "@/lib/content/ui-messages-load";
import {
  buildDefaultFolderLabelToIdMap,
  buildDefaultGroupLabelLocalizer,
  resolveExplorerMessages,
} from "@/lib/i18n/explorer-labels";
import {
  defaultLocale,
  matchLocalizedRoute,
  type SiteLocale,
  switchRouteLocale,
} from "@/lib/i18n/locale-routing";

export type LocalizePageTreeOptions = {
  /**
   * Locale UI messages. When omitted, messages load from disk so URL pruning
   * call sites still receive localized explorer labels.
   */
  messages?: UiMessages;
};

type LocalizationContext = {
  folderLabelToId: Map<string, keyof ExplorerFolderMessages>;
  groupLabelLocalizer: Map<string, string>;
  pageTitlesBySlug: Map<string, string>;
  explorer: ExplorerMessages;
};

function separatorHasFollowingContent(
  children: Node[],
  separatorIndex: number,
): boolean {
  const following = children.slice(separatorIndex + 1);
  const nextSeparatorIndex = following.findIndex(
    (candidate) => candidate.type === "separator",
  );
  const groupChildren =
    nextSeparatorIndex === -1
      ? following
      : following.slice(0, nextSeparatorIndex);
  return groupChildren.length > 0;
}

function trimEmptySeparators(children: Node[]): Node[] {
  const trimmed: Node[] = [];

  for (const [index, child] of children.entries()) {
    if (child.type === "separator") {
      if (!separatorHasFollowingContent(children, index)) {
        continue;
      }
      if (trimmed.at(-1)?.type === "separator") {
        continue;
      }
    }

    trimmed.push(child);
  }

  return trimmed;
}

function docsSlugFromNodeUrl(url: string): string | null {
  const match = matchLocalizedRoute(url);
  if (match.kind !== "matched") {
    return null;
  }
  if (match.destination.surface !== "docs-page") {
    return null;
  }
  return match.destination.slug;
}

function localizeNode(
  node: Node,
  locale: SiteLocale,
  context: LocalizationContext,
): Node | null {
  if (node.type === "separator") {
    const defaultName = String(node.name);
    const localizedName = context.groupLabelLocalizer.get(defaultName);
    return {
      ...node,
      name: localizedName ?? node.name,
    };
  }

  if (node.type === "folder") {
    const defaultName = String(node.name);
    const folderId = context.folderLabelToId.get(defaultName);
    const localizedFolderName = folderId
      ? context.explorer.folders[folderId]
      : node.name;

    const children = trimEmptySeparators(
      node.children
        .map((child) => localizeNode(child, locale, context))
        .filter((child): child is Node => child !== null),
    );
    if (children.length === 0) {
      return null;
    }

    return {
      ...node,
      name: localizedFolderName,
      children,
    };
  }

  if ("url" in node && typeof node.url === "string") {
    const match = matchLocalizedRoute(node.url);
    if (match.kind === "matched") {
      if (
        locale !== defaultLocale &&
        match.destination.surface === "docs-page" &&
        !isDocsPageShippedForLocale(match.destination.slug, locale)
      ) {
        return null;
      }

      const docsSlug = docsSlugFromNodeUrl(node.url);
      const localizedTitle =
        docsSlug !== null ? context.pageTitlesBySlug.get(docsSlug) : undefined;

      return {
        ...node,
        ...(localizedTitle !== undefined ? { name: localizedTitle } : {}),
        url:
          locale === defaultLocale
            ? node.url
            : switchRouteLocale(node.url, locale),
      };
    }
  }

  return { ...node };
}

function buildLocalizationContext(
  locale: SiteLocale,
  messages: UiMessages,
): LocalizationContext {
  const explorer = resolveExplorerMessages(messages);
  const pages = loadShippedLocalizedDocsPagesSync(locale);
  const pageTitlesBySlug = new Map(
    pages.map((page) => [page.docsSlug, page.messages.title] as const),
  );

  return {
    folderLabelToId: buildDefaultFolderLabelToIdMap(),
    groupLabelLocalizer: buildDefaultGroupLabelLocalizer(explorer),
    pageTitlesBySlug,
    explorer,
  };
}

export function localizePageTree<T extends { children: Node[] }>(
  tree: T,
  locale: SiteLocale,
  options: LocalizePageTreeOptions = {},
): T {
  const messages = options.messages ?? loadUiMessagesFromDisk(locale);
  const context = buildLocalizationContext(locale, messages);

  return {
    ...tree,
    children: trimEmptySeparators(
      tree.children
        .map((child) => localizeNode(child, locale, context))
        .filter((child): child is Node => child !== null),
    ),
  };
}
