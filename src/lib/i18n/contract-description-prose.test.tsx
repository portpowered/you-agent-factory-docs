import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { PageMessagesProvider } from "@/features/docs/components/page-messages-context";
import type { PageMessages } from "@/lib/content/schemas";
import {
  ContractDescriptionProse,
  resolveContractDescriptionLocale,
} from "@/lib/i18n/contract-description-prose";

afterEach(() => {
  cleanup();
});

const emptyPageMessages = {
  title: "API",
  description: "Test",
} as PageMessages;

describe("resolveContractDescriptionLocale", () => {
  test("prefers explicit locale over page locale", () => {
    expect(resolveContractDescriptionLocale("vi", "ja")).toBe("vi");
  });

  test("falls back to page locale then default en", () => {
    expect(resolveContractDescriptionLocale(undefined, "zh-CN")).toBe("zh-CN");
    expect(resolveContractDescriptionLocale(undefined, undefined)).toBe("en");
  });
});

describe("ContractDescriptionProse", () => {
  test("emits lang=en when page context locale is non-English", () => {
    render(
      <PageMessagesProvider messages={emptyPageMessages} locale="ja">
        <ContractDescriptionProse data-api-operation-description="">
          Enqueue a work item for the session.
        </ContractDescriptionProse>
      </PageMessagesProvider>,
    );

    const node = screen.getByText("Enqueue a work item for the session.");
    expect(node.tagName).toBe("P");
    expect(node.getAttribute("lang")).toBe("en");
    expect(node.getAttribute("data-contract-prose")).toBe("");
    expect(node.getAttribute("data-api-operation-description")).toBe("");
  });

  test("does not add lang on default-locale pages", () => {
    render(
      <PageMessagesProvider messages={emptyPageMessages} locale="en">
        <ContractDescriptionProse>
          Enqueue a work item for the session.
        </ContractDescriptionProse>
      </PageMessagesProvider>,
    );

    const node = screen.getByText("Enqueue a work item for the session.");
    expect(node.getAttribute("lang")).toBeNull();
  });

  test("explicit locale prop overrides page context", () => {
    render(
      <PageMessagesProvider messages={emptyPageMessages} locale="en">
        <ContractDescriptionProse as="span" locale="zh-CN">
          Session identifier
        </ContractDescriptionProse>
      </PageMessagesProvider>,
    );

    const node = screen.getByText("Session identifier");
    expect(node.tagName).toBe("SPAN");
    expect(node.getAttribute("lang")).toBe("en");
  });

  test("defaults to en outside page context (no redundant boundary)", () => {
    render(<ContractDescriptionProse>Accepted</ContractDescriptionProse>);

    const node = screen.getByText("Accepted");
    expect(node.getAttribute("lang")).toBeNull();
    expect(node.getAttribute("data-contract-language")).toBe("en");
  });
});
