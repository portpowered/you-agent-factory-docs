import { DOCS_ENTRY_ROUTE, PROJECT_NAME } from "@/lib/project";
import {
  DOCS_CTA_LABEL,
  GITHUB_CTA_LABEL,
  GITHUB_REPO_URL,
  LANDING_VALUE_STATEMENT,
} from "@/lib/shell";
import Link from "next/link";

export function LandingShell() {
  return (
    <div className="landing-shell">
      <header className="landing-shell__header">
        <p className="landing-shell__brand">{PROJECT_NAME}</p>
        <nav aria-label="Primary" className="landing-shell__header-nav">
          <Link className="landing-shell__link" href={DOCS_ENTRY_ROUTE}>
            {DOCS_CTA_LABEL}
          </Link>
          <a
            className="landing-shell__link landing-shell__link--external"
            href={GITHUB_REPO_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            {GITHUB_CTA_LABEL}
          </a>
        </nav>
      </header>

      <main className="landing-shell__main">
        <section
          aria-labelledby="landing-hero-title"
          className="landing-shell__hero"
        >
          <h1 id="landing-hero-title">{PROJECT_NAME}</h1>
          <p className="landing-shell__value">{LANDING_VALUE_STATEMENT}</p>
          <div className="landing-shell__cta-row">
            <Link className="landing-shell__button" href={DOCS_ENTRY_ROUTE}>
              {DOCS_CTA_LABEL}
            </Link>
            <a
              className="landing-shell__button landing-shell__button--secondary"
              href={GITHUB_REPO_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              {GITHUB_CTA_LABEL}
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
