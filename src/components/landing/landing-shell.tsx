"use client";

import { SharedShell } from "@/components/shell/shared-shell";
import {
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
  LANDING_WHY_POINTS,
  LANDING_WHY_TITLE,
} from "@/lib/landing-content";
import { DOCS_ENTRY_ROUTE, PROJECT_NAME, PROJECT_TAGLINE } from "@/lib/project";
import { GITHUB_REPO_URL } from "@/lib/shared-shell-config";
import { useMessages } from "@/localization/hooks/use-messages";
import { createSharedShellConfigFromMessages } from "@/localization/lib/create-shared-shell-config";
import Link from "next/link";

export function LandingShell() {
  const { t } = useMessages();
  const config = createSharedShellConfigFromMessages(t);

  return (
    <SharedShell config={config} surface="home">
      <div className="landing-shell__sections flex w-full flex-col items-center gap-8">
        <section
          aria-describedby="landing-hero-summary"
          aria-labelledby="landing-hero-title"
          className="landing-shell__hero w-full max-w-[42rem] rounded-xl border bg-card p-6 shadow-sm sm:p-8"
        >
          <p className="landing-shell__eyebrow mb-3 text-sm font-semibold uppercase tracking-[0.04em] text-accent">
            {PROJECT_NAME}
          </p>
          <h1
            className="m-0 text-[clamp(1.75rem,4vw,2.75rem)] leading-tight tracking-tight text-card-foreground"
            id="landing-hero-title"
          >
            {PROJECT_TAGLINE}
          </h1>
          <p
            className="landing-shell__value mb-0 mt-3 text-[clamp(1rem,2.5vw,1.125rem)] text-muted-foreground"
            id="landing-hero-summary"
          >
            {t("landing.valueStatement")}
          </p>
          <div className="landing-shell__cta-row mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              className="landing-shell__button inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-4 py-2.5 font-semibold text-accent-foreground no-underline transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              href={DOCS_ENTRY_ROUTE}
            >
              {t("common.getStarted")}
            </Link>
            <a
              className="landing-shell__button landing-shell__button--secondary inline-flex min-h-11 items-center justify-center rounded-md border bg-transparent px-4 py-2.5 font-semibold text-card-foreground no-underline transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              href={GITHUB_REPO_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              {t("common.githubCta")}
            </a>
          </div>
        </section>

        <section
          aria-labelledby="landing-problem-title"
          className="landing-shell__section w-full max-w-[42rem] rounded-xl border bg-card p-7 shadow-sm"
        >
          <h2
            className="m-0 mb-4 text-[clamp(1.25rem,3vw,1.75rem)] leading-tight tracking-tight text-card-foreground"
            id="landing-problem-title"
          >
            {LANDING_PROBLEM_TITLE}
          </h2>
          <ul className="landing-shell__list m-0 list-disc pl-5 text-muted-foreground">
            {LANDING_PROBLEM_POINTS.map((point) => (
              <li className="mt-3 first:mt-0" key={point}>
                {point}
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="landing-solution-title"
          className="landing-shell__section w-full max-w-[42rem] rounded-xl border bg-card p-7 shadow-sm"
        >
          <h2
            className="m-0 mb-4 text-[clamp(1.25rem,3vw,1.75rem)] leading-tight tracking-tight text-card-foreground"
            id="landing-solution-title"
          >
            {LANDING_SOLUTION_TITLE}
          </h2>
          <ul className="landing-shell__list m-0 list-disc pl-5 text-muted-foreground">
            {LANDING_SOLUTION_POINTS.map((point) => (
              <li className="mt-3 first:mt-0" key={point}>
                {point}
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="landing-example-workflows-title"
          className="landing-shell__section w-full max-w-[42rem] rounded-xl border bg-card p-7 shadow-sm"
        >
          <h2
            className="m-0 mb-4 text-[clamp(1.25rem,3vw,1.75rem)] leading-tight tracking-tight text-card-foreground"
            id="landing-example-workflows-title"
          >
            {LANDING_EXAMPLE_WORKFLOWS_TITLE}
          </h2>
          <ul className="landing-shell__workflow-list m-0 grid list-none gap-4 p-0">
            {LANDING_EXAMPLE_WORKFLOWS.map((workflow) => (
              <li
                key={workflow.title}
                className="landing-shell__workflow-item rounded-lg border bg-muted px-4 py-4"
              >
                <h3 className="landing-shell__workflow-title m-0 text-base font-semibold leading-snug text-card-foreground">
                  {workflow.title}
                </h3>
                <p className="landing-shell__workflow-description mb-0 mt-1 text-muted-foreground">
                  {workflow.description}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="landing-how-it-works-title"
          className="landing-shell__section w-full max-w-[42rem] rounded-xl border bg-card p-7 shadow-sm"
        >
          <h2
            className="m-0 mb-4 text-[clamp(1.25rem,3vw,1.75rem)] leading-tight tracking-tight text-card-foreground"
            id="landing-how-it-works-title"
          >
            {LANDING_HOW_IT_WORKS_TITLE}
          </h2>
          <ol className="landing-shell__steps m-0 grid gap-4 pl-5">
            {LANDING_HOW_IT_WORKS_STEPS.map((step) => (
              <li key={step.title}>
                <h3 className="landing-shell__step-title m-0 text-base font-semibold leading-snug text-card-foreground">
                  {step.title}
                </h3>
                <p className="landing-shell__step-description mb-0 mt-1 text-muted-foreground">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="landing-why-title"
          className="landing-shell__section w-full max-w-[42rem] rounded-xl border bg-card p-7 shadow-sm"
        >
          <h2
            className="m-0 mb-4 text-[clamp(1.25rem,3vw,1.75rem)] leading-tight tracking-tight text-card-foreground"
            id="landing-why-title"
          >
            {LANDING_WHY_TITLE}
          </h2>
          <ul className="landing-shell__why-list m-0 grid list-none gap-4 p-0">
            {LANDING_WHY_POINTS.map((point) => (
              <li
                key={point.title}
                className="landing-shell__why-item rounded-lg border bg-muted px-4 py-4"
              >
                <h3 className="landing-shell__why-title m-0 text-base font-semibold leading-snug text-card-foreground">
                  {point.title}
                </h3>
                <p className="landing-shell__why-description mb-0 mt-1 text-muted-foreground">
                  {point.description}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-describedby="landing-final-cta-summary"
          aria-labelledby="landing-final-cta-title"
          className="landing-shell__section landing-shell__final-cta w-full max-w-[42rem] rounded-xl border bg-card p-7 shadow-sm"
        >
          <h2
            className="m-0 mb-4 text-[clamp(1.25rem,3vw,1.75rem)] leading-tight tracking-tight text-card-foreground"
            id="landing-final-cta-title"
          >
            {LANDING_FINAL_CTA_TITLE}
          </h2>
          <p
            className="landing-shell__final-cta-summary mb-0 text-[clamp(1rem,2.5vw,1.125rem)] text-muted-foreground"
            id="landing-final-cta-summary"
          >
            {LANDING_FINAL_CTA_SUMMARY}
          </p>
          <div className="landing-shell__cta-row mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              className="landing-shell__button inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-4 py-2.5 font-semibold text-accent-foreground no-underline transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              href={DOCS_ENTRY_ROUTE}
            >
              {t("common.getStarted")}
            </Link>
            <a
              className="landing-shell__button landing-shell__button--secondary inline-flex min-h-11 items-center justify-center rounded-md border bg-transparent px-4 py-2.5 font-semibold text-card-foreground no-underline transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              href={GITHUB_REPO_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              {t("common.githubCta")}
            </a>
          </div>
        </section>
      </div>
    </SharedShell>
  );
}
