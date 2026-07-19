import {
  AlertPanel,
  AlertPanelText,
  AlertPanelTitle,
} from "@you-agent-factory/components/feedback";
import { cn } from "@/lib/utils";
import {
  CLI_STRUCTURED_OPTIONS_UNDER_CONSTRUCTION_DESCRIPTION,
  CLI_STRUCTURED_OPTIONS_UNDER_CONSTRUCTION_TITLE,
} from "./cli-capability";
import type { CliCapabilityNoticeProps } from "./types";

/**
 * Under-construction treatment when structured CLI flags/arguments are not
 * published yet. Visible chrome — not hover-only. Never fabricates flag names,
 * defaults, conflicts, or validation rules.
 */
export function CliCapabilityNotice({
  title = CLI_STRUCTURED_OPTIONS_UNDER_CONSTRUCTION_TITLE,
  description = CLI_STRUCTURED_OPTIONS_UNDER_CONSTRUCTION_DESCRIPTION,
  className,
}: CliCapabilityNoticeProps) {
  return (
    <AlertPanel
      className={cn(className)}
      compact
      data-cli-capability-notice=""
      data-cli-capability="structured-options-under-construction"
      semantic="info"
    >
      <AlertPanelTitle>{title}</AlertPanelTitle>
      <AlertPanelText>{description}</AlertPanelText>
    </AlertPanel>
  );
}
