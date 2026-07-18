/**
 * JSON reconnect-probe alternative on the canonical session events endpoint.
 *
 * Documents Accept: application/json → FactorySessionEventStreamRecovery
 * outcomes. Does not re-implement W08 dual-Accept OpenAPI UI — HTTP transport
 * ownership is summarized with a link toward the API operation page.
 */

import { ContractDescriptionProse } from "@/lib/i18n/contract-description-prose";
import type { EventJsonReconnectProbeModel } from "@/lib/references/events";
import { cn } from "@/lib/utils";

export type EventJsonReconnectProbeProps = {
  probe: EventJsonReconnectProbeModel;
  sectionId?: string;
  className?: string;
  "data-testid"?: string;
};

export function EventJsonReconnectProbe({
  probe,
  sectionId = "event-json-reconnect-probe",
  className,
  "data-testid": testId = "event-json-reconnect-probe",
}: EventJsonReconnectProbeProps) {
  return (
    <section
      aria-labelledby={`${sectionId}-heading`}
      className={cn("min-w-0 space-y-4", className)}
      data-event-http-transport-ownership={probe.httpTransportOwnership}
      data-event-json-reconnect-probe=""
      data-event-json-reconnect-recovery-schema={probe.recoverySchemaName}
      data-testid={testId}
      id={sectionId}
    >
      <header className="min-w-0 space-y-1">
        <h2
          className="font-semibold text-foreground text-lg"
          id={`${sectionId}-heading`}
        >
          JSON reconnect probe
        </h2>
        <p className="text-muted-foreground text-sm">
          Same route as the canonical SSE open (
          <code className="font-mono text-foreground text-xs">
            {probe.streamPath}
          </code>
          ). Request{" "}
          <code className="font-mono text-foreground text-xs">
            Accept: {probe.acceptMediaType}
          </code>{" "}
          to receive{" "}
          <code className="font-mono text-foreground text-xs">
            {probe.recoverySchemaName}
          </code>{" "}
          instead of{" "}
          <code className="font-mono text-foreground text-xs">
            {probe.sseMediaType}
          </code>
          .
        </p>
      </header>

      <p
        className="text-foreground text-sm"
        data-event-json-reconnect-probe-summary=""
      >
        {probe.summary}
      </p>

      <div className="min-w-0 space-y-2">
        <h3 className="font-medium text-foreground text-sm">
          Recovery outcomes
        </h3>
        <ul
          aria-label="FactorySessionEventStreamRecovery outcomes"
          className="flex min-w-0 flex-wrap gap-2"
          data-event-json-reconnect-outcomes=""
        >
          {probe.outcomes.map((outcome) => (
            <li key={outcome}>
              <code
                className="inline-block rounded-md border border-border/60 bg-muted/40 px-2 py-1 font-mono text-xs"
                data-event-json-reconnect-outcome={outcome}
              >
                {outcome}
              </code>
            </li>
          ))}
        </ul>
      </div>

      {probe.retryFields.length > 0 ? (
        <div className="min-w-0 space-y-2">
          <h3 className="font-medium text-foreground text-sm">
            Retry guidance fields
          </h3>
          <ul
            aria-label="FactorySessionEventStreamRecoveryRetry fields"
            className="min-w-0 space-y-2"
            data-event-json-reconnect-retry-fields=""
          >
            {probe.retryFields.map((field) => (
              <li
                className="min-w-0 text-sm"
                data-event-json-reconnect-retry-field={field.name}
                key={field.name}
              >
                <code className="font-mono text-foreground text-xs">
                  {field.name}
                </code>
                {field.description.length > 0 ? (
                  <ContractDescriptionProse
                    as="span"
                    className="text-muted-foreground"
                  >
                    {" "}
                    — {field.description}
                  </ContractDescriptionProse>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p
        className="text-muted-foreground text-sm"
        data-event-json-reconnect-api-transport-note=""
      >
        Dual-Accept / HTTP transport ownership (handshake response wiring,
        status codes, and the full OpenAPI operation UI) remains on the API
        operation page.{" "}
        <a
          className="text-primary underline-offset-4 hover:underline"
          href={probe.apiTransportSummaryHref}
        >
          See API transport summary
        </a>
        .
      </p>
    </section>
  );
}
