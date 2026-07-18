import { describe, expect, test } from "bun:test";
import {
  assertContractDescriptionRole,
  assertGeneratedExamplePayloadIsLocaleNeutral,
  CONTRACT_LANGUAGE,
  ContractLanguagePolicyError,
  englishContractLanguageBoundaryAttributes,
  GENERATED_EXAMPLE_PAYLOAD_POLICY,
  isGeneratedExampleChromeLabelLocalizable,
  isGeneratedExamplePayloadLocalizable,
  needsEnglishContractLanguageBoundary,
  preserveUntranslatedContractIdentifier,
  resolveEnglishContractLanguageBoundary,
  UNTRANSLATED_CONTRACT_IDENTIFIER_KINDS,
} from "@/lib/i18n/contract-language-policy";
import { supportedLocales } from "@/lib/i18n/locale-routing";

describe("contract-language policy", () => {
  test("documents the untranslated identifier kinds required by W17", () => {
    expect(UNTRANSLATED_CONTRACT_IDENTIFIER_KINDS).toEqual([
      "api-path",
      "http-method",
      "operation-id",
      "json-pointer",
      "discriminator-value",
      "enum-value",
      "command-literal",
      "tool-name",
      "symbol-path",
    ]);
    expect(CONTRACT_LANGUAGE).toBe("en");
  });

  test("preserves representative contract identifiers byte-identical", () => {
    const samples = [
      { kind: "api-path" as const, value: "/v1/factories/{factoryId}" },
      { kind: "http-method" as const, value: "GET" },
      { kind: "operation-id" as const, value: "listFactories" },
      { kind: "json-pointer" as const, value: "/properties/type" },
      { kind: "discriminator-value" as const, value: "agent" },
      { kind: "enum-value" as const, value: "active" },
      { kind: "command-literal" as const, value: "you run --named" },
      { kind: "tool-name" as const, value: "factory.list" },
      { kind: "symbol-path" as const, value: "FactoryRuntime.start" },
    ];

    for (const sample of samples) {
      expect(
        preserveUntranslatedContractIdentifier(sample.value, sample.kind),
      ).toBe(sample.value);
    }
  });

  test("fails closed for empty contract identifiers", () => {
    expect(() =>
      preserveUntranslatedContractIdentifier("", "http-method"),
    ).toThrow(ContractLanguagePolicyError);
  });

  test("applies an English language boundary only on non-default locales", () => {
    expect(needsEnglishContractLanguageBoundary("en")).toBe(false);
    expect(englishContractLanguageBoundaryAttributes("en")).toBeUndefined();

    for (const locale of supportedLocales.filter((entry) => entry !== "en")) {
      expect(needsEnglishContractLanguageBoundary(locale)).toBe(true);
      expect(englishContractLanguageBoundaryAttributes(locale)).toEqual({
        lang: "en",
      });
      expect(
        resolveEnglishContractLanguageBoundary(locale, "contract-description"),
      ).toEqual({ lang: "en" });
    }
  });

  test("fails closed when language-boundary helpers are used for chrome", () => {
    expect(() =>
      resolveEnglishContractLanguageBoundary("ja", "chrome"),
    ).toThrow(ContractLanguagePolicyError);
    expect(() => assertContractDescriptionRole("chrome")).toThrow(
      ContractLanguagePolicyError,
    );
  });

  test("fails closed when language-boundary helpers are used for identifiers or payloads", () => {
    expect(() =>
      resolveEnglishContractLanguageBoundary("ja", "contract-identifier"),
    ).toThrow(ContractLanguagePolicyError);
    expect(() =>
      resolveEnglishContractLanguageBoundary("ja", "generated-example-payload"),
    ).toThrow(ContractLanguagePolicyError);
  });

  test("defines generated examples as locale-neutral payloads with localizable chrome", () => {
    expect(GENERATED_EXAMPLE_PAYLOAD_POLICY).toBe("locale-neutral");
    expect(() => assertGeneratedExamplePayloadIsLocaleNeutral()).not.toThrow();
    expect(isGeneratedExamplePayloadLocalizable()).toBe(false);
    expect(isGeneratedExampleChromeLabelLocalizable()).toBe(true);
  });
});
