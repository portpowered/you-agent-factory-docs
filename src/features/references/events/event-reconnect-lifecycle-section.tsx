/**
 * Composed reconnect / identity / lifecycle / JSON-probe documentation section.
 */

import type { EventReconnectLifecycleCorpus } from "@/lib/references/events";
import { cn } from "@/lib/utils";
import { EventIdentityHandshake } from "./event-identity-handshake";
import { EventJsonReconnectProbe } from "./event-json-reconnect-probe";
import { EventReconnectContract } from "./event-reconnect-contract";
import { EventStreamLifecycle } from "./event-stream-lifecycle";

export type EventReconnectLifecycleSectionProps = {
  corpus: EventReconnectLifecycleCorpus;
  className?: string;
  "data-testid"?: string;
};

export function EventReconnectLifecycleSection({
  corpus,
  className,
  "data-testid": testId = "event-reconnect-lifecycle-section",
}: EventReconnectLifecycleSectionProps) {
  return (
    <div
      className={cn("min-w-0 space-y-10", className)}
      data-event-reconnect-lifecycle-section=""
      data-testid={testId}
      id="event-reconnect-lifecycle"
    >
      <header className="min-w-0 space-y-1">
        <h2 className="font-semibold text-foreground text-xl">
          Reconnect, identity, and lifecycle
        </h2>
        <p className="text-muted-foreground text-sm">
          Client-facing recovery contracts for the canonical session event
          stream. Does not open a live Factory connection or re-implement the
          API OpenAPI UI.
        </p>
      </header>

      <EventReconnectContract
        contract={corpus.reconnect}
        sectionId={corpus.anchors.reconnect}
      />
      <EventIdentityHandshake
        handshake={corpus.identity}
        sectionId={corpus.anchors.identity}
      />
      <EventStreamLifecycle
        lifecycle={corpus.lifecycle}
        sectionId={corpus.anchors.lifecycle}
      />
      <EventJsonReconnectProbe
        probe={corpus.jsonReconnectProbe}
        sectionId={corpus.anchors.jsonReconnectProbe}
      />
    </div>
  );
}
