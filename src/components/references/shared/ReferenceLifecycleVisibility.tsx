import {
  CheckCircle2,
  Eye,
  EyeOff,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import type { ReferenceLifecycleState } from "@/lib/references/reference-item";
import { cn } from "@/lib/utils";
import {
  referenceLifecycleStateLabel,
  referenceLifecycleSummary,
  referenceVisibilityLabel,
} from "./reference-status-labels";
import type {
  ReferenceLifecycleVisibilityProps,
  ReferenceVisibility,
} from "./types";

type StatusIcon = ComponentType<SVGProps<SVGSVGElement>>;

const LIFECYCLE_ICON: Record<ReferenceLifecycleState, StatusIcon> = {
  active: CheckCircle2,
  deprecated: TriangleAlert,
  removed: XCircle,
};

const VISIBILITY_ICON: Record<ReferenceVisibility, StatusIcon> = {
  public: Eye,
  internal: EyeOff,
};

const statusChipClassName =
  "inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/60 px-2 py-0.5 text-xs font-medium text-foreground";

/**
 * Accessible lifecycle + visibility chrome shared by CLI / MCP / JavaScript
 * reference renderers. Status is always text + icon — never color alone.
 */
export function ReferenceLifecycleVisibility({
  lifecycle,
  visibility,
  className,
}: ReferenceLifecycleVisibilityProps) {
  if (lifecycle === undefined && visibility === undefined) {
    return null;
  }

  const LifecycleIcon =
    lifecycle !== undefined ? LIFECYCLE_ICON[lifecycle.state] : null;
  const VisibilityIcon =
    visibility !== undefined ? VISIBILITY_ICON[visibility] : null;

  return (
    <div
      className={cn("flex flex-wrap items-center gap-2", className)}
      data-reference-status-chrome=""
    >
      {lifecycle !== undefined && LifecycleIcon !== null ? (
        <span
          className={statusChipClassName}
          data-lifecycle-state={lifecycle.state}
          title={referenceLifecycleSummary(lifecycle)}
        >
          <LifecycleIcon aria-hidden="true" className="size-3.5 shrink-0" />
          <span>
            Lifecycle: {referenceLifecycleStateLabel(lifecycle.state)}
          </span>
          <span className="sr-only">
            {referenceLifecycleSummary(lifecycle)}
          </span>
        </span>
      ) : null}
      {visibility !== undefined && VisibilityIcon !== null ? (
        <span className={statusChipClassName} data-visibility={visibility}>
          <VisibilityIcon aria-hidden="true" className="size-3.5 shrink-0" />
          <span>Visibility: {referenceVisibilityLabel(visibility)}</span>
        </span>
      ) : null}
    </div>
  );
}
