/**
 * Request/response media-type label for harness / custom-section fixtures.
 *
 * Not part of the published Fumadocs `ApiReferenceAPIPage` path — deep-import
 * only (not re-exported from `@/features/references/api`).
 *
 * Distinguishes JSON, text/event-stream (SSE), and other media types with
 * explicit text labels — never color-only meaning.
 */

import { cn } from "@/lib/utils";
import {
  API_MEDIA_TYPE_ATTR,
  type ApiMediaTypeKind,
  apiMediaTypeKindLabel,
  classifyApiMediaType,
} from "./operation-detail";

export type ApiResponseMediaTypeProps = {
  mediaType: string;
  /** Optional precomputed kind; derived from `mediaType` when omitted. */
  kind?: ApiMediaTypeKind;
  /** Visual role for request vs response chrome (does not change meaning). */
  side?: "request" | "response";
  className?: string;
  "data-testid"?: string;
};

export function ApiResponseMediaType({
  mediaType,
  kind: kindProp,
  side = "response",
  className,
  "data-testid": testId = "api-response-media-type",
}: ApiResponseMediaTypeProps) {
  const kind = kindProp ?? classifyApiMediaType(mediaType);
  const kindLabel = apiMediaTypeKindLabel(kind);

  return (
    <span
      className={cn(
        "inline-flex min-w-0 flex-wrap items-center gap-1.5 text-sm text-foreground",
        className,
      )}
      data-api-media-kind={kind}
      data-api-media-side={side}
      data-testid={testId}
      {...{ [API_MEDIA_TYPE_ATTR]: mediaType }}
    >
      <code className="rounded-md border border-border bg-muted/50 px-1.5 py-0.5 font-mono text-xs text-foreground">
        {mediaType}
      </code>
      <span
        className="rounded-md border border-border px-1.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground"
        data-api-media-kind-label=""
      >
        {kindLabel}
      </span>
    </span>
  );
}
