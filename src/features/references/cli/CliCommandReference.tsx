import { CodePanel } from "@/features/factory-ui/data-display";
import { CopyableReferenceAnchor } from "@/features/references/shared";
import { ContractDescriptionProse } from "@/lib/i18n/contract-description-prose";
import type { CliCommandNormalized } from "@/lib/references/family-normalized-models";
import { cn } from "@/lib/utils";
import {
  CliCommandArguments,
  CliCommandFlags,
  cliLocalFlags,
} from "./CliCommandOptions";
import { splitCliCommandDescription } from "./cli-command-description";
import type { CliCommandReferenceProps } from "./types";

/**
 * Render one normalized CLI command as it reads in `--help`.
 *
 * Card body: command-path header (with stable-anchor copy), the published
 * description once, positional arguments, the command's own flags, and the
 * published example. Every value comes from the package contract — this card
 * never invents a flag, default, or conflict, and never renders
 * family/package/source badge chrome or duplicated identity metadata rows.
 *
 * The four global flags every subcommand re-declares are documented once on the
 * root `you` card; repeating them per command is noise, so inherited flags are
 * excluded here entirely.
 */
export function CliCommandReference({
  command,
  chrome,
  className,
}: CliCommandReferenceProps) {
  const { summary, detail } = splitCliCommandDescription(command);
  const localFlags = cliLocalFlags(command.flags);

  return (
    <article
      className={cn(
        "flex scroll-mt-24 flex-col gap-6 rounded-lg border border-border bg-background px-5 py-5",
        className,
      )}
      data-cli-command-id={command.id}
      data-cli-command-path={command.commandPath}
      data-cli-command-reference=""
      id={command.anchor}
    >
      <header className="flex flex-col gap-2">
        {/* Heading and anchor share a centre line — top-aligning them leaves the
            heading's taller line box sitting visibly below the copy control. */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <h3 className="m-0 font-mono text-2xl font-bold leading-tight tracking-tight">
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
          <ContractDescriptionProse className="m-0 text-base text-muted-foreground">
            {summary}
          </ContractDescriptionProse>
        ) : null}
      </header>

      {detail !== undefined ? (
        <ContractDescriptionProse
          className="m-0 whitespace-pre-wrap text-sm leading-relaxed text-foreground"
          data-cli-long-description=""
        >
          {detail}
        </ContractDescriptionProse>
      ) : null}

      {command.arguments !== undefined ? (
        <CliCommandArguments arguments={command.arguments} />
      ) : null}

      <CliCommandFlags flags={localFlags} />

      {command.example !== undefined ? (
        <section className="flex flex-col gap-3" data-cli-example="">
          <h4 className="m-0 text-base font-bold tracking-tight text-foreground">
            Example
          </h4>
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
