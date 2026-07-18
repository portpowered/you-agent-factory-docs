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
import type { ReferencesFamilyFreshnessSummary } from "./load-references-family-freshness";

type ReferencesFamilyFreshnessSummaryProps = {
  freshness: ReferencesFamilyFreshnessSummary;
  messages: PageMessages;
};

export function ReferencesFamilyFreshnessSummaryView({
  freshness,
  messages,
}: ReferencesFamilyFreshnessSummaryProps) {
  const section = messages.sections?.freshness;
  const unavailable = messages.callouts?.freshnessUnavailable;
  const headingId = "references-family-freshness-heading";
  const title = section?.title ?? "Package freshness";
  const unavailableTitle =
    unavailable?.title ?? "Package freshness unavailable";
  const unavailableDescription =
    unavailable?.body ??
    "The published API package manifest could not be read for this build. Contract surfaces below still use their planned routes.";

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
      {section?.body && freshness.status === "ready" ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {section.body}
        </p>
      ) : null}
      {freshness.status === "ready" ? (
        <aside
          aria-label={`Package freshness: ${freshness.packageId} ${freshness.packageVersion}, source commit ${freshness.sourceCommit}`}
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
                Package
              </dt>
              <dd className="m-0 break-all font-mono text-xs">
                {freshness.packageId}
              </dd>
            </div>
            <div className="contents">
              <dt className="m-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Package version
              </dt>
              <dd className="m-0 font-mono text-xs">
                {freshness.packageVersion}
              </dd>
            </div>
            <div className="contents">
              <dt className="m-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Source commit
              </dt>
              <dd className="m-0 break-all font-mono text-xs">
                {freshness.sourceCommit}
              </dd>
            </div>
            <div className="contents">
              <dt className="m-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Source artifact
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
            description={unavailableDescription}
            detail={freshness.reason}
            title={unavailableTitle}
          />
        </div>
      )}
    </section>
  );
}
