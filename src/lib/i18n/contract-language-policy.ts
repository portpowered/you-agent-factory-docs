/**
 * W17 contract-language policy (code-enforced).
 *
 * Machine identifiers and canonical contract descriptions stay English across
 * locales. Reader-facing reference chrome localizes through message catalogs
 * with fail-closed missing-key behavior (see explorer-labels). Generated
 * example payloads are locale-neutral: literals and identifiers stay English;
 * only example chrome labels (for example "Generated example") may localize.
 *
 * Call-site rule:
 * - contract-description → EnglishContractDescription / language-boundary helpers
 * - contract-identifier / generated-example-payload → preserve as-is (untranslated)
 * - chrome → message catalogs only; never language-boundary helpers
 */

import { defaultLocale, type SiteLocale } from "@/lib/i18n/locale-routing";

/** Canonical language for contract truth (identifiers + package descriptions). */
export const CONTRACT_LANGUAGE = "en" as const;

export type ContractLanguage = typeof CONTRACT_LANGUAGE;

/**
 * Identifier kinds that must remain byte-identical across locales.
 * Do not route these through translation catalogs.
 */
export const UNTRANSLATED_CONTRACT_IDENTIFIER_KINDS = [
  "api-path",
  "http-method",
  "operation-id",
  "json-pointer",
  "discriminator-value",
  "enum-value",
  "command-literal",
  "tool-name",
  "symbol-path",
] as const;

export type UntranslatedContractIdentifierKind =
  (typeof UNTRANSLATED_CONTRACT_IDENTIFIER_KINDS)[number];

/**
 * Generated example payloads stay locale-neutral. Chrome labels around them
 * (origin badges, section titles, copy buttons) remain eligible for localization
 * in later W17 chrome-catalog stories.
 */
export const GENERATED_EXAMPLE_PAYLOAD_POLICY = "locale-neutral" as const;

export type GeneratedExamplePayloadPolicy =
  typeof GENERATED_EXAMPLE_PAYLOAD_POLICY;

/**
 * Distinguishes contract prose / identifiers / payloads from localizable chrome
 * so helpers can fail closed on misuse.
 */
export const REFERENCE_TEXT_ROLES = [
  "contract-description",
  "contract-identifier",
  "generated-example-payload",
  "chrome",
] as const;

export type ReferenceTextRole = (typeof REFERENCE_TEXT_ROLES)[number];

export class ContractLanguagePolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContractLanguagePolicyError";
  }
}

/**
 * Return a contract identifier unchanged. Empty values fail closed so callers
 * cannot silently invent or drop identity text.
 */
export function preserveUntranslatedContractIdentifier(
  value: string,
  kind: UntranslatedContractIdentifierKind,
): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new ContractLanguagePolicyError(
      `Contract identifier of kind "${kind}" must be a non-empty string and must remain untranslated across locales.`,
    );
  }
  return value;
}

/** True when the UI locale differs from the contract language. */
export function needsEnglishContractLanguageBoundary(
  locale: SiteLocale,
): boolean {
  return locale !== defaultLocale;
}

/**
 * Attributes for wrapping canonical English contract description prose.
 * Default-locale pages inherit the page `lang` and need no redundant boundary.
 */
export function englishContractLanguageBoundaryAttributes(
  locale: SiteLocale,
): { lang: ContractLanguage } | undefined {
  if (!needsEnglishContractLanguageBoundary(locale)) {
    return undefined;
  }
  return { lang: CONTRACT_LANGUAGE };
}

/**
 * Resolve language-boundary attributes for a known text role.
 * Chrome must not use this path — localize chrome via message catalogs.
 * Identifiers and generated example payloads stay English by identity and are
 * not wrapped as description prose.
 */
export function resolveEnglishContractLanguageBoundary(
  locale: SiteLocale,
  role: ReferenceTextRole,
): { lang: ContractLanguage } | undefined {
  switch (role) {
    case "contract-description":
      return englishContractLanguageBoundaryAttributes(locale);
    case "chrome":
      throw new ContractLanguagePolicyError(
        'Language-boundary helpers accept only role "contract-description"; got "chrome". Localize chrome strings through message catalogs instead of marking them as English contract prose.',
      );
    case "contract-identifier":
      throw new ContractLanguagePolicyError(
        'Language-boundary helpers accept only role "contract-description"; got "contract-identifier". Pass identifiers through preserveUntranslatedContractIdentifier instead.',
      );
    case "generated-example-payload":
      throw new ContractLanguagePolicyError(
        'Language-boundary helpers accept only role "contract-description"; got "generated-example-payload". Generated example payloads are locale-neutral literals — keep them English without a description language boundary.',
      );
    default: {
      const _exhaustive: never = role;
      throw new ContractLanguagePolicyError(
        `Unknown reference text role: ${String(_exhaustive)}`,
      );
    }
  }
}

/** Assert the caller is wrapping contract description prose, not chrome. */
export function assertContractDescriptionRole(
  role: ReferenceTextRole,
): asserts role is "contract-description" {
  if (role !== "contract-description") {
    throw new ContractLanguagePolicyError(
      `Expected reference text role "contract-description"; got "${role}". Keep chrome and contract prose separated.`,
    );
  }
}

/**
 * Generated example payload content is never localizable. Use message catalogs
 * only for surrounding chrome labels.
 */
export function assertGeneratedExamplePayloadIsLocaleNeutral(
  policy: GeneratedExamplePayloadPolicy = GENERATED_EXAMPLE_PAYLOAD_POLICY,
): void {
  if (policy !== "locale-neutral") {
    throw new ContractLanguagePolicyError(
      `Generated example payloads must use policy "locale-neutral"; got "${String(policy)}".`,
    );
  }
}

/** Chrome labels around examples (for example "Generated example") may localize. */
export function isGeneratedExampleChromeLabelLocalizable(): true {
  return true;
}

/** Payload / literal body content for generated examples must not localize. */
export function isGeneratedExamplePayloadLocalizable(): false {
  return false;
}
