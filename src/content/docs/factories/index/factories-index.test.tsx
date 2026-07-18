import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import FactoriesIndexPage from "@/app/(site)/docs/factories/page";
import LocalizedFactoriesIndexPage from "@/app/[locale]/docs/factories/page";
import { loadUiMessages } from "@/lib/content/ui-messages";

afterEach(() => {
  cleanup();
});

describe("factories index", () => {
  test("publishes /docs/factories with overview, live root summary, and child pages", async () => {
    const messages = await loadUiMessages();
    const indexMessages = messages.factoriesIndex;

    render(await FactoriesIndexPage());

    expect(screen.getByText(indexMessages.title)).toBeTruthy();
    expect(screen.getByText(indexMessages.description)).toBeTruthy();
    expect(
      document.querySelector("[data-factories-index-overview]"),
    ).toBeTruthy();
    expect(screen.getByText(indexMessages.overviewTitle)).toBeTruthy();
    expect(screen.getByText(indexMessages.overviewBody)).toBeTruthy();
    expect(indexMessages.overviewBody).toMatch(/Factory|factory\.json/i);
    expect(indexMessages.overviewBody).not.toMatch(
      /Model Atlas|on this page|page meta/i,
    );

    expect(
      document.querySelector("[data-factories-index-schema-summary]"),
    ).toBeTruthy();
    expect(screen.getByText(indexMessages.schemaSummaryTitle)).toBeTruthy();

    const schemaEmbed = screen.getByTestId(
      "factories-index-factory-root-schema",
    );
    expect(schemaEmbed).toBeTruthy();
    expect(schemaEmbed.getAttribute("data-schema-status")).toBe("ready");
    expect(
      schemaEmbed.querySelector('[data-schema-field-path="workTypes"]'),
    ).toBeTruthy();
    expect(
      schemaEmbed.querySelector('[data-schema-field-path="workers"]'),
    ).toBeTruthy();
    expect(
      schemaEmbed.querySelector('[data-schema-field-path="workstations"]'),
    ).toBeTruthy();

    const fullSchema = document.querySelector(
      "[data-factories-index-full-schema-link]",
    );
    expect(fullSchema?.getAttribute("href")).toBe("/docs/references/schema");
    const fullApi = document.querySelector(
      "[data-factories-index-full-api-link]",
    );
    expect(fullApi?.getAttribute("href")).toBe("/docs/references/api");

    expect(
      screen.getByRole("list", { name: indexMessages.listLabel }),
    ).toBeTruthy();
    expect(
      screen
        .getAllByText("Configuration")
        .some((node) =>
          node.closest('a[href="/docs/factories/configuration"]'),
        ),
    ).toBe(true);
    expect(screen.getByText("Global Configuration")).toBeTruthy();
    expect(screen.getByText("Packaged Factories")).toBeTruthy();
    expect(screen.getByText("Dynamic Workflows")).toBeTruthy();
    expect(screen.getByText("Factory Sessions")).toBeTruthy();

    const configurationLink = screen
      .getAllByRole("link", { name: /^Configuration\b/ })
      .find(
        (link) => link.getAttribute("href") === "/docs/factories/configuration",
      );
    expect(configurationLink).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: /^Factory Sessions\b/ })
        .getAttribute("href"),
    ).toBe("/docs/factories/sessions");

    expect(screen.queryByText(indexMessages.emptyTitle)).toBeNull();
    expect(document.body.textContent).not.toContain("/docs/documentation/");
  });

  test("renders localized factories index overview while locale page stubs are absent", async () => {
    const messages = await loadUiMessages("ja");
    const indexMessages = messages.factoriesIndex;
    const html = renderToStaticMarkup(
      await LocalizedFactoriesIndexPage({
        params: Promise.resolve({ locale: "ja" }),
      }),
    );

    expect(html).toContain(indexMessages.title);
    expect(html).toContain(indexMessages.overviewTitle);
    expect(html).toContain(indexMessages.schemaSummaryTitle);
    expect(html).toContain('data-testid="factories-index-factory-root-schema"');
    // Child factories pages ship default-locale only until locale stubs exist.
    expect(html).toContain(indexMessages.emptyTitle);
    expect(html).not.toContain(`aria-label="${indexMessages.listLabel}"`);
  });
});
