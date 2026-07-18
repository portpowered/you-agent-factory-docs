/**
 * Reconnect cursor parameters + precedence for the canonical session stream.
 */

import { ContractDescriptionProse } from "@/lib/i18n/contract-description-prose";
import type { EventReconnectContractModel } from "@/lib/references/events";
import { cn } from "@/lib/utils";

export type EventReconnectContractProps = {
  contract: EventReconnectContractModel;
  sectionId?: string;
  className?: string;
  "data-testid"?: string;
};

export function EventReconnectContract({
  contract,
  sectionId = "event-reconnect-contract",
  className,
  "data-testid": testId = "event-reconnect-contract",
}: EventReconnectContractProps) {
  return (
    <section
      aria-labelledby={`${sectionId}-heading`}
      className={cn("min-w-0 space-y-4", className)}
      data-event-reconnect-contract=""
      data-event-reconnect-path={contract.streamPath}
      data-event-reconnect-precedence={contract.precedenceRule}
      data-testid={testId}
      id={sectionId}
    >
      <header className="min-w-0 space-y-1">
        <h2
          className="font-semibold text-foreground text-lg"
          id={`${sectionId}-heading`}
        >
          Reconnect cursors
        </h2>
        <p className="text-muted-foreground text-sm">
          Canonical session stream{" "}
          <code className="font-mono text-foreground text-xs">
            {contract.streamPath}
          </code>{" "}
          (
          <code className="font-mono text-foreground text-xs">
            {contract.operationId}
          </code>
          ).
        </p>
      </header>

      <ContractDescriptionProse
        className="text-foreground text-sm"
        data-event-reconnect-precedence-summary=""
      >
        {contract.precedenceSummary}
      </ContractDescriptionProse>
      <ContractDescriptionProse
        className="text-muted-foreground text-sm"
        data-event-reconnect-sequence-fallback=""
      >
        {contract.sessionSequenceFallbackSummary}
      </ContractDescriptionProse>

      <ul
        aria-label="Reconnect cursor query parameters"
        className="min-w-0 space-y-3"
        data-event-reconnect-cursor-params=""
      >
        {contract.cursorParameters.map((parameter) => (
          <li
            className="min-w-0 rounded-md border border-border/60 bg-muted/20 px-3 py-2"
            data-event-reconnect-cursor-param={parameter.name}
            key={parameter.name}
          >
            <div className="flex min-w-0 flex-wrap items-baseline gap-2">
              <code className="font-mono text-foreground text-sm">
                {parameter.name}
              </code>
              <span className="text-muted-foreground text-xs">
                {parameter.in}
                {parameter.schemaType !== undefined
                  ? ` · ${parameter.schemaType}`
                  : ""}
                {parameter.required ? " · required" : " · optional"}
              </span>
            </div>
            {parameter.description.length > 0 ? (
              <ContractDescriptionProse className="mt-1 text-muted-foreground text-sm">
                {parameter.description}
              </ContractDescriptionProse>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
