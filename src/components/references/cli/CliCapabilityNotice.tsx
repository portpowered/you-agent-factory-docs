import {
  AlertPanel,
  AlertPanelText,
  AlertPanelTitle,
} from "@you-agent-factory/components/feedback";
import { cn } from "@/lib/utils";
import {
  CLI_STRUCTURED_OPTIONS_UNAVAILABLE_DESCRIPTION,
  CLI_STRUCTURED_OPTIONS_UNAVAILABLE_TITLE,
} from "./cli-capability";
import type { CliCapabilityNoticeProps } from "./types";

/**
 * Explicit disclosure when structured CLI flags/arguments are unavailable
 * from the published package contract. Visible chrome — not hover-only.
 * Never fabricates flag names, defaults, conflicts, or validation rules.
 */
export function CliCapabilityNotice({
  title = CLI_STRUCTURED_OPTIONS_UNAVAILABLE_TITLE,
  description = CLI_STRUCTURED_OPTIONS_UNAVAILABLE_DESCRIPTION,
  className,
}: CliCapabilityNoticeProps) {
  return (
    <AlertPanel
      className={cn(className)}
      compact
      data-cli-capability-notice=""
      data-cli-capability="structured-options-unavailable"
      semantic="info"
    >
      <AlertPanelTitle>{title}</AlertPanelTitle>
      <AlertPanelText>{description}</AlertPanelText>
    </AlertPanel>
  );
}
