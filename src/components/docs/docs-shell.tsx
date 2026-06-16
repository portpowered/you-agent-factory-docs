"use client";

import { DocsBreadcrumbs } from "@/components/docs/docs-breadcrumbs";
import { DocsProgression } from "@/components/docs/docs-progression";
import { SharedShell } from "@/components/shell/shared-shell";
import type { DocsShellNavigationInput } from "@/lib/content";
import { projectDocsBreadcrumbs } from "@/lib/content/docs-breadcrumbs";
import { projectDocsProgression } from "@/lib/content/docs-progression";
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
  const breadcrumbs = projectDocsBreadcrumbs(navigation, {
    currentPath,
    docsRootLabel: t("docs.shellTitle"),
  });
  const progression = projectDocsProgression(navigation, { currentPath });

  return (
    <SharedShell
      config={shellConfig}
      currentDocsItemId={currentDocsItemId}
      surface="docs"
    >
      <DocsBreadcrumbs
        ariaLabel={t("docs.breadcrumbAriaLabel")}
        trail={breadcrumbs}
      />
      {children}
      <DocsProgression
        ariaLabel={t("docs.progressionAriaLabel")}
        nextPagePrefix={t("docs.nextPagePrefix")}
        previousPagePrefix={t("docs.previousPagePrefix")}
        progression={progression}
      />
    </SharedShell>
  );
}
