"use client";

import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { getContentWidthClassName } from "@/components/ui/factory-theme";
import { Alert, Banner } from "@/components/ui/notice";
import { Selector } from "@/components/ui/selector";
import { DOCS_ENTRY_ROUTE } from "@/lib/project";
import { GITHUB_REPO_URL } from "@/lib/shared-shell-config";
import { useMessages } from "@/localization/hooks/use-messages";
import { useState } from "react";

type WorkflowMode = "guided" | "review" | "scheduled";

export function PrimitivesShowcase() {
  const { t } = useMessages();
  const [workflowMode, setWorkflowMode] = useState<WorkflowMode>("guided");
  const [readyForReview, setReadyForReview] = useState(false);

  const workflowMessageKey = `landing.primitives.mode.${workflowMode}` as const;

  return (
    <Card
      aria-labelledby="landing-primitives-title"
      className={getContentWidthClassName("prose", "landing-shell__section")}
      padding="spacious"
    >
      <CardTitle
        className="mb-4 text-[clamp(1.25rem,3vw,1.75rem)]"
        id="landing-primitives-title"
      >
        {t("landing.primitives.title")}
      </CardTitle>
      <CardDescription className="mb-0">
        {t("landing.primitives.summary")}
      </CardDescription>

      <div className="landing-shell__primitives-grid mt-6">
        <div className="landing-shell__primitives-column">
          <Selector
            description={t("landing.primitives.selectorDescription")}
            label={t("landing.primitives.selectorLabel")}
            name="workflow-mode"
            onValueChange={setWorkflowMode}
            options={[
              {
                label: t("landing.primitives.selectorGuidedLabel"),
                value: "guided",
              },
              {
                label: t("landing.primitives.selectorReviewLabel"),
                value: "review",
              },
              {
                disabled: true,
                label: t("landing.primitives.selectorScheduledLabel"),
                value: "scheduled",
              },
            ]}
            value={workflowMode}
          />

          <Checkbox
            checked={readyForReview}
            description={t("landing.primitives.checkboxDescription")}
            errorMessage={
              readyForReview ? undefined : t("landing.primitives.checkboxError")
            }
            label={t("landing.primitives.checkboxLabel")}
            name="review-readiness"
            onCheckedChange={setReadyForReview}
          />

          <div className="landing-shell__primitives-actions">
            <ButtonLink href={DOCS_ENTRY_ROUTE}>
              {t("common.getStarted")}
            </ButtonLink>
            <ButtonLink external href={GITHUB_REPO_URL} variant="secondary">
              {t("common.githubCta")}
            </ButtonLink>
            <Button disabled variant="secondary">
              {t("landing.primitives.pendingLabel")}
            </Button>
          </div>
        </div>

        <div className="landing-shell__primitives-column">
          <Banner title={t("landing.primitives.bannerTitle")} tone="info">
            <p>{t(workflowMessageKey)}</p>
          </Banner>

          {readyForReview ? (
            <Banner title={t("landing.primitives.successTitle")} tone="success">
              <p>{t("landing.primitives.successBody")}</p>
            </Banner>
          ) : (
            <Alert title={t("landing.primitives.alertTitle")} tone="warning">
              <p>{t("landing.primitives.alertBody")}</p>
            </Alert>
          )}
        </div>
      </div>
    </Card>
  );
}
