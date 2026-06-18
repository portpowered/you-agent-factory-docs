"use client";

import { DocsBreadcrumbs } from "@/components/docs/docs-breadcrumbs";
import { DocsProgression } from "@/components/docs/docs-progression";
import { DocsSearch } from "@/components/docs/docs-search";
import type {
  DocsBreadcrumbItem,
  DocsShellNavigationInput,
} from "@/lib/content";
import { projectDocsBreadcrumbs } from "@/lib/content/docs-breadcrumbs";
import { projectDocsProgression } from "@/lib/content/docs-progression";
import { DOCS_ENTRY_ROUTE } from "@/lib/project";
import { useMessages } from "@/localization/hooks/use-messages";
import type { SharedShellMessageKey } from "@/types/localization";
import type { ReactNode } from "react";

type DocsRouteBreadcrumbItem =
  | DocsBreadcrumbItem
  | {
      href?: string;
      labelKey: SharedShellMessageKey;
    };

export type DocsRouteChromeProps = {
  navigation: DocsShellNavigationInput;
  currentPath?: string;
  breadcrumbItems?: DocsRouteBreadcrumbItem[];
  hideProgression?: boolean;
  children?: ReactNode;
};

export function DocsRouteChrome({
  navigation,
  currentPath = DOCS_ENTRY_ROUTE,
  breadcrumbItems,
  hideProgression = false,
  children,
}: DocsRouteChromeProps) {
  const { t } = useMessages();
  const breadcrumbs =
    breadcrumbItems !== undefined
      ? {
          items: [
            { label: t("docs.shellTitle"), href: DOCS_ENTRY_ROUTE },
            ...breadcrumbItems.map((item) => ({
              href: item.href,
              label: "labelKey" in item ? t(item.labelKey) : item.label,
            })),
          ],
        }
      : projectDocsBreadcrumbs(navigation, {
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
      {hideProgression ? null : (
        <DocsProgression
          ariaLabel={t("docs.progressionAriaLabel")}
          nextPagePrefix={t("docs.nextPagePrefix")}
          previousPagePrefix={t("docs.previousPagePrefix")}
          progression={progression}
        />
      )}
    </>
  );
}
