/**
 * Shared schema UI boundary for W07.
 *
 * Non-ready statuses short-circuit to {@link SchemaStatus}. Ready status renders
 * children; typed W04 adapters (`display` / `definition`) are accepted on the
 * props contract so later stories share one ownership surface.
 */

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SchemaStatus } from "./schema-status";
import {
  SCHEMA_UI_STATUS_DEFAULT_MESSAGES,
  SCHEMA_UI_STATUS_DEFAULT_TITLES,
  type SchemaDefinitionInput,
  type SchemaDisplayInput,
  type SchemaUiStatus,
} from "./types";

export type SchemaSurfaceProps = {
  status: SchemaUiStatus;
  /** Status heading used when `status` is not `ready`. */
  statusTitle?: string;
  /** Status detail used when `status` is not `ready`. */
  statusMessage?: string;
  className?: string;
  "data-testid"?: string;
  /**
   * Optional W04 display projection for ready-state consumers.
   * Typed on the surface so callers stay on projection shapes, not raw JSON.
   */
  display?: SchemaDisplayInput;
  /**
   * Optional W04 definition model for ready-state consumers.
   */
  definition?: SchemaDefinitionInput;
  children?: ReactNode;
};

export function SchemaSurface({
  status,
  statusTitle,
  statusMessage,
  className,
  "data-testid": testId = "schema-surface",
  display: _display,
  definition: _definition,
  children,
}: SchemaSurfaceProps) {
  if (status !== "ready") {
    return (
      <div className={cn(className)} data-testid={testId}>
        <SchemaStatus
          kind={status}
          message={statusMessage ?? SCHEMA_UI_STATUS_DEFAULT_MESSAGES[status]}
          title={statusTitle ?? SCHEMA_UI_STATUS_DEFAULT_TITLES[status]}
        />
      </div>
    );
  }

  return (
    <div
      className={cn("min-w-0", className)}
      data-schema-status="ready"
      data-testid={testId}
    >
      {children}
    </div>
  );
}
