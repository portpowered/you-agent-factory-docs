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
    <footer className="border-t bg-card px-5 py-4 md:px-6">
      <p className="m-0 text-sm text-muted-foreground">{footerText}</p>
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
    ? "flex min-w-0 flex-1 flex-col xl:grid xl:grid-cols-[minmax(12rem,16rem)_minmax(0,1fr)]"
    : "flex min-w-0 flex-1 flex-col";
  const mainClassName = showDocsSidebar
    ? "min-w-0 flex-1 px-5 py-8 md:px-6 lg:py-12 [&_h1]:text-balance [&_h2]:text-balance [&_h3]:text-balance [&_h4]:text-balance [&_h5]:text-balance [&_h6]:text-balance"
    : "flex min-w-0 flex-1 justify-center px-5 py-8 md:px-6 lg:py-12 [&_h1]:text-balance [&_h2]:text-balance [&_h3]:text-balance [&_h4]:text-balance [&_h5]:text-balance [&_h6]:text-balance";

  return (
    <ResponsiveShellRoot className="shared-shell flex min-h-screen flex-col">
      <SharedShellHeader config={config} surface={surface} />
      <div className={layoutClassName}>
        {showDocsSidebar ? (
          <SharedShellDocsAside
            config={config}
            currentDocsItemId={currentDocsItemId}
          />
        ) : null}
        <main className={mainClassName}>{children}</main>
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
