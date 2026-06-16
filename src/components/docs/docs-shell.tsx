"use client";

import { DOCS_ENTRY_ROUTE, PROJECT_NAME } from "@/lib/project";
import { GITHUB_REPO_URL } from "@/lib/shell";
import { useMessages } from "@/localization/hooks/use-messages";
import Link from "next/link";

export function DocsShell() {
  const { t } = useMessages();

  return (
    <div className="docs-shell">
      <header className="docs-shell__header">
        <p className="docs-shell__brand">{PROJECT_NAME}</p>
        <nav
          aria-label={t("docs.siteNavAriaLabel")}
          className="docs-shell__header-nav"
        >
          <Link className="docs-shell__link" href="/">
            {t("common.home")}
          </Link>
          <a
            className="docs-shell__link docs-shell__link--external"
            href={GITHUB_REPO_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            {t("common.githubCta")}
          </a>
        </nav>
      </header>

      <div className="docs-shell__layout">
        <nav aria-label={t("docs.navHeading")} className="docs-shell__nav">
          <p className="docs-shell__nav-heading">{t("docs.navHeading")}</p>
          <ul className="docs-shell__nav-list">
            <li>
              <Link
                aria-current="page"
                className="docs-shell__nav-link docs-shell__nav-link--active"
                href={DOCS_ENTRY_ROUTE}
              >
                {t("docs.navOverview")}
              </Link>
            </li>
          </ul>
        </nav>

        <main className="docs-shell__main">
          <article aria-labelledby="docs-shell-title">
            <h1 id="docs-shell-title">{t("docs.shellTitle")}</h1>
            <p className="docs-shell__framing">{t("docs.framingText")}</p>
          </article>
        </main>
      </div>
    </div>
  );
}
