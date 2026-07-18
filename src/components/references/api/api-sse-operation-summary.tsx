/**
 * Hybrid SSE operation summary for the production API surface.
 *
 * Documents HTTP transport semantics owned by the API page and links toward
 * `/docs/references/events` for the full envelope/payload catalog (W09).
 * Static-only — never opens a live event-stream connection.
 */

import { cn } from "@/lib/utils";
import type { ApiSseOperationSummary } from "./sse-operation-summary";
import {
  API_SSE_ROLE_ATTR,
  API_SSE_SUMMARY_ATTR,
  API_SSE_SUMMARY_SAFETY,
} from "./sse-operations";

export type ApiSseOperationSummaryProps = {
  summary: ApiSseOperationSummary;
  className?: string;
  "data-testid"?: string;
};

function roleBadgeLabel(summary: ApiSseOperationSummary): string {
  switch (summary.role) {
    case "canonical":
      return "Canonical";
    case "ephemeral":
      return "Ephemeral";
    case "compatibility-only":
      return "Compatibility-only";
  }
}

export function ApiSseOperationSummaryPanel({
  summary,
  className,
  "data-testid": testId = "api-sse-operation-summary",
}: ApiSseOperationSummaryProps) {
  const headingId = `${summary.operationId}-sse-summary-heading`;

  return (
    <aside
      aria-labelledby={headingId}
      className={cn(
        "min-w-0 space-y-4 rounded-lg border border-border bg-muted/20 p-4 text-sm",
        className,
      )}
      data-api-sse-live-connection={String(
        API_SSE_SUMMARY_SAFETY.opensLiveEventStreamConnection,
      )}
      data-api-sse-full-catalog={String(
        API_SSE_SUMMARY_SAFETY.implementsFullEventCatalog,
      )}
      data-api-sse-operation={summary.operationId}
      data-api-sse-preferred={String(summary.preferredOrCanonical)}
      data-testid={testId}
      {...{
        [API_SSE_SUMMARY_ATTR]: summary.operationId,
        [API_SSE_ROLE_ATTR]: summary.role,
      }}
    >
      <header className="min-w-0 space-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground" id={headingId}>
            SSE stream summary
          </h3>
          <span
            className="rounded-md border border-border px-1.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-foreground"
            data-api-sse-role-badge=""
          >
            {roleBadgeLabel(summary)}
          </span>
          {summary.neverPreferredOrCanonical ? (
            <span
              className="rounded-md border border-border px-1.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground"
              data-api-sse-never-preferred=""
            >
              Never preferred
            </span>
          ) : null}
          {summary.preferredOrCanonical ? (
            <span
              className="rounded-md border border-border px-1.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-foreground"
              data-api-sse-canonical-badge=""
            >
              Preferred
            </span>
          ) : null}
        </div>
        <p className="text-muted-foreground" data-api-sse-role-label="">
          {summary.roleLabel}
        </p>
        <p
          className="text-muted-foreground text-xs"
          data-api-sse-static-note=""
        >
          This summary is static documentation. It does not open a live
          event-stream connection from the documentation site.
        </p>
      </header>

      <section
        aria-label="HTTP transport semantics"
        className="min-w-0 space-y-3"
        data-api-sse-http-semantics=""
      >
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          HTTP transport semantics
        </h4>
        <dl className="m-0 space-y-3">
          {summary.semantics.map((entry) => (
            <div
              key={entry.field}
              className="min-w-0 space-y-1"
              data-api-sse-semantics-field={entry.field}
              data-api-sse-semantics-applicable={String(entry.applicable)}
            >
              <dt className="font-medium text-foreground">{entry.label}</dt>
              <dd className="m-0 text-muted-foreground">{entry.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section
        aria-label="Event catalog links"
        className="min-w-0 space-y-2"
        data-api-sse-events-links=""
      >
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Event envelope and payload catalog
        </h4>
        <p className="text-muted-foreground text-xs">
          Full envelope, discriminator, and payload-variant documentation lives
          on the events reference (W09). Use these links for the catalog — this
          API page does not embed the full event corpus.
        </p>
        <ul className="m-0 list-none space-y-2 p-0">
          {summary.eventsCatalogLinks.map((link) => (
            <li key={link.href}>
              <a
                className="font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                data-api-sse-events-link={link.anchor}
                href={link.href}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
