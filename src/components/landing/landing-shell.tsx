"use client";

import { DOCS_ENTRY_ROUTE, PROJECT_NAME } from "@/lib/project";
import { GITHUB_REPO_URL } from "@/lib/shell";
import { useMessages } from "@/localization/hooks/use-messages";
import Link from "next/link";

export function LandingShell() {
  const { t } = useMessages();

  return (
    <div className="landing-shell">
      <header className="landing-shell__header">
        <p className="landing-shell__brand">{PROJECT_NAME}</p>
        <nav
          aria-label={t("landing.primaryNavAriaLabel")}
          className="landing-shell__header-nav"
        >
          <Link className="landing-shell__link" href={DOCS_ENTRY_ROUTE}>
            {t("common.getStarted")}
          </Link>
          <a
            className="landing-shell__link landing-shell__link--external"
            href={GITHUB_REPO_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            {t("common.githubCta")}
          </a>
        </nav>
      </header>

      <main className="landing-shell__main">
        <section
          aria-labelledby="landing-hero-title"
          className="landing-shell__hero"
        >
          <h1 id="landing-hero-title">{PROJECT_NAME}</h1>
          <p className="landing-shell__value">{t("landing.valueStatement")}</p>
          <div className="landing-shell__cta-row">
            <Link className="landing-shell__button" href={DOCS_ENTRY_ROUTE}>
              {t("common.getStarted")}
            </Link>
            <a
              className="landing-shell__button landing-shell__button--secondary"
              href={GITHUB_REPO_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              {t("common.githubCta")}
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
