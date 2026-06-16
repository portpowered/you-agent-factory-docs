import { DOCS_ENTRY_ROUTE } from "@/lib/project";
import {
  type SharedShellConfig,
  type SharedShellSurface,
  getSharedShellHeaderDestinations,
  sharedShellConfig,
  shouldRenderDocsSidebar,
} from "@/lib/shared-shell-config";
import Link from "next/link";
import type { ReactNode } from "react";

export type SharedShellProps = {
  surface: SharedShellSurface;
  children: ReactNode;
  config?: SharedShellConfig;
  currentDocsItemId?: string;
};

function SharedShellHeader({
  config,
  surface,
}: {
  config: SharedShellConfig;
  surface: SharedShellSurface;
}) {
  const headerDestinations = getSharedShellHeaderDestinations(surface, config);

  return (
    <header className="shared-shell__header">
      <p className="shared-shell__brand">{config.brand}</p>
      <nav
        aria-label={config.primaryNavigation.ariaLabel}
        className="shared-shell__header-nav"
      >
        {headerDestinations.map((destination) =>
          destination.external ? (
            <a
              className="shared-shell__link shared-shell__link--external"
              href={destination.href}
              key={destination.id}
              rel="noopener noreferrer"
              target="_blank"
            >
              {destination.label}
            </a>
          ) : (
            <Link
              className="shared-shell__link"
              href={destination.href}
              key={destination.id}
            >
              {destination.label}
            </Link>
          ),
        )}
      </nav>
    </header>
  );
}

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
    <nav aria-label={docsNavigation.heading} className="shared-shell__docs-nav">
      <p className="shared-shell__docs-nav-heading">{docsNavigation.heading}</p>
      <ul className="shared-shell__docs-nav-list">
        {docsNavigation.items.map((item) => {
          const isCurrent = item.id === currentDocsItemId;

          return (
            <li key={item.id}>
              <Link
                aria-current={isCurrent ? "page" : undefined}
                className={
                  isCurrent
                    ? "shared-shell__docs-nav-link shared-shell__docs-nav-link--active"
                    : "shared-shell__docs-nav-link"
                }
                href={item.href}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
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
