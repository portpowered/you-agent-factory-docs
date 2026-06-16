import { describe, expect, test } from "bun:test";
import { resolveMessage } from "../../src/localization/lib/resolve-message";
import { enMessages } from "../../src/localization/messages/en";

describe("shared shell message resolution", () => {
  test("resolves typed shared shell keys from the default locale catalog", () => {
    expect(resolveMessage(enMessages, "common.getStarted")).toBe("Get started");
    expect(resolveMessage(enMessages, "landing.primaryNavAriaLabel")).toBe(
      "Primary",
    );
    expect(resolveMessage(enMessages, "docs.navHeading")).toBe(
      "Docs navigation",
    );
  });

  test("throws when a shared shell message key is missing", () => {
    expect(() =>
      resolveMessage(enMessages, "common.missingKey" as "common.getStarted"),
    ).toThrow("Missing shared shell message key: common.missingKey");
  });
});
