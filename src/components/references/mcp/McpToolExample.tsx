import { CodePanel } from "@/features/factory-ui/data-display";
import type { McpToolExampleOrigin } from "@/lib/references/mcp-example-generation";
import { cn } from "@/lib/utils";
import {
  MCP_AUTHORED_EXAMPLE_HEADING,
  MCP_GENERATED_EXAMPLE_HEADING,
} from "./mcp-example";

export type McpToolExampleProps = {
  /** Example payload (authored or generated). */
  value: unknown;
  /** Whether this payload came from the contract or was generated. */
  origin: McpToolExampleOrigin;
  className?: string;
};

function formatExampleJson(value: unknown): string {
  try {
    return `${JSON.stringify(value, null, 2)}\n`;
  } catch {
    return String(value);
  }
}

/**
 * Render one MCP tool input example. Generated illustrations keep a short
 * section heading; authored contract examples are not labeled generated.
 * No explanatory AlertPanel notice for generated examples.
 */
export function McpToolExample({
  value,
  origin,
  className,
}: McpToolExampleProps) {
  const heading =
    origin === "generated"
      ? MCP_GENERATED_EXAMPLE_HEADING
      : MCP_AUTHORED_EXAMPLE_HEADING;

  return (
    <section
      className={cn("space-y-2", className)}
      data-mcp-example-origin={origin}
      data-mcp-tool-example=""
    >
      <h4 className="m-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {heading}
      </h4>

      <CodePanel data-mcp-example-code="">{formatExampleJson(value)}</CodePanel>
    </section>
  );
}
