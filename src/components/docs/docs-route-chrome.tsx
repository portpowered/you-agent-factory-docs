"use client";

import { DocsBreadcrumbs } from "@/components/docs/docs-breadcrumbs";
import { DocsProgression } from "@/components/docs/docs-progression";
import { DocsSearch } from "@/components/docs/docs-search";
import type { DocsShellNavigationInput } from "@/lib/content";
import { projectDocsBreadcrumbs } from "@/lib/content/docs-breadcrumbs";
import { projectDocsProgression } from "@/lib/content/docs-progression";
import { DOCS_ENTRY_ROUTE } from "@/lib/project";
import { useMessages } from "@/localization/hooks/use-messages";
import type { ReactNode } from "react";

export type DocsRouteChromeProps = {
  navigation: DocsShellNavigationInput;
  currentPath?: string;
  children?: ReactNode;
};

export function DocsRouteChrome({
  navigation,
  currentPath = DOCS_ENTRY_ROUTE,
  children,
}: DocsRouteChromeProps) {
  const { t } = useMessages();
  const breadcrumbs = projectDocsBreadcrumbs(navigation, {
    currentPath,
    docsRootLabel: t("docs.shellTitle"),
  });
  const progression = projectDocsProgression(navigation, { currentPath });

  return (
    <>
      <DocsSearch />
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
    </>
  );
}
