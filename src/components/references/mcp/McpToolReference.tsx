import {
  ContractSourceBadge,
  SchemaDefinitionEmbed,
} from "@/components/references/shared";
import type { McpToolNormalized } from "@/lib/references/family-normalized-models";
import { resolveMcpToolExample } from "@/lib/references/mcp-example-generation";
import { cn } from "@/lib/utils";
import { McpToolExample } from "./McpToolExample";
import type { McpToolReferenceProps } from "./types";

function booleanStateLabel(value: boolean): string {
  return value ? "Yes" : "No";
}

/**
 * Render one normalized MCP tool with available published metadata and its
 * input schema embed (thin local SchemaDefinitionModel adapter when W07 is
 * absent). Does not invent required inputs, properties, or handler state.
 * Shows a schema-valid example labeled generated when no authored example
 * exists on the projection.
 */
export function McpToolReference({
  tool,
  packageVersion,
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
        <h3 className="m-0 font-mono text-base font-semibold tracking-tight">
          <a
            className="text-foreground no-underline hover:underline"
            href={`#${tool.anchor}`}
          >
            {tool.name}
          </a>
        </h3>
        {tool.description !== undefined ? (
          <p className="m-0 text-sm text-muted-foreground">
            {tool.description}
          </p>
        ) : null}
      </header>

      <ContractSourceBadge
        family="mcp"
        lifecycle={tool.lifecycle}
        packageVersion={packageVersion}
        source={tool.source}
      />

      <dl className="m-0 grid gap-2 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-4">
        <MetadataRow label="Tool name" value={tool.name} mono />
        <MetadataRow label="Tool id" value={tool.id} mono />
        {tool.handlerRegistered !== undefined ? (
          <MetadataRow
            label="Handler registered"
            value={booleanStateLabel(tool.handlerRegistered)}
          />
        ) : null}
        {tool.requiredInputs !== undefined && tool.requiredInputs.length > 0 ? (
          <MetadataRow
            label="Required inputs"
            value={tool.requiredInputs.join(", ")}
            mono
          />
        ) : null}
      </dl>

      <section className="space-y-2" data-mcp-input-schema="">
        <h4 className="m-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Input schema
        </h4>
        {tool.inputSchema !== undefined ? (
          <SchemaDefinitionEmbed definition={tool.inputSchema} />
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

function MetadataRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="contents">
      <dt className="m-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className={cn("m-0", mono ? "font-mono text-xs" : undefined)}>
        {value}
      </dd>
    </div>
  );
}

/** Pure helper for tests: list identity keys rendered from a tool list. */
export function mcpToolInventoryIdentities(
  tools: readonly McpToolNormalized[],
): string[] {
  return tools.map((tool) => tool.name);
}
