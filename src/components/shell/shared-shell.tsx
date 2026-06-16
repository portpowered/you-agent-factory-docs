import { DOCS_ENTRY_ROUTE } from "@/lib/project";
import {
  type SharedShellConfig,
  type SharedShellSurface,
  sharedShellConfig,
  shouldRenderDocsSidebar,
} from "@/lib/shared-shell-config";
import type { ReactNode } from "react";
import { SharedShellHeader } from "./shared-shell-header";
import { SharedShellDocsNavigation } from "./shared-shell-navigation";

export type SharedShellProps = {
  surface: SharedShellSurface;
  children: ReactNode;
  config?: SharedShellConfig;
  currentDocsItemId?: string;
};

function SharedShellDocsAside({
  config,
  currentDocsItemId = "overview",
}: {
  config: SharedShellConfig;
  currentDocsItemId?: string;
}) {
  const docsNavigation = config.docsNavigation;

  if (!docsNavigation) {
    return null;
  }

  return (
    <SharedShellDocsNavigation
      ariaLabel={docsNavigation.heading}
      currentItemId={currentDocsItemId}
      heading={docsNavigation.heading}
      items={docsNavigation.items}
    />
  );
}

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
    <div className="shared-shell">
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
    </div>
  );
}

export function isDocsEntryRoute(pathname: string): boolean {
  const normalizedPath = pathname.endsWith("/")
    ? pathname.slice(0, -1) || "/"
    : pathname;

  return normalizedPath === DOCS_ENTRY_ROUTE;
}
