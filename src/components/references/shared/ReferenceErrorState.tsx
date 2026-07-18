import {
  AlertPanel,
  AlertPanelText,
  AlertPanelTitle,
} from "@you-agent-factory/components/feedback";
import { cn } from "@/lib/utils";
import { referenceFamilyLabel } from "./reference-status-labels";
import type { ReferenceErrorStateProps } from "./types";

/**
 * Accessible error state for malformed or unreadable reference inventories.
 * Uses package AlertPanel error semantics with a live region role.
 */
export function ReferenceErrorState({
  title,
  description,
  detail,
  family,
  className,
}: ReferenceErrorStateProps) {
  return (
    <AlertPanel
      className={cn(className)}
      data-reference-error-state=""
      {...(family !== undefined ? { "data-reference-family": family } : {})}
      semantic="error"
    >
      <AlertPanelTitle>{title}</AlertPanelTitle>
      <AlertPanelText>{description}</AlertPanelText>
      {detail !== undefined && detail.length > 0 ? (
        <AlertPanelText as="pre" className="overflow-x-auto font-mono text-xs">
          {detail}
        </AlertPanelText>
      ) : null}
      {family !== undefined ? (
        <AlertPanelText variant="supporting">
          Family: {referenceFamilyLabel(family)}
        </AlertPanelText>
      ) : null}
    </AlertPanel>
  );
}
