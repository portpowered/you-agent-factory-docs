import { DOCS_ENTRY_ROUTE, PROJECT_NAME } from "@/lib/project";
import {
  DOCS_NAV_HEADING,
  DOCS_NAV_OVERVIEW_LABEL,
  DOCS_SHELL_FRAMING_TEXT,
  DOCS_SHELL_TITLE,
  GITHUB_CTA_LABEL,
  GITHUB_REPO_URL,
  HOME_CTA_LABEL,
} from "@/lib/shell";
import {
  DOCS_OVERVIEW_ARIA_CURRENT,
  DOCS_SITE_NAV_ARIA_LABEL,
} from "@/lib/validation/shell-accessibility";
import Link from "next/link";

export function DocsShell() {
  return (
    <div className="docs-shell">
      <header className="docs-shell__header">
        <p className="docs-shell__brand">{PROJECT_NAME}</p>
        <nav
          aria-label={DOCS_SITE_NAV_ARIA_LABEL}
          className="docs-shell__header-nav"
        >
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
            <li>
              <Link
                aria-current={DOCS_OVERVIEW_ARIA_CURRENT}
                className="docs-shell__nav-link docs-shell__nav-link--active"
                href={DOCS_ENTRY_ROUTE}
              >
                {DOCS_NAV_OVERVIEW_LABEL}
              </Link>
            </li>
          </ul>
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
