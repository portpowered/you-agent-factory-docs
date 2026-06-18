"use client";

import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { getContentWidthClassName } from "@/components/ui/factory-theme";
import { Alert, Banner } from "@/components/ui/notice";
import { Selector } from "@/components/ui/selector";
import {
  LANDING_DIALOG_CLOSE_ACTION_LABEL,
  LANDING_DIALOG_DISMISS_LABEL,
  LANDING_DIALOG_LOADING_ACTION_LABEL,
  LANDING_DIALOG_OPEN_LABEL,
  LANDING_DIALOG_SELECTOR_LABEL,
  LANDING_DIALOG_STATES,
  LANDING_DIALOG_STATE_OPTIONS,
  LANDING_DIALOG_SURFACE_TITLE,
  LANDING_DIALOG_TITLE,
} from "@/lib/landing-content";
import { DOCS_ENTRY_ROUTE } from "@/lib/project";
import { GITHUB_REPO_URL } from "@/lib/shared-shell-config";
import { useMessages } from "@/localization/hooks/use-messages";
import { useState } from "react";

type WorkflowMode = "guided" | "review" | "scheduled";
type DialogPreviewState = "loading" | "success" | "empty" | "error";

export function PrimitivesShowcase() {
  const { t } = useMessages();
  const [workflowMode, setWorkflowMode] = useState<WorkflowMode>("guided");
  const [readyForReview, setReadyForReview] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogState, setDialogState] = useState<DialogPreviewState>("loading");

  const workflowMessageKey = `landing.primitives.mode.${workflowMode}` as const;
  const dialogContent = LANDING_DIALOG_STATES[dialogState];

  const renderDialogBody = () => {
    switch (dialogState) {
      case "loading":
        return (
          <Banner title={dialogContent.title} tone="info">
            <p>{dialogContent.body}</p>
          </Banner>
        );
      case "success":
        return (
          <Banner title={dialogContent.title} tone="success">
            <p>{dialogContent.body}</p>
          </Banner>
        );
      case "empty":
        return (
          <Banner title={dialogContent.title} tone="info">
            <p>{dialogContent.body}</p>
          </Banner>
        );
      case "error":
        return (
          <Alert title={dialogContent.title} tone="danger">
            <p>{dialogContent.body}</p>
          </Alert>
        );
      default:
        return null;
    }
  };

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

      <div className="mt-6 grid gap-4 border-t border-[var(--ui-color-border-subtle)] pt-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <h3 className="m-0 text-base font-semibold leading-snug text-card-foreground">
              {LANDING_DIALOG_TITLE}
            </h3>
          </div>

          <Selector
            label={LANDING_DIALOG_SELECTOR_LABEL}
            name="dialog-preview-state"
            onValueChange={(value) =>
              setDialogState(value as DialogPreviewState)
            }
            options={LANDING_DIALOG_STATE_OPTIONS}
            value={dialogState}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button onClick={() => setDialogOpen(true)}>
              {LANDING_DIALOG_OPEN_LABEL}
            </Button>
          </div>
        </div>
      </div>

      <Dialog
        closeLabel={LANDING_DIALOG_DISMISS_LABEL}
        footer={
          <Button
            disabled={dialogState === "loading"}
            onClick={() => setDialogOpen(false)}
          >
            {dialogState === "loading"
              ? LANDING_DIALOG_LOADING_ACTION_LABEL
              : LANDING_DIALOG_CLOSE_ACTION_LABEL}
          </Button>
        }
        onOpenChange={setDialogOpen}
        open={dialogOpen}
        title={LANDING_DIALOG_SURFACE_TITLE}
      >
        {renderDialogBody()}
      </Dialog>
    </Card>
  );
}
