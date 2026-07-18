"use client";

/**
 * Copy-link affordance for a stable API operation anchor.
 *
 * Copies the owning-page deep link (`/docs/references/api#<anchor>` by default)
 * using the same fumadocs `useCopyButton` pattern as schema deep links.
 */

import { useCopyButton } from "fumadocs-ui/utils/use-copy-button";
import { Check, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  API_PRINT_CHROME_ATTR,
  API_PRINT_CHROME_HIDE,
} from "./a11y-verification";
import {
  API_OPERATION_COPY_LINK_ATTR,
  API_OPERATION_COPY_LINK_COPIED_LABEL,
  API_OPERATION_COPY_LINK_LABEL,
  apiOperationCopyLinkValue,
} from "./operation-anchors";

export type ApiOperationCopyLinkProps = {
  /** Stable fragment without `#` (prefer published operationId). */
  anchor: string;
  /**
   * Full path+fragment when known. Copied as-is when present; otherwise
   * built from `pagePath` + `anchor`.
   */
  href?: string;
  /** Owning page path used when `href` is omitted. */
  pagePath?: string;
  className?: string;
  "data-testid"?: string;
};

export function ApiOperationCopyLink({
  anchor,
  href,
  pagePath,
  className,
  "data-testid": testId = "api-operation-copy-link",
}: ApiOperationCopyLinkProps) {
  const copyValue = apiOperationCopyLinkValue({ anchor, href, pagePath });
  const [checked, onClick] = useCopyButton(async () => {
    await navigator.clipboard.writeText(copyValue);
  });

  return (
    <span
      className={cn("inline-flex shrink-0 items-center", className)}
      data-api-operation-copy-value={copyValue}
      data-testid={testId}
      {...{ [API_PRINT_CHROME_ATTR]: API_PRINT_CHROME_HIDE }}
    >
      <button
        aria-label={
          checked
            ? API_OPERATION_COPY_LINK_COPIED_LABEL
            : API_OPERATION_COPY_LINK_LABEL
        }
        className="inline-flex shrink-0 items-center justify-center rounded-md border border-border p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-3.5"
        data-checked={checked || undefined}
        onClick={onClick}
        type="button"
        {...{ [API_OPERATION_COPY_LINK_ATTR]: anchor }}
      >
        {checked ? <Check aria-hidden="true" /> : <Link2 aria-hidden="true" />}
      </button>
      <span aria-live="polite" className="sr-only">
        {checked ? API_OPERATION_COPY_LINK_COPIED_LABEL : ""}
      </span>
    </span>
  );
}
