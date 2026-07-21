/**
 * Shared events UI boundary for W09.
 *
 * Non-success statuses short-circuit to {@link EventsStatus}. Success status
 * renders children and records locked hybrid placement ownership markers so
 * later stories share one production surface (not the W02 spike tree).
 */

import type { ReactNode } from "react";
import {
  HYBRID_EVENT_STREAM_OWNERSHIP,
  LOCKED_EVENT_STREAM_PLACEMENT,
} from "@/lib/references/events";
import { cn } from "@/lib/utils";
import { EventsStatus } from "./events-status";
import {
  EVENTS_UI_STATUS_DEFAULT_MESSAGES,
  EVENTS_UI_STATUS_DEFAULT_TITLES,
  type EventsUiStatus,
} from "./types";

export type EventsSurfaceProps = {
  status: EventsUiStatus;
  /** Status heading used when `status` is not `success`. */
  statusTitle?: string;
  /** Status detail used when `status` is not `success`. */
  statusMessage?: string;
  className?: string;
  "data-testid"?: string;
  children?: ReactNode;
};

export function EventsSurface({
  status,
  statusTitle,
  statusMessage,
  className,
  "data-testid": testId = "events-surface",
  children,
}: EventsSurfaceProps) {
  if (status !== "success") {
    return (
      <div className={cn(className)} data-testid={testId}>
        <EventsStatus
          kind={status}
          message={statusMessage ?? EVENTS_UI_STATUS_DEFAULT_MESSAGES[status]}
          title={statusTitle ?? EVENTS_UI_STATUS_DEFAULT_TITLES[status]}
        />
      </div>
    );
  }

  return (
    <div
      className={cn("min-w-0", className)}
      data-events-asyncapi-permanent-pin="false"
      data-events-ownership="w09-production"
      data-events-placement={LOCKED_EVENT_STREAM_PLACEMENT}
      data-events-status="success"
      data-events-truth-owner={HYBRID_EVENT_STREAM_OWNERSHIP.eventTruthOwner}
      data-testid={testId}
    >
      {children}
    </div>
  );
}
