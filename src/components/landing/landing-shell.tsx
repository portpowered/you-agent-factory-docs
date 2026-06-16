import { DOCS_ENTRY_ROUTE, PROJECT_NAME, PROJECT_TAGLINE } from "@/lib/project";
import {
  DOCS_CTA_LABEL,
  GITHUB_CTA_LABEL,
  GITHUB_REPO_URL,
  LANDING_HOW_IT_WORKS_STEPS,
  LANDING_HOW_IT_WORKS_TITLE,
  LANDING_PROBLEM_POINTS,
  LANDING_PROBLEM_TITLE,
  LANDING_SOLUTION_POINTS,
  LANDING_SOLUTION_TITLE,
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
          aria-describedby="landing-hero-summary"
          aria-labelledby="landing-hero-title"
          className="landing-shell__hero"
        >
          <p className="landing-shell__eyebrow">{PROJECT_NAME}</p>
          <h1 id="landing-hero-title">{PROJECT_TAGLINE}</h1>
          <p className="landing-shell__value" id="landing-hero-summary">
            {LANDING_VALUE_STATEMENT}
          </p>
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

        <section
          aria-labelledby="landing-problem-title"
          className="landing-shell__section"
        >
          <h2 id="landing-problem-title">{LANDING_PROBLEM_TITLE}</h2>
          <ul className="landing-shell__list">
            {LANDING_PROBLEM_POINTS.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="landing-solution-title"
          className="landing-shell__section"
        >
          <h2 id="landing-solution-title">{LANDING_SOLUTION_TITLE}</h2>
          <ul className="landing-shell__list">
            {LANDING_SOLUTION_POINTS.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="landing-how-it-works-title"
          className="landing-shell__section"
        >
          <h2 id="landing-how-it-works-title">{LANDING_HOW_IT_WORKS_TITLE}</h2>
          <ol className="landing-shell__steps">
            {LANDING_HOW_IT_WORKS_STEPS.map((step) => (
              <li key={step.title}>
                <h3 className="landing-shell__step-title">{step.title}</h3>
                <p className="landing-shell__step-description">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
