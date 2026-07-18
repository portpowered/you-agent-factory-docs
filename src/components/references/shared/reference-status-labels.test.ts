import { describe, expect, test } from "bun:test";
import {
  referenceFamilyLabel,
  referenceLifecycleStateLabel,
  referenceLifecycleSummary,
  referenceSourceArtifactLabel,
  referenceVisibilityLabel,
} from "./reference-status-labels";

describe("reference-status-labels", () => {
  test("labels families, lifecycle states, and visibility without inventing copy", () => {
    expect(referenceFamilyLabel("cli")).toBe("CLI");
    expect(referenceFamilyLabel("mcp")).toBe("MCP");
    expect(referenceFamilyLabel("javascript")).toBe("JavaScript");
    expect(referenceLifecycleStateLabel("active")).toBe("Active");
    expect(referenceLifecycleStateLabel("deprecated")).toBe("Deprecated");
    expect(referenceLifecycleStateLabel("removed")).toBe("Removed");
    expect(referenceVisibilityLabel("public")).toBe("Public");
    expect(referenceVisibilityLabel("internal")).toBe("Internal");
  });

  test("lifecycle summary includes only published optional fields", () => {
    expect(
      referenceLifecycleSummary({
        state: "active",
        since: "0.0.0",
      }),
    ).toBe("Active, since 0.0.0");

    expect(
      referenceLifecycleSummary({
        state: "deprecated",
        deprecated: "1.2.0",
        successorId: "cli.you.run",
      }),
    ).toBe("Deprecated, deprecated 1.2.0, successor cli.you.run");
  });

  test("source artifact label prefers path when published, otherwise pointer", () => {
    expect(
      referenceSourceArtifactLabel({
        publicArtifactId: "cli",
        pointer: "/commands/0",
        path: "generated/cli/commands.json",
      }),
    ).toBe("cli (generated/cli/commands.json)");

    expect(
      referenceSourceArtifactLabel({
        publicArtifactId: "@you-agent-factory/api/mcp",
        pointer: "/tools/0",
      }),
    ).toBe("@you-agent-factory/api/mcp @ /tools/0");
  });
});
