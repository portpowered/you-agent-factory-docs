"use client";

import { usePathname } from "fumadocs-core/framework";
import type * as PageTree from "fumadocs-core/page-tree";
import {
  SidebarFolder,
  SidebarFolderContent,
  SidebarFolderLink,
  SidebarFolderTrigger,
  SidebarItem,
  SidebarSeparator,
} from "fumadocs-ui/components/sidebar/base";
import { useTreePath } from "fumadocs-ui/contexts/tree";
import type { ReactNode } from "react";
import { DOCS_CHROME_SIDEBAR_ROW_CLASSES } from "@/features/docs/styles/docs-chrome-sidebar";
import { cn } from "@/lib/utils";

function isActiveUrl(currentPath: string, targetPath: string) {
  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}

const ROOT_SECTION_GAP_CLASS = "mb-3";
const CHILD_NODE_GAP_CLASS = "mb-1";

export const docsSidebarTreeComponents = {
  Item: function DocsSidebarTreeItem({ item }: { item: PageTree.Item }) {
    const pathname = usePathname();

    return (
      <SidebarItem
        href={item.url}
        external={item.external}
        active={isActiveUrl(pathname, item.url)}
        icon={item.icon}
        className={cn(
          DOCS_CHROME_SIDEBAR_ROW_CLASSES,
          CHILD_NODE_GAP_CLASS,
          "overflow-hidden text-ellipsis",
        )}
      >
        {item.name}
      </SidebarItem>
    );
  },
  Folder: function DocsSidebarTreeFolder({
    item,
    children,
  }: {
    item: PageTree.Folder;
    children: ReactNode;
  }) {
    const pathname = usePathname();
    const path = useTreePath();

    return (
      <SidebarFolder
        collapsible={item.collapsible}
        active={path.includes(item)}
        defaultOpen={item.defaultOpen}
      >
        {item.index ? (
          <SidebarFolderLink
            href={item.index.url}
            active={isActiveUrl(pathname, item.index.url)}
            external={item.index.external}
            className={cn(
              DOCS_CHROME_SIDEBAR_ROW_CLASSES,
              ROOT_SECTION_GAP_CLASS,
              "overflow-hidden text-ellipsis",
            )}
          >
            {item.icon}
            {item.name}
          </SidebarFolderLink>
        ) : (
          <SidebarFolderTrigger
            className={cn(
              DOCS_CHROME_SIDEBAR_ROW_CLASSES,
              ROOT_SECTION_GAP_CLASS,
              "overflow-hidden text-ellipsis",
            )}
          >
            {item.icon}
            {item.name}
          </SidebarFolderTrigger>
        )}
        <SidebarFolderContent className="relative">
          <div className="flex flex-col gap-1 pt-0.5">{children}</div>
        </SidebarFolderContent>
      </SidebarFolder>
    );
  },
  Separator: function DocsSidebarTreeSeparator({
    item,
  }: {
    item: PageTree.Separator;
  }) {
    return (
      <SidebarSeparator className="mb-2.5 mt-6 px-2 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-fd-foreground/55 first:mt-1">
        {item.icon}
        {item.name}
      </SidebarSeparator>
    );
  },
} satisfies {
  Item: (props: { item: PageTree.Item }) => ReactNode;
  Folder: (props: { item: PageTree.Folder; children: ReactNode }) => ReactNode;
  Separator: (props: { item: PageTree.Separator }) => ReactNode;
};
