/**
 * Accessible package/version freshness summary for the references family index.
 *
 * Mirrors ContractSourceBadge’s readable definition-list chrome without forcing
 * a single-item family projection onto the family landing. Success shows
 * package identity, version, and source commit from the public API manifest.
 * Failures use shared ReferenceErrorState so the rest of the index still renders.
 */

import { ReferenceErrorState } from "@/components/references/shared";
import type { PageMessages } from "@/lib/content/schemas";
import type { ReferenceChromeMessages } from "@/lib/content/ui-messages.types";
import type { ReferencesFamilyFreshnessSummary } from "./load-references-family-freshness";

type ReferencesFamilyFreshnessSummaryProps = {
  freshness: ReferencesFamilyFreshnessSummary;
  messages: PageMessages;
  chrome: ReferenceChromeMessages;
};

export function ReferencesFamilyFreshnessSummaryView({
  freshness,
  messages,
  chrome,
}: ReferencesFamilyFreshnessSummaryProps) {
  const section = messages.sections?.freshness;
  const unavailable = messages.callouts?.freshnessUnavailable;

  if (!section?.title) {
    throw new Error(
      "References family index messages must define sections.freshness.title for collection chrome.",
    );
  }
  if (!unavailable?.title || !unavailable.body) {
    throw new Error(
      "References family index messages must define callouts.freshnessUnavailable with title and body.",
    );
  }

  const headingId = "references-family-freshness-heading";
  const title = section.title;
  const unavailableTitle = unavailable.title;
  const unavailableDescription = unavailable.body;
  const badge = chrome.badge;

  return (
    <section
      aria-labelledby={headingId}
      className="mt-8"
      data-freshness-status={freshness.status}
      data-references-family-freshness=""
      id="package-freshness"
    >
      <h2
        className="font-serif text-lg font-semibold text-foreground"
        id={headingId}
      >
        {title}
      </h2>
      {section.body && freshness.status === "ready" ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {section.body}
        </p>
      ) : null}
      {freshness.status === "ready" ? (
        <aside
          aria-label={`${title}: ${freshness.packageId} ${freshness.packageVersion}, ${badge.sourceCommit} ${freshness.sourceCommit}`}
          className="mt-4 flex flex-col gap-2 rounded-md border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground"
          data-package-id={freshness.packageId}
          data-package-version={freshness.packageVersion}
          data-references-family-freshness-summary=""
          data-source-artifact={freshness.publicArtifactId}
          data-source-commit={freshness.sourceCommit}
        >
          <dl className="m-0 grid gap-1.5 sm:grid-cols-[auto_1fr] sm:gap-x-3">
            <div className="contents">
              <dt className="m-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {badge.package}
              </dt>
              <dd className="m-0 break-all font-mono text-xs">
                {freshness.packageId}
              </dd>
            </div>
            <div className="contents">
              <dt className="m-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {badge.packageVersion}
              </dt>
              <dd className="m-0 font-mono text-xs">
                {freshness.packageVersion}
              </dd>
            </div>
            <div className="contents">
              <dt className="m-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {badge.sourceCommit}
              </dt>
              <dd className="m-0 break-all font-mono text-xs">
                {freshness.sourceCommit}
              </dd>
            </div>
            <div className="contents">
              <dt className="m-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {badge.sourceArtifact}
              </dt>
              <dd className="m-0 break-all font-mono text-xs">
                {freshness.publicArtifactId}
              </dd>
            </div>
          </dl>
        </aside>
      ) : (
        <div className="mt-4">
          <ReferenceErrorState
            chrome={chrome}
            description={unavailableDescription}
            detail={freshness.reason}
            title={unavailableTitle}
          />
        </div>
      )}
    </section>
  );
}
