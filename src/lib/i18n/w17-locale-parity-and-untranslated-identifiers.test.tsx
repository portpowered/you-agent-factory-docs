/**
 * W17 story 006 — locale parity + untranslated-identifier behavioral suite.
 *
 * Observable runtime/render proofs only. Does not scan source trees, enforce
 * nav/search/compat registration inventories, or reopen W00–W14 ownership.
 */

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { PageMessagesProvider } from "@/features/docs/components/page-messages-context";
import { ApiOperationSection } from "@/features/references/api/api-operation-section";
import type { ApiOperationDetail } from "@/features/references/api/operation-detail";
import { CliCommandReference } from "@/features/references/cli/CliCommandReference";
import { JavaScriptSymbolReference } from "@/features/references/javascript/JavaScriptSymbolReference";
import { McpToolReference } from "@/features/references/mcp/McpToolReference";
import {
  projectSchemaExamplesFromInputs,
  SchemaComposition,
  SchemaConstraintList,
  SchemaExamplePanel,
  schemaExampleOriginLabel,
} from "@/features/references/schema";
import type { SchemaCompositionDisplay } from "@/features/references/schema/schema-ref-display";
import { ContractSourceBadge } from "@/features/references/shared/ContractSourceBadge";
import type { PageMessages } from "@/lib/content/schemas";
import { loadUiMessages } from "@/lib/content/ui-messages";
import type { ReferenceChromeMessages } from "@/lib/content/ui-messages.types";
import {
  GENERATED_EXAMPLE_PAYLOAD_POLICY,
  preserveUntranslatedContractIdentifier,
} from "@/lib/i18n/contract-language-policy";
import { type SiteLocale, supportedLocales } from "@/lib/i18n/locale-routing";
import {
  formatReferenceChromeTemplate,
  resolveReferenceChromeMessages,
} from "@/lib/i18n/reference-chrome-labels";
import type {
  CliCommandNormalized,
  JavascriptSymbolNormalized,
  McpToolNormalized,
} from "@/lib/references/family-normalized-models";

afterEach(() => {
  cleanup();
});

const pageMessages = {
  title: "References",
  description: "W17 parity harness",
} as PageMessages;

const IDENTIFIERS = {
  apiPath: "/factory-sessions/{session_id}/work",
  httpMethod: "POST",
  operationId: "submitWorkBySessionId",
  jsonPointer: "/properties/type",
  discriminatorValue: "agent",
  enumValue: "active",
  commandLiteral: "you config init",
  toolName: "you.factory_session.get",
  symbolPath: "FactoryRuntime.start",
} as const;

const apiDetail: ApiOperationDetail = {
  method: "post",
  path: IDENTIFIERS.apiPath,
  operationId: IDENTIFIERS.operationId,
  anchor: IDENTIFIERS.operationId,
  summary: "Submit work",
  description: "Enqueue a work item for the session.",
  parameters: [],
  responses: [
    {
      statusCode: "200",
      description: "Accepted",
      mediaTypes: [],
    },
  ],
};

const cliCommand: CliCommandNormalized = {
  id: "you.config.init",
  name: "init",
  commandPath: IDENTIFIERS.commandLiteral,
  aliases: [],
  shortDescription: "Create operator/system config on a fresh home",
  lifecycle: { state: "active", since: "0.0.0" },
  source: {
    publicArtifactId: "@you-agent-factory/api/cli",
    pointer: "/commands/2",
    path: "generated/cli/commands.json",
  },
  anchor: "you-config-init",
};

const mcpTool: McpToolNormalized = {
  id: "factory-session.get",
  name: IDENTIFIERS.toolName,
  description: "Get one durable Factory Session inspection read model.",
  lifecycle: { state: "active", since: "0.0.0" },
  source: {
    publicArtifactId: "@you-agent-factory/api/mcp",
    pointer: "/tools/1",
    path: "generated/mcp/tools.json",
  },
  anchor: IDENTIFIERS.toolName,
};

const jsSymbol: JavascriptSymbolNormalized = {
  id: "javascript.FactoryRuntime.start",
  name: "start",
  symbolPath: IDENTIFIERS.symbolPath,
  kind: "function",
  description: "Start the factory runtime.",
  lifecycle: { state: "active", since: "1.0.0" },
  source: {
    publicArtifactId: "@you-agent-factory/api/javascript/runtime",
    pointer: "/symbols/FactoryRuntime.start",
    path: "generated/javascript/runtime-api.json",
  },
  anchor: "FactoryRuntime.start",
};

