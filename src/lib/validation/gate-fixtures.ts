import {
  type FoundationContentMetadata,
  getFoundationContentMetadata,
} from "@/lib/validation/foundation-content";
import {
  type ShellLocalizationCopy,
  getShellLocalizationCopy,
} from "@/lib/validation/shell-localization";

export const EARLY_GATE_VALIDATION_FIXTURES = {
  "broken-shell-localization": (): ShellLocalizationCopy => ({
    ...getShellLocalizationCopy(),
    GITHUB_CTA_LABEL: "",
  }),
  "broken-foundation-content": (): FoundationContentMetadata => ({
    ...getFoundationContentMetadata(),
    PROJECT_TAGLINE: "   ",
  }),
} as const;

export type EarlyGateValidationFixture =
  keyof typeof EARLY_GATE_VALIDATION_FIXTURES;

export function readEarlyGateValidationFixture(): EarlyGateValidationFixture | null {
  const value = process.env.EARLY_GATE_VALIDATION_FIXTURE;
  if (!value) {
    return null;
  }

  if (value in EARLY_GATE_VALIDATION_FIXTURES) {
    return value as EarlyGateValidationFixture;
  }

  return null;
}

export function resolveShellLocalizationCopyForGate(): ShellLocalizationCopy {
  const fixture = readEarlyGateValidationFixture();
  if (fixture === "broken-shell-localization") {
    return EARLY_GATE_VALIDATION_FIXTURES["broken-shell-localization"]();
  }

  return getShellLocalizationCopy();
}

export function resolveFoundationContentMetadataForGate(): FoundationContentMetadata {
  const fixture = readEarlyGateValidationFixture();
  if (fixture === "broken-foundation-content") {
    return EARLY_GATE_VALIDATION_FIXTURES["broken-foundation-content"]();
  }

  return getFoundationContentMetadata();
}
