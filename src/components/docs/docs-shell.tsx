"use client";

import { SharedShell } from "@/components/shell/shared-shell";
import type { DocsShellNavigationInput } from "@/lib/content";
import {
  findCurrentDocsItemId,
  projectSharedShellDocsNavigation,
} from "@/lib/content/shared-shell-navigation";
import { DOCS_ENTRY_ROUTE } from "@/lib/project";
import { useMessages } from "@/localization/hooks/use-messages";
import { createSharedShellConfigFromMessages } from "@/localization/lib/create-shared-shell-config";
import type { ReactNode } from "react";

export type DocsShellProps = {
  navigation: DocsShellNavigationInput;
  currentPath?: string;
  children?: ReactNode;
};

export function DocsShell({
  navigation,
  currentPath = DOCS_ENTRY_ROUTE,
  children,
}: DocsShellProps) {
  const { t } = useMessages();
  const shellConfig = createSharedShellConfigFromMessages(t, {
    docsNavigationGroups: projectSharedShellDocsNavigation(navigation, {
      navHeading: t("docs.navHeading"),
    }),
  });
  const currentDocsItemId = findCurrentDocsItemId(navigation, currentPath);

  return (
    <SharedShell
      config={shellConfig}
      currentDocsItemId={currentDocsItemId}
      surface="docs"
    >
      {children}
    </SharedShell>
  );
}
