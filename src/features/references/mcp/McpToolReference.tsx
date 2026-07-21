import { CopyableReferenceAnchor } from "@/features/references/shared";
import { ContractDescriptionProse } from "@/lib/i18n/contract-description-prose";
import type { McpToolNormalized } from "@/lib/references/family-normalized-models";
import { resolveMcpToolExample } from "@/lib/references/mcp-example-generation";
import { cn } from "@/lib/utils";
import { McpInputSchemaEmbed } from "./McpInputSchemaEmbed";
import { McpToolExample } from "./McpToolExample";
import type { McpToolReferenceProps } from "./types";

/**
 * Render one normalized MCP tool as a scannable card: title with stable
 * anchor, description when published, input schema embed, and example when
 * present. Does not invent schema fields or surface family / package /
 * duplicate identity / handler-registered chrome.
 */
export function McpToolReference({
  tool,
  chrome,
  className,
}: McpToolReferenceProps) {
  const example = resolveMcpToolExample(tool);

  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-md border border-border bg-background px-4 py-4",
        className,
      )}
      data-mcp-tool-id={tool.id}
      data-mcp-tool-name={tool.name}
      data-mcp-tool-reference=""
      id={tool.anchor}
    >
      <header className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="m-0 font-mono text-base font-semibold tracking-tight">
            <a
              className="text-foreground no-underline hover:underline"
              href={`#${tool.anchor}`}
            >
              {tool.name}
            </a>
          </h3>
          <CopyableReferenceAnchor
            anchor={tool.anchor}
            chrome={chrome}
            family="mcp"
          />
        </div>
        {tool.description !== undefined ? (
          <ContractDescriptionProse className="m-0 text-sm text-muted-foreground">
            {tool.description}
          </ContractDescriptionProse>
        ) : null}
      </header>

      <section className="space-y-2" data-mcp-input-schema="">
        <h4 className="m-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Input schema
        </h4>
        {tool.inputSchema !== undefined ? (
          <McpInputSchemaEmbed definition={tool.inputSchema} />
        ) : (
          <p
            className="m-0 text-sm text-muted-foreground"
            data-mcp-input-schema-absent=""
          >
            Input schema was not published on this projection.
          </p>
        )}
      </section>

      {example.origin !== "none" ? (
        <McpToolExample origin={example.origin} value={example.value} />
      ) : null}
    </article>
  );
}

/** Pure helper for tests: list identity keys rendered from a tool list. */
export function mcpToolInventoryIdentities(
  tools: readonly McpToolNormalized[],
): string[] {
  return tools.map((tool) => tool.name);
}
