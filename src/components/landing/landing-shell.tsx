"use client";

import { PrimitivesShowcase } from "@/components/landing/primitives-showcase";
import { SharedShell } from "@/components/shell/shared-shell";
import { BentoCard, BentoGrid } from "@/components/ui/bento-card";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  getContentWidthClassName,
  getStackClassName,
} from "@/components/ui/factory-theme";
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
import { useEffect, useState } from "react";

export function LandingShell() {
  const { t } = useMessages();
  const config = createSharedShellConfigFromMessages(t);
  const [showPrimitivesShowcase, setShowPrimitivesShowcase] = useState(false);

  useEffect(() => {
    setShowPrimitivesShowcase(true);
  }, []);

  return (
    <SharedShell config={config} surface="home">
      <div
        className={getStackClassName({
          align: "items-center",
          className: "landing-shell__sections",
        })}
      >
        <Card
          aria-describedby="landing-hero-summary"
          aria-labelledby="landing-hero-title"
          className={getContentWidthClassName("prose", "landing-shell__hero")}
          padding="spacious"
          tone="hero"
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
          <CardDescription
            className="landing-shell__value mb-0 mt-3 text-[clamp(1rem,2.5vw,1.125rem)] text-muted-foreground"
            id="landing-hero-summary"
          >
            {t("landing.valueStatement")}
          </CardDescription>
          <div className="landing-shell__cta-row mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <ButtonLink
              className="landing-shell__button"
              href={DOCS_ENTRY_ROUTE}
            >
              {t("common.getStarted")}
            </ButtonLink>
            <ButtonLink
              className="landing-shell__button landing-shell__button--secondary"
              external
              href={GITHUB_REPO_URL}
              variant="secondary"
            >
              {t("common.githubCta")}
            </ButtonLink>
          </div>
        </Card>

        <Card
          aria-labelledby="landing-problem-title"
          className={getContentWidthClassName(
            "prose",
            "landing-shell__section",
          )}
          padding="spacious"
        >
          <CardTitle
            className="mb-4 text-[clamp(1.25rem,3vw,1.75rem)]"
            id="landing-problem-title"
          >
            {LANDING_PROBLEM_TITLE}
          </CardTitle>
          <ul className="landing-shell__list m-0 list-disc pl-5 text-muted-foreground">
            {LANDING_PROBLEM_POINTS.map((point) => (
              <li className="mt-3 first:mt-0" key={point}>
                {point}
              </li>
            ))}
          </ul>
        </Card>

        <Card
          aria-labelledby="landing-solution-title"
          className={getContentWidthClassName(
            "prose",
            "landing-shell__section",
          )}
          padding="spacious"
        >
          <CardTitle
            className="mb-4 text-[clamp(1.25rem,3vw,1.75rem)]"
            id="landing-solution-title"
          >
            {LANDING_SOLUTION_TITLE}
          </CardTitle>
          <ul className="landing-shell__list m-0 list-disc pl-5 text-muted-foreground">
            {LANDING_SOLUTION_POINTS.map((point) => (
              <li className="mt-3 first:mt-0" key={point}>
                {point}
              </li>
            ))}
          </ul>
        </Card>

        <Card
          aria-labelledby="landing-example-workflows-title"
          className={getContentWidthClassName(
            "prose",
            "landing-shell__section",
          )}
          padding="spacious"
        >
          <CardTitle
            className="mb-4 text-[clamp(1.25rem,3vw,1.75rem)]"
            id="landing-example-workflows-title"
          >
            {LANDING_EXAMPLE_WORKFLOWS_TITLE}
          </CardTitle>
          <BentoGrid
            as="ul"
            className="landing-shell__workflow-list m-0 list-none p-0"
          >
            {LANDING_EXAMPLE_WORKFLOWS.map((workflow) => (
              <BentoCard
                action={"action" in workflow ? workflow.action : undefined}
                as="li"
                description={workflow.description}
                eyebrow={workflow.eyebrow}
                key={workflow.title}
                className="landing-shell__workflow-item"
                meta={workflow.meta}
                span={
                  workflow.title === "PR Review Factory" ? "feature" : "default"
                }
                title={workflow.title}
              />
            ))}
          </BentoGrid>
        </Card>

        <Card
          aria-labelledby="landing-how-it-works-title"
          className={getContentWidthClassName(
            "prose",
            "landing-shell__section",
          )}
          padding="spacious"
        >
          <CardTitle
            className="mb-4 text-[clamp(1.25rem,3vw,1.75rem)]"
            id="landing-how-it-works-title"
          >
            {LANDING_HOW_IT_WORKS_TITLE}
          </CardTitle>
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
        </Card>

        {showPrimitivesShowcase ? (
          <PrimitivesShowcase />
        ) : (
          <Card
            aria-busy="true"
            aria-labelledby="landing-primitives-loading-title"
            className={getContentWidthClassName(
              "prose",
              "landing-shell__section",
            )}
            padding="spacious"
          >
            <CardTitle
              className="mb-4 text-[clamp(1.25rem,3vw,1.75rem)]"
              id="landing-primitives-loading-title"
            >
              {t("landing.primitives.title")}
            </CardTitle>
            <CardDescription className="mb-0">
              {t("landing.primitives.loadingBody")}
            </CardDescription>
          </Card>
        )}

        <Card
          aria-labelledby="landing-why-title"
          className={getContentWidthClassName(
            "prose",
            "landing-shell__section",
          )}
          padding="spacious"
        >
          <CardTitle
            className="mb-4 text-[clamp(1.25rem,3vw,1.75rem)]"
            id="landing-why-title"
          >
            {LANDING_WHY_TITLE}
          </CardTitle>
          <BentoGrid
            as="ul"
            className="landing-shell__why-list m-0 list-none p-0"
          >
            {LANDING_WHY_POINTS.map((point) => (
              <BentoCard
                as="li"
                description={point.description}
                eyebrow={point.eyebrow}
                key={point.title}
                className="landing-shell__why-item"
                meta={point.meta}
                title={point.title}
              />
            ))}
          </BentoGrid>
        </Card>

        <Card
          aria-describedby="landing-final-cta-summary"
          aria-labelledby="landing-final-cta-title"
          className={getContentWidthClassName(
            "prose",
            "landing-shell__section landing-shell__final-cta",
          )}
          padding="spacious"
        >
          <CardTitle
            className="mb-4 text-[clamp(1.25rem,3vw,1.75rem)]"
            id="landing-final-cta-title"
          >
            {LANDING_FINAL_CTA_TITLE}
          </CardTitle>
          <CardDescription
            className="landing-shell__final-cta-summary mb-0 text-[clamp(1rem,2.5vw,1.125rem)] text-muted-foreground"
            id="landing-final-cta-summary"
          >
            {LANDING_FINAL_CTA_SUMMARY}
          </CardDescription>
          <div className="landing-shell__cta-row mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <ButtonLink
              className="landing-shell__button"
              href={DOCS_ENTRY_ROUTE}
            >
              {t("common.getStarted")}
            </ButtonLink>
            <ButtonLink
              className="landing-shell__button landing-shell__button--secondary"
              external
              href={GITHUB_REPO_URL}
              variant="secondary"
            >
              {t("common.githubCta")}
            </ButtonLink>
          </div>
        </Card>
      </div>
    </SharedShell>
  );
}
