"use client";

import { ResponsiveShellRoot } from "@/components/shell/responsive-shell-root";
import { SharedShellDocsAside } from "@/components/shell/shared-shell-docs-aside";
import { SharedShellHeader } from "@/components/shell/shared-shell-header";
import { DOCS_ENTRY_ROUTE } from "@/lib/project";
import {
  type SharedShellConfig,
  type SharedShellSurface,
  sharedShellConfig,
  shouldRenderDocsSidebar,
} from "@/lib/shared-shell-config";
import type { ReactNode } from "react";

export type SharedShellProps = {
  surface: SharedShellSurface;
  children: ReactNode;
  config?: SharedShellConfig;
  currentDocsItemId?: string;
};

function SharedShellFooter({ config }: { config: SharedShellConfig }) {
  const footerText = config.structural.footerText;

  if (!footerText) {
    return null;
  }

  return (
    <footer className="shared-shell__footer">
      <p className="shared-shell__footer-text">{footerText}</p>
    </footer>
  );
}

export function SharedShell({
  surface,
  children,
  config = sharedShellConfig,
  currentDocsItemId,
}: SharedShellProps) {
  const showDocsSidebar = shouldRenderDocsSidebar(surface, config);
  const layoutClassName = showDocsSidebar
    ? "shared-shell__layout shared-shell__layout--with-sidebar"
    : "shared-shell__layout";

  return (
    <ResponsiveShellRoot className="shared-shell">
      <SharedShellHeader config={config} surface={surface} />
      <div className={layoutClassName}>
        {showDocsSidebar ? (
          <SharedShellDocsAside
            config={config}
            currentDocsItemId={currentDocsItemId}
          />
        ) : null}
        <main className="shared-shell__main">{children}</main>
      </div>
      <SharedShellFooter config={config} />
    </ResponsiveShellRoot>
  );
}

export function isDocsEntryRoute(pathname: string): boolean {
  const normalizedPath = pathname.endsWith("/")
    ? pathname.slice(0, -1) || "/"
    : pathname;

  return normalizedPath === DOCS_ENTRY_ROUTE;
}
