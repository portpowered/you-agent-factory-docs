/**
 * Production API UI boundary for W08.
 *
 * Non-ready statuses short-circuit to {@link ApiStatus}. Ready status renders
 * children so later stories can compose the OpenAPI projection behind one
 * ownership surface under `src/components/references/api/`.
 */

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ApiStatus } from "./api-status";
import {
  API_UI_STATUS_DEFAULT_MESSAGES,
  API_UI_STATUS_DEFAULT_TITLES,
  type ApiUiStatus,
} from "./types";

export type ApiSurfaceProps = {
  status: ApiUiStatus;
  /** Status heading used when `status` is not `ready`. */
  statusTitle?: string;
  /** Status detail used when `status` is not `ready`. */
  statusMessage?: string;
  className?: string;
  "data-testid"?: string;
  children?: ReactNode;
};

export function ApiSurface({
  status,
  statusTitle,
  statusMessage,
  className,
  "data-testid": testId = "api-surface",
  children,
}: ApiSurfaceProps) {
  if (status !== "ready") {
    return (
      <div className={cn(className)} data-testid={testId}>
        <ApiStatus
          kind={status}
          message={statusMessage ?? API_UI_STATUS_DEFAULT_MESSAGES[status]}
          title={statusTitle ?? API_UI_STATUS_DEFAULT_TITLES[status]}
        />
      </div>
    );
  }

  return (
    <div
      className={cn("min-w-0", className)}
      data-api-status="ready"
      data-testid={testId}
    >
      {children}
    </div>
  );
}
