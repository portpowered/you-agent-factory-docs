/**
 * Summary card for one SSE stream operation with canonicality role,
 * payload root, and optional catalog deep link.
 *
 * Does not re-implement W08 full API OpenAPI UI — path/method/role/payload
 * identity only, with links into events catalog anchors.
 */

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { EventCanonicalityBadge } from "./event-canonicality-badge";
import type { EventStreamOperationSummaryModel } from "./event-stream-display";

export type EventStreamOperationSummaryProps = {
  summary: EventStreamOperationSummaryModel;
  className?: string;
  "data-testid"?: string;
  /** Optional trailing actions (for example copy-anchor chrome from later stories). */
  actions?: ReactNode;
};

export function EventStreamOperationSummary({
  summary,
  className,
  "data-testid": testId = "event-stream-operation-summary",
  actions,
}: EventStreamOperationSummaryProps) {
  const catalogHref =
    summary.catalogAnchor !== undefined
      ? `#${summary.catalogAnchor.replace(/^#/, "")}`
      : undefined;
  const schemaHref =
    summary.schemaPointerAnchor !== undefined
      ? `#${summary.schemaPointerAnchor.replace(/^#/, "")}`
      : undefined;

  return (
    <article
      aria-labelledby={`${testId}-${summary.operationId}-heading`}
      className={cn(
        "flex min-w-0 flex-col gap-3 rounded-md border border-border p-4",
        summary.canonicality.isCompatibilityOnly
          ? "border-dashed bg-background"
          : "bg-muted/20",
        className,
      )}
      data-event-operation-id={summary.operationId}
      data-event-payload-root={summary.payloadRoot}
      data-event-preferred-session-stream={
        summary.canonicality.isPreferredSessionStream ? "true" : "false"
      }
      data-event-stream-path={summary.path}
      data-event-stream-role={summary.role}
      data-testid={testId}
      id={`event-stream-operation-${summary.operationId}`}
    >
      <header className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h3
            className="text-base font-medium text-foreground"
            id={`${testId}-${summary.operationId}-heading`}
          >
            {summary.roleLabel}
          </h3>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium uppercase tracking-wide">
              {summary.method}
            </span>{" "}
            <code className="break-all font-mono text-foreground">
              {summary.path}
            </code>
          </p>
        </div>
        <EventCanonicalityBadge
          presentation={summary.canonicality}
          streamRole={summary.role}
        />
      </header>

      <dl className="m-0 grid gap-2 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-3">
        <dt className="m-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Payload root
        </dt>
        <dd className="m-0 min-w-0">
          {catalogHref !== undefined ? (
            <a
              className="font-mono text-foreground underline-offset-2 hover:underline"
              data-event-catalog-link=""
              href={catalogHref}
            >
              {summary.payloadRoot}
            </a>
          ) : (
            <code
              className="font-mono text-foreground"
              data-event-payload-root-label=""
            >
              {summary.payloadRoot}
            </code>
          )}
        </dd>
        <dt className="m-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Operation
        </dt>
        <dd className="m-0 min-w-0 break-all font-mono text-xs text-foreground">
          {summary.operationId}
        </dd>
        {schemaHref !== undefined ? (
          <>
            <dt className="m-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Schema anchor
            </dt>
            <dd className="m-0 min-w-0">
              <a
                className="break-all font-mono text-xs text-muted-foreground underline-offset-2 hover:underline"
                data-event-schema-anchor-link=""
                href={schemaHref}
              >
                {schemaHref}
              </a>
            </dd>
          </>
        ) : null}
      </dl>

      {summary.role === "ephemeral" ? (
        <p
          className="text-sm text-muted-foreground"
          data-event-ephemeral-notice=""
        >
          Ephemeral observation only — do not treat response events as canonical
          FactoryEvent replay state.
        </p>
      ) : null}

      {summary.canonicality.isCompatibilityOnly ? (
        <p
          className="text-sm text-muted-foreground"
          data-event-compatibility-notice=""
        >
          Compatibility-only / non-canonical. Prefer the canonical session
          FactoryEvent stream for new consumers.
        </p>
      ) : null}

      {actions !== undefined ? (
        <div className="flex flex-wrap gap-2">{actions}</div>
      ) : null}
    </article>
  );
}
