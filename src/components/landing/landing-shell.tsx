import { DOCS_ENTRY_ROUTE, PROJECT_NAME, PROJECT_TAGLINE } from "@/lib/project";
import {
  DOCS_CTA_LABEL,
  GITHUB_CTA_LABEL,
  GITHUB_REPO_URL,
  LANDING_EXAMPLE_WORKFLOWS,
  LANDING_EXAMPLE_WORKFLOWS_TITLE,
  LANDING_FINAL_CTA_SUMMARY,
  LANDING_FINAL_CTA_TITLE,
  LANDING_HOW_IT_WORKS_STEPS,
  LANDING_HOW_IT_WORKS_TITLE,
  LANDING_PROBLEM_POINTS,
  LANDING_PROBLEM_TITLE,
  LANDING_SOLUTION_POINTS,
  LANDING_SOLUTION_TITLE,
  LANDING_VALUE_STATEMENT,
  LANDING_WHY_POINTS,
  LANDING_WHY_TITLE,
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
          aria-labelledby="landing-example-workflows-title"
          className="landing-shell__section"
        >
          <h2 id="landing-example-workflows-title">
            {LANDING_EXAMPLE_WORKFLOWS_TITLE}
          </h2>
          <ul className="landing-shell__workflow-list">
            {LANDING_EXAMPLE_WORKFLOWS.map((workflow) => (
              <li key={workflow.title} className="landing-shell__workflow-item">
                <h3 className="landing-shell__workflow-title">
                  {workflow.title}
                </h3>
                <p className="landing-shell__workflow-description">
                  {workflow.description}
                </p>
              </li>
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

        <section
          aria-labelledby="landing-why-title"
          className="landing-shell__section"
        >
          <h2 id="landing-why-title">{LANDING_WHY_TITLE}</h2>
          <ul className="landing-shell__why-list">
            {LANDING_WHY_POINTS.map((point) => (
              <li key={point.title} className="landing-shell__why-item">
                <h3 className="landing-shell__why-title">{point.title}</h3>
                <p className="landing-shell__why-description">
                  {point.description}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-describedby="landing-final-cta-summary"
          aria-labelledby="landing-final-cta-title"
          className="landing-shell__section landing-shell__final-cta"
        >
          <h2 id="landing-final-cta-title">{LANDING_FINAL_CTA_TITLE}</h2>
          <p
            className="landing-shell__final-cta-summary"
            id="landing-final-cta-summary"
          >
            {LANDING_FINAL_CTA_SUMMARY}
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
      </main>
    </div>
  );
}
