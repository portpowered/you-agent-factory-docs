"use client";

import { SharedShell } from "@/components/shell/shared-shell";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
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

export function LandingShell() {
  const { t } = useMessages();
  const config = createSharedShellConfigFromMessages(t);

  return (
    <SharedShell config={config} surface="home">
      <div className="flex w-full flex-col items-center gap-8">
        <Card
          aria-describedby="landing-hero-summary"
          aria-labelledby="landing-hero-title"
          className="max-w-[42rem] p-6 sm:p-8"
        >
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.04em] text-accent">
            {PROJECT_NAME}
          </p>
          <h1
            className="m-0 text-[clamp(1.75rem,4vw,2.75rem)] leading-tight tracking-tight text-card-foreground"
            id="landing-hero-title"
          >
            {PROJECT_TAGLINE}
          </h1>
          <CardDescription
            className="mb-0 mt-3 text-[clamp(1rem,2.5vw,1.125rem)] text-muted-foreground"
            id="landing-hero-summary"
          >
            {t("landing.valueStatement")}
          </CardDescription>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <ButtonLink href={DOCS_ENTRY_ROUTE}>
              {t("common.getStarted")}
            </ButtonLink>
            <ButtonLink external href={GITHUB_REPO_URL} variant="secondary">
              {t("common.githubCta")}
            </ButtonLink>
          </div>
        </Card>

        <Card
          aria-labelledby="landing-problem-title"
          className="max-w-[42rem] p-7"
        >
          <CardTitle
            className="mb-4 text-[clamp(1.25rem,3vw,1.75rem)]"
            id="landing-problem-title"
          >
            {LANDING_PROBLEM_TITLE}
          </CardTitle>
          <ul className="m-0 list-disc pl-5 text-muted-foreground">
            {LANDING_PROBLEM_POINTS.map((point) => (
              <li className="mt-3 first:mt-0" key={point}>
                {point}
              </li>
            ))}
          </ul>
        </Card>

        <Card
          aria-labelledby="landing-solution-title"
          className="max-w-[42rem] p-7"
        >
          <CardTitle
            className="mb-4 text-[clamp(1.25rem,3vw,1.75rem)]"
            id="landing-solution-title"
          >
            {LANDING_SOLUTION_TITLE}
          </CardTitle>
          <ul className="m-0 list-disc pl-5 text-muted-foreground">
            {LANDING_SOLUTION_POINTS.map((point) => (
              <li className="mt-3 first:mt-0" key={point}>
                {point}
              </li>
            ))}
          </ul>
        </Card>

        <Card
          aria-labelledby="landing-example-workflows-title"
          className="max-w-[42rem] p-7"
        >
          <CardTitle
            className="mb-4 text-[clamp(1.25rem,3vw,1.75rem)]"
            id="landing-example-workflows-title"
          >
            {LANDING_EXAMPLE_WORKFLOWS_TITLE}
          </CardTitle>
          <ul className="m-0 grid list-none gap-4 p-0">
            {LANDING_EXAMPLE_WORKFLOWS.map((workflow) => (
              <Card
                as="li"
                key={workflow.title}
                className="bg-muted px-4 py-4 shadow-none"
              >
                <h3 className="m-0 text-base font-semibold leading-snug text-card-foreground">
                  {workflow.title}
                </h3>
                <p className="mb-0 mt-1 text-muted-foreground">
                  {workflow.description}
                </p>
              </Card>
            ))}
          </ul>
        </Card>

        <Card
          aria-labelledby="landing-how-it-works-title"
          className="max-w-[42rem] p-7"
        >
          <CardTitle
            className="mb-4 text-[clamp(1.25rem,3vw,1.75rem)]"
            id="landing-how-it-works-title"
          >
            {LANDING_HOW_IT_WORKS_TITLE}
          </CardTitle>
          <ol className="m-0 grid gap-4 pl-5">
            {LANDING_HOW_IT_WORKS_STEPS.map((step) => (
              <li key={step.title}>
                <h3 className="m-0 text-base font-semibold leading-snug text-card-foreground">
                  {step.title}
                </h3>
                <p className="mb-0 mt-1 text-muted-foreground">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </Card>

        <Card aria-labelledby="landing-why-title" className="max-w-[42rem] p-7">
          <CardTitle
            className="mb-4 text-[clamp(1.25rem,3vw,1.75rem)]"
            id="landing-why-title"
          >
            {LANDING_WHY_TITLE}
          </CardTitle>
          <ul className="m-0 grid list-none gap-4 p-0">
            {LANDING_WHY_POINTS.map((point) => (
              <Card
                as="li"
                key={point.title}
                className="bg-muted px-4 py-4 shadow-none"
              >
                <h3 className="m-0 text-base font-semibold leading-snug text-card-foreground">
                  {point.title}
                </h3>
                <p className="mb-0 mt-1 text-muted-foreground">
                  {point.description}
                </p>
              </Card>
            ))}
          </ul>
        </Card>

        <Card
          aria-describedby="landing-final-cta-summary"
          aria-labelledby="landing-final-cta-title"
          className="max-w-[42rem] p-7"
        >
          <CardTitle
            className="mb-4 text-[clamp(1.25rem,3vw,1.75rem)]"
            id="landing-final-cta-title"
          >
            {LANDING_FINAL_CTA_TITLE}
          </CardTitle>
          <CardDescription
            className="mb-0 text-[clamp(1rem,2.5vw,1.125rem)] text-muted-foreground"
            id="landing-final-cta-summary"
          >
            {LANDING_FINAL_CTA_SUMMARY}
          </CardDescription>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <ButtonLink href={DOCS_ENTRY_ROUTE}>
              {t("common.getStarted")}
            </ButtonLink>
            <ButtonLink external href={GITHUB_REPO_URL} variant="secondary">
              {t("common.githubCta")}
            </ButtonLink>
          </div>
        </Card>
      </div>
    </SharedShell>
  );
}