const agentAddress = {
  publicArtifactId: "@you-agent-factory/api/schemas/factory",
  pointer: "/$defs/AgentWorker",
} as const;

const compositionDisplay: SchemaCompositionDisplay = {
  branches: [
    {
      kind: "oneOf",
      members: [
        {
          kind: "resolved",
          label: "AgentWorker",
          href: "#AgentWorker",
          targetAddress: agentAddress,
        },
      ],
    },
  ],
  discriminator: {
    propertyName: "type",
    mappings: [
      {
        value: IDENTIFIERS.discriminatorValue,
        link: {
          kind: "resolved",
          label: "AgentWorker",
          href: "#AgentWorker",
          targetAddress: agentAddress,
        },
      },
    ],
  },
};

const GENERATED_PAYLOAD = {
  sessionId: "sess_1",
  role: "writer",
  status: "active",
} as const;

/** Collect every non-empty leaf string path under reference chrome. */
function collectChromeLeafPaths(
  value: unknown,
  prefix = "",
): Array<{ path: string; text: string }> {
  if (typeof value === "string") {
    return [{ path: prefix || "(root)", text: value }];
  }
  if (!value || typeof value !== "object") {
    return [];
  }
  const entries: Array<{ path: string; text: string }> = [];
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    entries.push(...collectChromeLeafPaths(child, path));
  }
  return entries;
}

async function chromeFor(locale: SiteLocale): Promise<ReferenceChromeMessages> {
  return resolveReferenceChromeMessages(await loadUiMessages(locale));
}

describe("W17 locale parity (reference chrome catalogs)", () => {
  test("required chrome leaf keys resolve to non-empty strings for en/ja/zh-CN/vi", async () => {
    const byLocale = new Map<SiteLocale, ReferenceChromeMessages>();
    for (const locale of supportedLocales) {
      byLocale.set(locale, await chromeFor(locale));
    }

    for (const locale of supportedLocales) {
      const leaves = collectChromeLeafPaths(byLocale.get(locale));
      expect(leaves.length).toBeGreaterThan(40);
      for (const leaf of leaves) {
        expect(leaf.text.trim().length).toBeGreaterThan(0);
      }
    }

    // Same leaf inventory across locales (parity of required keys).
    const enPaths = collectChromeLeafPaths(byLocale.get("en"))
      .map((leaf) => leaf.path)
      .sort();
    for (const locale of supportedLocales.filter((entry) => entry !== "en")) {
      const paths = collectChromeLeafPaths(byLocale.get(locale))
        .map((leaf) => leaf.path)
        .sort();
      expect(paths).toEqual(enPaths);
    }
  });

  test("non-English chrome differs from English where translation is expected", async () => {
    const en = await chromeFor("en");
    const ja = await chromeFor("ja");
    const zhCN = await chromeFor("zh-CN");
    const vi = await chromeFor("vi");

    const translatedSamples: Array<
      (chrome: ReferenceChromeMessages) => string
    > = [
      (c) => c.filter.clearFilters,
      (c) => c.filter.lifecycleLabel,
      (c) => c.status.emptyTitle,
      (c) => c.badge.family,
      (c) => c.lifecycleStates.active,
      (c) => c.a11y.copyAnchorLink,
      (c) => c.examples.generated,
      (c) => c.inventory.cli.emptyTitle,
      (c) => c.inventory.mcp.filterLegend,
      (c) => c.inventory.javascript.errorTitle,
    ];

    for (const sample of translatedSamples) {
      expect(sample(ja)).not.toBe(sample(en));
      expect(sample(zhCN)).not.toBe(sample(en));
      expect(sample(vi)).not.toBe(sample(en));
    }

    // Literal family tokens stay untranslated across locales.
    for (const locale of supportedLocales) {
      const chrome = await chromeFor(locale);
      expect(chrome.families.api).toBe("API");
      expect(chrome.families.cli).toBe("CLI");
      expect(chrome.families.mcp).toBe("MCP");
    }
  });
});

