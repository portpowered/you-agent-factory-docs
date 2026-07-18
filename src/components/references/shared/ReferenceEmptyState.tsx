import {
  AlertPanel,
  AlertPanelText,
  AlertPanelTitle,
} from "@you-agent-factory/components/feedback";
import { formatReferenceChromeTemplate } from "@/lib/i18n/reference-chrome-labels";
import { cn } from "@/lib/utils";
import { referenceFamilyLabel } from "./reference-status-labels";
import type { ReferenceEmptyStateProps } from "./types";

/**
 * Accessible empty inventory state for CLI / MCP / JavaScript reference
 * surfaces. Composes package AlertPanel empty semantics — not color-only.
 */
export function ReferenceEmptyState({
  title,
  description,
  family,
  chrome,
  className,
}: ReferenceEmptyStateProps) {
  const familyWithLabel = chrome?.badge.familyWithLabel ?? "Family: {family}";

  return (
    <AlertPanel
      className={cn(className)}
      data-reference-empty-state=""
      {...(family !== undefined ? { "data-reference-family": family } : {})}
      semantic="empty"
    >
      <AlertPanelTitle>{title}</AlertPanelTitle>
      <AlertPanelText>{description}</AlertPanelText>
      {family !== undefined ? (
        <AlertPanelText variant="supporting">
          {formatReferenceChromeTemplate(familyWithLabel, {
            family: referenceFamilyLabel(family, chrome),
          })}
        </AlertPanelText>
      ) : null}
    </AlertPanel>
  );
}
