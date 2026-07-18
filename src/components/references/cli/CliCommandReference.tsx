import { ContractSourceBadge } from "@/components/references/shared";
import { CodePanel } from "@/features/factory-ui/data-display";
import type { CliCommandNormalized } from "@/lib/references/family-normalized-models";
import { cn } from "@/lib/utils";
import { CliCapabilityNotice } from "./CliCapabilityNotice";
import { cliCommandHasStructuredOptions } from "./cli-capability";
import {
  cliVisibilityDisplayLabel,
  mapCliVisibilityToReferenceVisibility,
} from "./cli-visibility";
import type { CliCommandReferenceProps } from "./types";

function booleanStateLabel(value: boolean): string {
  return value ? "Yes" : "No";
}

/**
 * Render one normalized CLI command with available published metadata.
 *
 * Does not invent flags, arguments, defaults, or conflicts. Optional fields
 * stay absent when the projection omitted them. When structured
 * flags/arguments are unavailable, shows CliCapabilityNotice.
 */
export function CliCommandReference({
  command,
  packageVersion,
  className,
}: CliCommandReferenceProps) {
  const sharedVisibility = mapCliVisibilityToReferenceVisibility(
    command.visibility,
  );
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
        <h3 className="m-0 font-mono text-base font-semibold tracking-tight">
          <a
            className="text-foreground no-underline hover:underline"
            href={`#${command.anchor}`}
          >
            {command.commandPath}
          </a>
        </h3>
        {shortDescription !== undefined ? (
          <p className="m-0 text-sm text-muted-foreground">
            {shortDescription}
          </p>
        ) : null}
      </header>

      <ContractSourceBadge
        family="cli"
        lifecycle={command.lifecycle}
        packageVersion={packageVersion}
        source={command.source}
        visibility={sharedVisibility}
      />

      <dl className="m-0 grid gap-2 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-4">
        <MetadataRow label="Command path" value={command.commandPath} mono />
        <MetadataRow label="Leaf name" value={command.name} mono />
        {command.aliases.length > 0 ? (
          <MetadataRow
            label="Aliases"
            value={command.aliases.join(", ")}
            mono
          />
        ) : null}
        {command.visibility !== undefined ? (
          <MetadataRow
            label="Visibility"
            value={cliVisibilityDisplayLabel(command.visibility)}
          />
        ) : null}
        {command.runnable !== undefined ? (
          <MetadataRow
            label="Runnable"
            value={booleanStateLabel(command.runnable)}
          />
        ) : null}
        {command.handlerPresent !== undefined ? (
          <MetadataRow
            label="Handler present"
            value={booleanStateLabel(command.handlerPresent)}
          />
        ) : null}
      </dl>

      {longDescription !== undefined ? (
        <section className="space-y-1" data-cli-long-description="">
          <h4 className="m-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Long description
          </h4>
          <p className="m-0 whitespace-pre-wrap text-sm text-foreground">
            {longDescription}
          </p>
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

/** Pure helper for tests: list identity keys rendered from a command list. */
export function cliCommandInventoryIdentities(
  commands: readonly CliCommandNormalized[],
): string[] {
  return commands.map((command) => command.commandPath);
}
