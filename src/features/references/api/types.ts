/**
 * Typed status vocabulary for the W08 production API reference surface.
 *
 * Later stories compose Fumadocs OpenAPI primitives behind this ownership
 * boundary. Non-ready outcomes stay explicit and accessible.
 */

/**
 * Non-ready outcomes the API UI must render explicitly.
 * - `loading`: OpenAPI acquisition / projection is pending
 * - `empty`: no published operations to show
 * - `invalid`: resolution or projection failed for the supplied input
 * - `unsupported`: document shape/version this renderer cannot display
 */
export const API_UI_STATUS_KINDS = [
  "loading",
  "empty",
  "invalid",
  "unsupported",
] as const;

export type ApiUiStatusKind = (typeof API_UI_STATUS_KINDS)[number];

/** Full surface status including the ready path for later composition stories. */
export type ApiUiStatus = ApiUiStatusKind | "ready";

export const API_UI_STATUS_DEFAULT_TITLES: Record<ApiUiStatusKind, string> = {
  loading: "Loading API reference",
  empty: "No API operations",
  invalid: "Invalid API reference",
  unsupported: "Unsupported API reference",
};

export const API_UI_STATUS_DEFAULT_MESSAGES: Record<ApiUiStatusKind, string> = {
  loading: "The OpenAPI artifact is still loading.",
  empty: "No published HTTP operations are available to display.",
  invalid: "The OpenAPI artifact could not be resolved or projected.",
  unsupported:
    "This OpenAPI document shape is not supported by the production API renderer.",
};

export type ApiStatusProps = {
  kind: ApiUiStatusKind;
  title?: string;
  message?: string;
};
