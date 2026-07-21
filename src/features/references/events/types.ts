/**
 * Typed props and status vocabulary for the W09 production events UI surface.
 *
 * Components accept ready catalog models from later stories. Raw package JSON
 * and filesystem reads stay outside this boundary — callers resolve/normalize
 * first, then pass success status here.
 */

/**
 * Non-success outcomes the events UI must render explicitly.
 * - `loading`: corpus resolution / normalization in flight
 * - `empty`: no stream operations or catalog entries to show
 * - `error`: resolution/validation failed for the supplied input
 */
export const EVENTS_UI_STATUS_KINDS = ["loading", "empty", "error"] as const;

export type EventsUiStatusKind = (typeof EVENTS_UI_STATUS_KINDS)[number];

/** Full surface status including the success path for later composition stories. */
export type EventsUiStatus = EventsUiStatusKind | "success";

export type EventsStatusProps = {
  kind: EventsUiStatusKind;
  /** Short heading shown above the detail message when provided. */
  title?: string;
  /** Human-readable status detail. Required so messaging is never blank. */
  message: string;
  className?: string;
  "data-testid"?: string;
};

/** Default copy for each non-success status when callers omit a custom message. */
export const EVENTS_UI_STATUS_DEFAULT_MESSAGES: Record<
  EventsUiStatusKind,
  string
> = {
  loading: "Loading event corpus…",
  empty: "No event-stream operations or catalog entries are available.",
  error: "Event corpus resolution failed validation or normalization.",
};

export const EVENTS_UI_STATUS_DEFAULT_TITLES: Record<
  EventsUiStatusKind,
  string
> = {
  loading: "Loading",
  empty: "Empty event corpus",
  error: "Event corpus error",
};
