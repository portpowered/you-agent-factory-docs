import { SharedShell } from "@/components/shell/shared-shell";
import type { DocsShellNavigationInput } from "@/lib/content";
import {
  findCurrentDocsItemId,
  projectSharedShellDocsNavigation,
} from "@/lib/content/shared-shell-navigation";
import { DOCS_ENTRY_ROUTE } from "@/lib/project";
import { createSharedShellConfig } from "@/lib/shared-shell-extension-points";
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
  const shellConfig = createSharedShellConfig({
    docsNavigationGroups: projectSharedShellDocsNavigation(navigation),
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
