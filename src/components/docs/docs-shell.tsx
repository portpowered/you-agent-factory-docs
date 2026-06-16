import type { DocsShellNavigationInput } from "@/lib/content";
import { DOCS_ENTRY_ROUTE, PROJECT_NAME } from "@/lib/project";
import {
  DOCS_NAV_HEADING,
  DOCS_SHELL_FRAMING_TEXT,
  DOCS_SHELL_TITLE,
  GITHUB_CTA_LABEL,
  GITHUB_REPO_URL,
  HOME_CTA_LABEL,
} from "@/lib/shell";
import Link from "next/link";

export type DocsShellProps = {
  navigation: DocsShellNavigationInput;
  currentPath?: string;
};

export function DocsShell({
  navigation,
  currentPath = DOCS_ENTRY_ROUTE,
}: DocsShellProps) {
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
          {navigation.sections.map((section) => (
            <section
              key={section.id}
              aria-labelledby={`docs-nav-section-${section.id}`}
              className="docs-shell__nav-section"
            >
              <p
                className="docs-shell__nav-section-heading"
                id={`docs-nav-section-${section.id}`}
              >
                {section.label}
              </p>
              <ul className="docs-shell__nav-list">
                {section.pages.map((page) => {
                  const isActive = currentPath === page.href;

                  return (
                    <li key={page.canonicalId}>
                      <Link
                        aria-current={isActive ? "page" : undefined}
                        className={
                          isActive
                            ? "docs-shell__nav-link docs-shell__nav-link--active"
                            : "docs-shell__nav-link"
                        }
                        href={page.href}
                      >
                        {page.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </nav>

        <main className="docs-shell__main">
          <article aria-labelledby="docs-shell-title">
            <h1 id="docs-shell-title">{DOCS_SHELL_TITLE}</h1>
            <p className="docs-shell__framing">{DOCS_SHELL_FRAMING_TEXT}</p>
          </article>
        </main>
      </div>
    </div>
  );
}
