import {
  AlertPanel,
  AlertPanelText,
  AlertPanelTitle,
} from "@you-agent-factory/components/feedback";
import { CodePanel } from "@/features/factory-ui/data-display";
import type { McpToolExampleOrigin } from "@/lib/references/mcp-example-generation";
import { cn } from "@/lib/utils";
import {
  MCP_AUTHORED_EXAMPLE_HEADING,
  MCP_GENERATED_EXAMPLE_DESCRIPTION,
  MCP_GENERATED_EXAMPLE_HEADING,
  MCP_GENERATED_EXAMPLE_TITLE,
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
 * Render one MCP tool input example. Generated illustrations show an explicit
 * visible notice; authored contract examples are not labeled generated.
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

      {origin === "generated" ? (
        <AlertPanel
          compact
          data-mcp-example-generated-notice=""
          semantic="info"
        >
          <AlertPanelTitle>{MCP_GENERATED_EXAMPLE_TITLE}</AlertPanelTitle>
          <AlertPanelText>{MCP_GENERATED_EXAMPLE_DESCRIPTION}</AlertPanelText>
        </AlertPanel>
      ) : null}

      <CodePanel data-mcp-example-code="">{formatExampleJson(value)}</CodePanel>
    </section>
  );
}
