import { CodePanel } from "@/features/factory-ui/data-display";
import { CopyableReferenceAnchor } from "@/features/references/shared";
import { ContractDescriptionProse } from "@/lib/i18n/contract-description-prose";
import type { CliCommandNormalized } from "@/lib/references/family-normalized-models";
import { cn } from "@/lib/utils";
import { CliCapabilityNotice } from "./CliCapabilityNotice";
import { cliCommandHasStructuredOptions } from "./cli-capability";
import type { CliCommandReferenceProps } from "./types";

/**
 * Render one normalized CLI command with published help text.
 *
 * Card body keep-list: command-path header (with stable-anchor copy), short
 * description, long description when distinct, example when present, and the
 * Flags and arguments under-construction notice when structured options are absent.
 * Does not invent flags, arguments, defaults, or conflicts. Does not render
 * family/package/source badge chrome or duplicated identity / visibility /
 * runnable / handler metadata rows.
 */
export function CliCommandReference({
  command,
  chrome,
  className,
}: CliCommandReferenceProps) {
  const shortDescription = command.shortDescription ?? command.description;
  const longDescription =
    command.longDescription !== undefined &&
    command.longDescription !== shortDescription
      ? command.longDescription
      : undefined;
  const showCapabilityNotice = !cliCommandHasStructuredOptions(command);

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
          <h3 className="m-0 font-mono text-base font-semibold tracking-tight">
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
        {shortDescription !== undefined ? (
          <ContractDescriptionProse className="m-0 text-sm text-muted-foreground">
            {shortDescription}
          </ContractDescriptionProse>
        ) : null}
      </header>

      {longDescription !== undefined ? (
        <section className="space-y-1" data-cli-long-description="">
          <h4 className="m-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Long description
          </h4>
          <ContractDescriptionProse className="m-0 whitespace-pre-wrap text-sm text-foreground">
            {longDescription}
          </ContractDescriptionProse>
        </section>
      ) : null}

      {command.example !== undefined ? (
        <section className="space-y-1" data-cli-example="">
          <h4 className="m-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Example
          </h4>
          <CodePanel data-cli-example-code="">{command.example}</CodePanel>
        </section>
      ) : null}

      {showCapabilityNotice ? (
        <section className="space-y-2" data-cli-structured-options="">
          <h4 className="m-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Flags and arguments
          </h4>
          <CliCapabilityNotice />
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
