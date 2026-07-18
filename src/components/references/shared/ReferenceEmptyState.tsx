import {
  AlertPanel,
  AlertPanelText,
  AlertPanelTitle,
} from "@you-agent-factory/components/feedback";
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
  className,
}: ReferenceEmptyStateProps) {
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
          Family: {referenceFamilyLabel(family)}
        </AlertPanelText>
      ) : null}
    </AlertPanel>
  );
}
