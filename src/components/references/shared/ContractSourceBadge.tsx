import { cn } from "@/lib/utils";
import { ReferenceLifecycleVisibility } from "./ReferenceLifecycleVisibility";
import {
  referenceFamilyLabel,
  referenceSourceArtifactLabel,
} from "./reference-status-labels";
import type { ContractSourceBadgeProps } from "./types";

/**
 * Informative contract source chrome for reference items.
 *
 * Renders family, lifecycle, package version (when known), and source artifact
 * identity from normalized projection fields. Not decorative-only styling —
 * every field is readable text.
 */
export function ContractSourceBadge({
  family,
  lifecycle,
  packageVersion,
  source,
  visibility,
  className,
}: ContractSourceBadgeProps) {
  const familyLabel = referenceFamilyLabel(family);
  const sourceLabel = referenceSourceArtifactLabel(source);
  const summaryParts = [
    `Family ${familyLabel}`,
    packageVersion !== undefined
      ? `package ${packageVersion}`
      : "package version not published",
    `source ${sourceLabel}`,
  ];

  return (
    <aside
      aria-label={`Contract source: ${summaryParts.join(", ")}`}
      className={cn(
        "flex flex-col gap-2 rounded-md border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground",
        className,
      )}
      data-contract-source-badge=""
      data-reference-family={family}
      data-source-artifact={source.publicArtifactId}
      data-source-pointer={source.pointer}
      {...(packageVersion !== undefined
        ? { "data-package-version": packageVersion }
        : {})}
      {...(lifecycle !== undefined
        ? { "data-lifecycle-state": lifecycle.state }
        : {})}
      {...(visibility !== undefined ? { "data-visibility": visibility } : {})}
    >
      <dl className="m-0 grid gap-1.5 sm:grid-cols-[auto_1fr] sm:gap-x-3">
        <div className="contents">
          <dt className="m-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Family
          </dt>
          <dd className="m-0 font-medium">{familyLabel}</dd>
        </div>
        <div className="contents">
          <dt className="m-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Package version
          </dt>
          <dd className="m-0 font-mono text-xs">
            {packageVersion !== undefined
              ? packageVersion
              : "Not published on this projection"}
          </dd>
        </div>
        <div className="contents">
          <dt className="m-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Source artifact
          </dt>
          <dd className="m-0 break-all font-mono text-xs">{sourceLabel}</dd>
        </div>
      </dl>
      <ReferenceLifecycleVisibility
        lifecycle={lifecycle}
        visibility={visibility}
      />
    </aside>
  );
}
