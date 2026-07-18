/**
 * Identity handshake headers + stream-generation invalidation.
 */

import type { EventIdentityHandshakeModel } from "@/lib/references/events";
import { cn } from "@/lib/utils";

export type EventIdentityHandshakeProps = {
  handshake: EventIdentityHandshakeModel;
  sectionId?: string;
  className?: string;
  "data-testid"?: string;
};

export function EventIdentityHandshake({
  handshake,
  sectionId = "event-identity-handshake",
  className,
  "data-testid": testId = "event-identity-handshake",
}: EventIdentityHandshakeProps) {
  return (
    <section
      aria-labelledby={`${sectionId}-heading`}
      className={cn("min-w-0 space-y-4", className)}
      data-event-identity-handshake=""
      data-event-stream-generation-invalidates="true"
      data-testid={testId}
      id={sectionId}
    >
      <header className="min-w-0 space-y-1">
        <h2
          className="font-semibold text-foreground text-lg"
          id={`${sectionId}-heading`}
        >
          Identity handshake
        </h2>
        <p
          className="text-muted-foreground text-sm"
          data-event-identity-handshake-summary=""
        >
          {handshake.summary}
        </p>
      </header>

      <ul
        aria-label="Factory Session identity handshake response headers"
        className="min-w-0 space-y-3"
        data-event-identity-handshake-headers=""
      >
        {handshake.headers.map((header) => (
          <li
            className="min-w-0 rounded-md border border-border/60 bg-muted/20 px-3 py-2"
            data-event-identity-handshake-header={header.name}
            key={header.name}
          >
            <code className="font-mono text-foreground text-sm">
              {header.name}
            </code>
            {header.description.length > 0 ? (
              <p className="mt-1 text-muted-foreground text-sm">
                {header.description}
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      <p
        className="text-foreground text-sm"
        data-event-stream-generation-invalidation=""
      >
        A changed{" "}
        <code className="font-mono text-xs">
          X-Factory-Session-Stream-Generation-Id
        </code>{" "}
        means the current stream generation invalidates prior cursors even when
        the factory session id is unchanged.
      </p>
    </section>
  );
}
