import { CodePanel } from "@/features/factory-ui/data-display";
import { CopyableReferenceAnchor } from "@/features/references/shared";
import { ContractDescriptionProse } from "@/lib/i18n/contract-description-prose";
import type { CliCommandNormalized } from "@/lib/references/family-normalized-models";
import { cn } from "@/lib/utils";
import {
  CliCommandArguments,
  CliCommandFlags,
  CliInheritedFlagsNote,
  cliInheritedFlags,
  cliLocalFlags,
} from "./CliCommandOptions";
import { splitCliCommandDescription } from "./cli-command-description";
import type { CliCommandReferenceProps } from "./types";

/**
 * Render one normalized CLI command as it reads in `--help`.
 *
 * Card body: command-path header (with stable-anchor copy), the published
 * description once, positional arguments, the command's own flags, a pointer to
 * the inherited global flags, and the published example. Every value comes from
 * the package contract — this card never invents a flag, default, or conflict,
 * and never renders family/package/source badge chrome or duplicated identity
 * metadata rows.
 */
export function CliCommandReference({
  command,
  chrome,
  className,
  rootAnchor,
}: CliCommandReferenceProps) {
  const { summary, detail } = splitCliCommandDescription(command);
  const localFlags = cliLocalFlags(command.flags);
  const inheritedFlags = cliInheritedFlags(command.flags);

  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-md border border-border bg-background px-4 py-4",
        className,
      )}
      data-cli-command-id={command.id}
      data-cli-command-path={command.commandPath}
      data-cli-command-reference=""
      id={command.anchor}
    >
      <header className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="m-0 font-mono text-lg font-semibold tracking-tight">
            <a
              className="text-foreground no-underline hover:underline"
              href={`#${command.anchor}`}
            >
              {command.commandPath}
            </a>
          </h3>
          <CopyableReferenceAnchor
            anchor={command.anchor}
            chrome={chrome}
            family="cli"
          />
        </div>
        {summary !== undefined ? (
          <ContractDescriptionProse className="m-0 text-sm text-muted-foreground">
            {summary}
          </ContractDescriptionProse>
        ) : null}
      </header>

      {detail !== undefined ? (
        <ContractDescriptionProse
          className="m-0 whitespace-pre-wrap text-sm text-foreground"
          data-cli-long-description=""
        >
          {detail}
        </ContractDescriptionProse>
      ) : null}

      {command.arguments !== undefined ? (
        <CliCommandArguments arguments={command.arguments} />
      ) : null}

      <CliCommandFlags flags={localFlags} />

      <CliInheritedFlagsNote flags={inheritedFlags} rootAnchor={rootAnchor} />

      {command.example !== undefined ? (
        <section className="space-y-2" data-cli-example="">
          <h4 className="m-0 text-sm font-semibold text-foreground">Example</h4>
          <CodePanel data-cli-example-code="">{command.example}</CodePanel>
        </section>
      ) : null}
    </article>
  );
}

/** Pure helper for tests: list identity keys rendered from a command list. */
export function cliCommandInventoryIdentities(
  commands: readonly CliCommandNormalized[],
): string[] {
  return commands.map((command) => command.commandPath);
}
