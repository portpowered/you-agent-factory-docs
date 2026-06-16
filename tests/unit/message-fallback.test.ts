import { describe, expect, test } from "bun:test";
import {
  resolveMessage,
  resolveMessageWithFallback,
} from "../../src/localization/lib/resolve-message";
import { enMessages } from "../../src/localization/messages/en";
import { frMessages } from "../../src/localization/messages/fr";

describe("shared shell message fallback", () => {
  test("resolves localized values when present in the active catalog", () => {
    expect(
      resolveMessageWithFallback(frMessages, enMessages, "common.getStarted"),
    ).toBe("Commencer");
    expect(
      resolveMessageWithFallback(frMessages, enMessages, "docs.navHeading"),
    ).toBe("Navigation de la documentation");
  });

  test("falls back to the default locale when a key is missing in the active catalog", () => {
    expect(
      resolveMessageWithFallback(frMessages, enMessages, "common.githubCta"),
    ).toBe(enMessages.common.githubCta);
    expect(
      resolveMessageWithFallback(
        frMessages,
        enMessages,
        "landing.valueStatement",
      ),
    ).toBe(enMessages.landing.valueStatement);
    expect(
      resolveMessageWithFallback(frMessages, enMessages, "docs.shellTitle"),
    ).toBe(enMessages.docs.shellTitle);
    expect(
      resolveMessageWithFallback(frMessages, enMessages, "docs.framingText"),
    ).toBe(enMessages.docs.framingText);
    expect(
      resolveMessageWithFallback(frMessages, enMessages, "docs.navOverview"),
    ).toBe(enMessages.docs.navOverview);
  });

  test("falls back through ARIA label keys used by homepage and docs shells", () => {
    expect(
      resolveMessageWithFallback(
        frMessages,
        enMessages,
        "landing.primaryNavAriaLabel",
      ),
    ).toBe("Principale");
    expect(
      resolveMessageWithFallback(frMessages, enMessages, "shell.openMenuLabel"),
    ).toBe(enMessages.shell.openMenuLabel);
  });

  test("throws when a key is missing in both active and default catalogs", () => {
    expect(() =>
      resolveMessageWithFallback(
        frMessages,
        enMessages,
        "common.missingKey" as "common.getStarted",
      ),
    ).toThrow("Missing shared shell message key: common.missingKey");
  });

  test("uses the default catalog directly when locale is the default locale", () => {
    expect(resolveMessage(enMessages, "common.getStarted")).toBe("Get started");
    expect(
      resolveMessageWithFallback(enMessages, enMessages, "common.getStarted"),
    ).toBe("Get started");
  });
});