describe("W17 untranslated identifiers in rendered reference output", () => {
  test("API path, method, and operationId stay byte-identical under Japanese chrome", async () => {
    const chrome = await chromeFor("ja");
    const { container } = render(
      <PageMessagesProvider locale="ja" messages={pageMessages}>
        <ApiOperationSection detail={apiDetail} />
        <ContractSourceBadge
          chrome={chrome}
          family="api"
          lifecycle={{ state: "active", since: "0.0.0" }}
          packageVersion="0.0.0"
          source={{
            publicArtifactId: "api",
            pointer: "/paths/~1factory-sessions/get",
            path: "generated/api/openapi.json",
          }}
          visibility="public"
        />
      </PageMessagesProvider>,
    );

    expect(
      preserveUntranslatedContractIdentifier(IDENTIFIERS.apiPath, "api-path"),
    ).toBe(IDENTIFIERS.apiPath);
    expect(screen.getByText(IDENTIFIERS.apiPath)).toBeTruthy();
    expect(screen.getByText(IDENTIFIERS.httpMethod)).toBeTruthy();
    expect(
      screen.getByText(`operationId: ${IDENTIFIERS.operationId}`),
    ).toBeTruthy();
    expect(
      container.querySelector(
        `[data-api-operation-path="${IDENTIFIERS.apiPath}"]`,
      ),
    ).toBeTruthy();
    expect(
      container.querySelector(
        `[data-api-operation-id="${IDENTIFIERS.operationId}"]`,
      ),
    ).toBeTruthy();
    // Localized badge chrome beside untranslated family token.
    expect(screen.getByText(chrome.badge.family)).toBeTruthy();
    expect(screen.getByText("API")).toBeTruthy();
  });

  test("CLI command literal, MCP tool name, and JS symbol path stay identical across locales", async () => {
    for (const locale of supportedLocales) {
      const chrome = await chromeFor(locale);
      cleanup();
      const { container } = render(
        <PageMessagesProvider locale={locale} messages={pageMessages}>
          <CliCommandReference chrome={chrome} command={cliCommand} />
          <McpToolReference chrome={chrome} tool={mcpTool} />
          <JavaScriptSymbolReference chrome={chrome} symbol={jsSymbol} />
        </PageMessagesProvider>,
      );

      expect(
        preserveUntranslatedContractIdentifier(
          IDENTIFIERS.commandLiteral,
          "command-literal",
        ),
      ).toBe(IDENTIFIERS.commandLiteral);
      expect(
        preserveUntranslatedContractIdentifier(
          IDENTIFIERS.toolName,
          "tool-name",
        ),
      ).toBe(IDENTIFIERS.toolName);
      expect(
        preserveUntranslatedContractIdentifier(
          IDENTIFIERS.symbolPath,
          "symbol-path",
        ),
      ).toBe(IDENTIFIERS.symbolPath);

      expect(
        container.querySelector(
          `[data-cli-command-path="${IDENTIFIERS.commandLiteral}"]`,
        ),
      ).toBeTruthy();
      expect(
        container.querySelector(
          `[data-mcp-tool-name="${IDENTIFIERS.toolName}"]`,
        ),
      ).toBeTruthy();
      expect(
        container.querySelector(
          `[data-javascript-symbol-path="${IDENTIFIERS.symbolPath}"]`,
        ),
      ).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: IDENTIFIERS.commandLiteral }),
      ).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: IDENTIFIERS.toolName }),
      ).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: IDENTIFIERS.symbolPath }),
      ).toBeTruthy();
    }
  });

  test("JSON pointer, discriminator value, and enum literal remain untranslated in schema UI", () => {
    const { container } = render(
      <PageMessagesProvider locale="zh-CN" messages={pageMessages}>
        <SchemaComposition display={compositionDisplay} />
        <SchemaConstraintList enum={[IDENTIFIERS.enumValue, "pending"]} />
        <code data-testid="json-pointer-sample">{IDENTIFIERS.jsonPointer}</code>
      </PageMessagesProvider>,
    );

    expect(
      preserveUntranslatedContractIdentifier(
        IDENTIFIERS.jsonPointer,
        "json-pointer",
      ),
    ).toBe(IDENTIFIERS.jsonPointer);
    expect(
      preserveUntranslatedContractIdentifier(
        IDENTIFIERS.discriminatorValue,
        "discriminator-value",
      ),
    ).toBe(IDENTIFIERS.discriminatorValue);
    expect(
      preserveUntranslatedContractIdentifier(
        IDENTIFIERS.enumValue,
        "enum-value",
      ),
    ).toBe(IDENTIFIERS.enumValue);

    expect(
      container.querySelector(
        `[data-schema-discriminator-value="${IDENTIFIERS.discriminatorValue}"]`,
      ),
    ).toBeTruthy();
    expect(screen.getByText(IDENTIFIERS.discriminatorValue)).toBeTruthy();
    const enumConstraint = container.querySelector(
      '[data-schema-constraint="enum"] code',
    );
    expect(enumConstraint?.textContent).toContain(`"${IDENTIFIERS.enumValue}"`);
    expect(enumConstraint?.textContent).toContain('"pending"');
    expect(screen.getByTestId("json-pointer-sample").textContent).toBe(
      IDENTIFIERS.jsonPointer,
    );
  });
});

