import {
  CliCommandInventory,
  type CliCommandInventoryInput,
} from "@/components/references/cli";
import type { CliCommandNormalized } from "@/lib/references/family-normalized-models";

const fixtureCommands: CliCommandNormalized[] = [
  {
    id: "you",
    name: "you",
    commandPath: "you",
    aliases: [],
    description: "Run and manage CPN-based workflow factories",
    shortDescription: "Run and manage CPN-based workflow factories",
    longDescription:
      "Run and manage CPN-based workflow factories.\n\nUse you docs agents for orientation.",
    example:
      "  you run --work ./docs/examples/startup-work.json\n  you docs agents",
    visibility: "visible",
    runnable: true,
    handlerPresent: true,
    lifecycle: { state: "active" },
    source: {
      publicArtifactId: "@you-agent-factory/api/cli",
      pointer: "/commands/0",
      path: "generated/cli/commands.json",
    },
    anchor: "you",
  },
  {
    id: "you.config.init",
    name: "init",
    commandPath: "you config init",
    aliases: [],
    description: "Create operator/system config on a fresh home",
    shortDescription: "Create operator/system config on a fresh home",
    visibility: "visible",
    runnable: true,
    handlerPresent: true,
    lifecycle: { state: "active" },
    source: {
      publicArtifactId: "@you-agent-factory/api/cli",
      pointer: "/commands/2",
      path: "generated/cli/commands.json",
    },
    anchor: "you-config-init",
  },
  {
    id: "you.mcp",
    name: "mcp",
    commandPath: "you mcp",
    aliases: [],
    description: "Model Context Protocol servers for Factory Session tools",
    shortDescription:
      "Model Context Protocol servers for Factory Session tools",
    visibility: "visible",
    runnable: false,
    handlerPresent: false,
    lifecycle: { state: "active" },
    source: {
      publicArtifactId: "@you-agent-factory/api/cli",
      pointer: "/commands/3",
      path: "generated/cli/commands.json",
    },
    anchor: "you-mcp",
  },
  {
    id: "you.legacy",
    name: "legacy",
    commandPath: "you legacy",
    aliases: ["old"],
    description: "Deprecated legacy helper retained for migration",
    shortDescription: "Deprecated legacy helper retained for migration",
    visibility: "internal",
    runnable: false,
    handlerPresent: false,
    lifecycle: { state: "deprecated", deprecated: "0.0.0" },
    source: {
      publicArtifactId: "@you-agent-factory/api/cli",
      pointer: "/commands/99",
      path: "generated/cli/commands.json",
    },
    anchor: "you-legacy",
  },
];

const successInventory: CliCommandInventoryInput = {
  state: "success",
  commands: fixtureCommands,
  packageVersion: "0.0.0",
};

/**
 * Dev-only fixture mount for W10 CLI command reference renderers.
 * Passes already-normalized projections — no W03 Node acquisition in the
 * browser bundle. Final `/docs/references/cli` stays out of scope for W10.
 */
export function ReferenceCliHarness() {
  return (
    <div
      className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-10"
      data-reference-cli-harness=""
    >
      <header className="space-y-2 border-b border-border pb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Dev-only CLI reference harness
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          W10 CLI command reference from package contract projections
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Fixture mount for CliCommandReference / CliCommandInventory using
          W04-shaped normalized commands. Not a production reference route.
        </p>
      </header>

      <section className="space-y-3" data-harness-section="cli-inventory">
        <h2 className="text-lg font-semibold">CliCommandInventory (success)</h2>
        <CliCommandInventory inventory={successInventory} />
      </section>

      <section className="space-y-3" data-harness-section="cli-empty">
        <h2 className="text-lg font-semibold">Empty inventory</h2>
        <CliCommandInventory inventory={{ state: "empty" }} />
      </section>

      <section className="space-y-3" data-harness-section="cli-error">
        <h2 className="text-lg font-semibold">Malformed inventory</h2>
        <CliCommandInventory
          inventory={{
            state: "error",
            detail:
              'Malformed CLI artifact: field "commands" must be an array.',
          }}
        />
      </section>
    </div>
  );
}
