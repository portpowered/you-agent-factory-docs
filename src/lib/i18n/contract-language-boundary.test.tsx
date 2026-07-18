import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { EnglishContractDescription } from "@/lib/i18n/contract-language-boundary";
import { ContractLanguagePolicyError } from "@/lib/i18n/contract-language-policy";

afterEach(() => {
  cleanup();
});

describe("EnglishContractDescription", () => {
  test("emits lang=en on non-English locales for contract description prose", () => {
    render(
      <EnglishContractDescription locale="ja">
        Create a factory from a named goal.
      </EnglishContractDescription>,
    );

    const node = screen.getByText("Create a factory from a named goal.");
    expect(node.getAttribute("lang")).toBe("en");
    expect(node.getAttribute("data-contract-language")).toBe("en");
    expect(node.getAttribute("data-contract-prose")).toBe("");
  });

  test("does not add a redundant lang boundary on the default locale", () => {
    render(
      <EnglishContractDescription locale="en">
        Create a factory from a named goal.
      </EnglishContractDescription>,
    );

    const node = screen.getByText("Create a factory from a named goal.");
    expect(node.getAttribute("lang")).toBeNull();
    expect(node.getAttribute("data-contract-language")).toBe("en");
  });

  test("supports block containers via as= without changing the boundary policy", () => {
    render(
      <EnglishContractDescription as="p" locale="zh-CN">
        Canonical English contract description.
      </EnglishContractDescription>,
    );

    const node = screen.getByText("Canonical English contract description.");
    expect(node.tagName).toBe("P");
    expect(node.getAttribute("lang")).toBe("en");
  });

  test("fails closed when misused for chrome strings", () => {
    expect(() =>
      render(
        <EnglishContractDescription locale="vi" textRole="chrome">
          Loading…
        </EnglishContractDescription>,
      ),
    ).toThrow(ContractLanguagePolicyError);
  });
});