describe("W17 language boundary on non-English reference pages", () => {
  test("canonical English contract descriptions expose lang=en under Japanese UI locale", () => {
    const { container } = render(
      <PageMessagesProvider locale="ja" messages={pageMessages}>
        <ApiOperationSection detail={apiDetail} />
      </PageMessagesProvider>,
    );

    const description = container.querySelector(
      "[data-api-operation-description]",
    );
    expect(description?.getAttribute("lang")).toBe("en");
    expect(description?.getAttribute("data-contract-prose")).toBe("");
    expect(description?.textContent).toBe(
      "Enqueue a work item for the session.",
    );

    const summary = container.querySelector("[data-api-operation-summary]");
    expect(summary?.getAttribute("lang")).toBe("en");
    expect(summary?.textContent).toBe("Submit work");
  });

  test("default-locale en pages omit redundant language boundary", () => {
    const { container } = render(
      <PageMessagesProvider locale="en" messages={pageMessages}>
        <ApiOperationSection detail={apiDetail} />
      </PageMessagesProvider>,
    );

    const description = container.querySelector(
      "[data-api-operation-description]",
    );
    expect(description?.getAttribute("lang")).toBeNull();
    expect(description?.textContent).toBe(
      "Enqueue a work item for the session.",
    );
  });
});

describe("W17 generated-example locale-neutral policy", () => {
  test("payload literals stay English while chrome labels localize", async () => {
    expect(GENERATED_EXAMPLE_PAYLOAD_POLICY).toBe("locale-neutral");

    const en = await chromeFor("en");
    const ja = await chromeFor("ja");

    const enDisplays = projectSchemaExamplesFromInputs(
      [{ value: GENERATED_PAYLOAD, origin: "generated", id: "gen-1" }],
      { chrome: en },
    );
    const jaDisplays = projectSchemaExamplesFromInputs(
      [{ value: GENERATED_PAYLOAD, origin: "generated", id: "gen-1" }],
      { chrome: ja },
    );

    // Payload bodies stay byte-identical across locales.
    expect(jaDisplays[0]?.code).toBe(enDisplays[0]?.code);
    expect(jaDisplays[0]?.code).toContain('"sessionId"');
    expect(jaDisplays[0]?.code).toContain('"sess_1"');
    expect(jaDisplays[0]?.code).toContain('"writer"');
    expect(jaDisplays[0]?.code).toContain('"active"');

    // Indexed chrome labels may localize; origin chrome may localize.
    expect(schemaExampleOriginLabel("generated", ja)).toBe(
      ja.examples.generated,
    );
    expect(schemaExampleOriginLabel("generated", ja)).not.toBe(
      en.examples.generated,
    );
    expect(jaDisplays[0]?.label).toBe(
      formatReferenceChromeTemplate(ja.examples.exampleIndexed, { index: 1 }),
    );
    expect(jaDisplays[0]?.label).not.toBe(enDisplays[0]?.label);

    cleanup();
    render(
      <SchemaExamplePanel
        chrome={ja}
        exampleInputs={[
          { value: GENERATED_PAYLOAD, origin: "generated", id: "gen-1" },
        ]}
      />,
    );

    expect(screen.getByText(ja.examples.generated)).toBeTruthy();
    expect(screen.queryByText(en.examples.generated)).toBeNull();
    const code = screen.getByTestId("schema-example-code-gen-1");
    expect(code.textContent).toContain('"sessionId"');
    expect(code.textContent).toContain('"sess_1"');
    expect(code.textContent).toContain('"writer"');
  });
});
