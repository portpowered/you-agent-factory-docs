import {
  CODE_PRESENTATION_EXAMPLE_ROUTE,
  DOCS_NAV_CODE_PRESENTATION_LABEL,
} from "@/lib/docs-primitives";
import { DOCS_ENTRY_ROUTE, PROJECT_NAME } from "@/lib/project";
import {
  DOCS_NAV_HEADING,
  DOCS_NAV_OVERVIEW_LABEL,
  GITHUB_CTA_LABEL,
  GITHUB_REPO_URL,
  HOME_CTA_LABEL,
} from "@/lib/shell";
import Link from "next/link";
import type { ReactNode } from "react";

export type DocsNavId = "overview" | "code-presentation";

type DocsShellLayoutProps = {
  activeNav: DocsNavId;
  children: ReactNode;
};

const NAV_ITEMS: Array<{
  id: DocsNavId;
  href: string;
  label: string;
}> = [
  {
    id: "overview",
    href: DOCS_ENTRY_ROUTE,
    label: DOCS_NAV_OVERVIEW_LABEL,
  },
  {
    id: "code-presentation",
    href: CODE_PRESENTATION_EXAMPLE_ROUTE,
    label: DOCS_NAV_CODE_PRESENTATION_LABEL,
  },
];

export function DocsShellLayout({ activeNav, children }: DocsShellLayoutProps) {
  return (
    <div className="docs-shell">
      <header className="docs-shell__header">
        <p className="docs-shell__brand">{PROJECT_NAME}</p>
        <nav aria-label="Site" className="docs-shell__header-nav">
          <Link className="docs-shell__link" href="/">
            {HOME_CTA_LABEL}
          </Link>
          <a
            className="docs-shell__link docs-shell__link--external"
            href={GITHUB_REPO_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            {GITHUB_CTA_LABEL}
          </a>
        </nav>
      </header>

      <div className="docs-shell__layout">
        <nav aria-label={DOCS_NAV_HEADING} className="docs-shell__nav">
          <p className="docs-shell__nav-heading">{DOCS_NAV_HEADING}</p>
          <ul className="docs-shell__nav-list">
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <Link
                  aria-current={activeNav === item.id ? "page" : undefined}
                  className={
                    activeNav === item.id
                      ? "docs-shell__nav-link docs-shell__nav-link--active"
                      : "docs-shell__nav-link"
                  }
                  href={item.href}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <main className="docs-shell__main">{children}</main>
      </div>
    </div>
  );
}
