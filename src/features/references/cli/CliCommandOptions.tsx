/**
 * Flags and arguments tables for one published CLI command.
 *
 * Every cell is copied from the package contract. Nothing here derives a
 * default, a description, or a conflict the contract did not publish — an
 * unpublished cell renders as an em dash.
 */

import { ContractDescriptionProse } from "@/lib/i18n/contract-description-prose";
import type {
  CliArgumentNormalized,
  CliFlagNormalized,
} from "@/lib/references/family-normalized-models";

/** Placeholder for a cell the published contract left empty. */
const UNPUBLISHED_CELL = "—";

const TABLE_CLASS =
  "m-0 w-full border-collapse text-left text-sm [&_td]:border-t [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_th]:px-3 [&_th]:py-2 [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-muted-foreground";

/**
 * Flags declared on the command itself. Inherited flags are listed separately
 * so a command's own surface is not buried under the four global flags every
 * subcommand re-declares.
 */
export function cliLocalFlags(
  flags: readonly CliFlagNormalized[] | undefined,
): CliFlagNormalized[] {
  return (flags ?? []).filter((flag) => flag.scope !== "inherited");
}

/** Flags the command inherits from an ancestor command. */
export function cliInheritedFlags(
  flags: readonly CliFlagNormalized[] | undefined,
): CliFlagNormalized[] {
  return (flags ?? []).filter((flag) => flag.scope === "inherited");
}

/** Render a flag as it is typed: `--output, -o`. */
export function cliFlagInvocation(flag: CliFlagNormalized): string {
  return flag.shorthand !== undefined
    ? `--${flag.long}, -${flag.shorthand}`
    : `--${flag.long}`;
}

/**
 * Default worth printing. A boolean flag that defaults to `false` is just an
 * unset switch — printing it on 136 flags is noise, not information.
 */
function displayableDefault(flag: CliFlagNormalized): string | undefined {
  if (flag.defaultValue === undefined) {
    return undefined;
  }
  if (flag.valueType === "bool" && flag.defaultValue === "false") {
    return undefined;
  }
  return flag.defaultValue;
}

function ArgumentNotes({ argument }: { argument: CliArgumentNormalized }) {
  const notes: string[] = [];
  notes.push(argument.required ? "Required" : "Optional");
  if (argument.variadic) {
    notes.push("Repeatable");
  }
  if (argument.channels !== undefined && argument.channels.length > 0) {
    notes.push(`Reads from ${argument.channels.join(", ")}`);
  }
  if (argument.enumValues !== undefined && argument.enumValues.length > 0) {
    notes.push(`One of ${argument.enumValues.join(", ")}`);
  }
  return <>{notes.join(" · ")}</>;
}

export function CliCommandArguments({
  arguments: args,
}: {
  arguments: readonly CliArgumentNormalized[];
}) {
  if (args.length === 0) {
    return null;
  }

  return (
    <section className="space-y-2" data-cli-arguments="">
      <h4 className="m-0 text-sm font-semibold text-foreground">Arguments</h4>
      <div className="overflow-x-auto">
        <table className={TABLE_CLASS}>
          <thead>
            <tr>
              <th scope="col">Argument</th>
              <th scope="col">Type</th>
              <th scope="col">Notes</th>
            </tr>
          </thead>
          <tbody>
            {args.map((argument) => (
              <tr data-cli-argument={argument.name} key={argument.id}>
                <td className="whitespace-nowrap font-mono text-foreground">
                  {argument.variadic
                    ? `<${argument.name}…>`
                    : `<${argument.name}>`}
                </td>
                <td className="whitespace-nowrap font-mono text-muted-foreground">
                  {argument.valueType ?? UNPUBLISHED_CELL}
                </td>
                <td className="text-muted-foreground">
                  <ArgumentNotes argument={argument} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function CliCommandFlags({
  flags,
}: {
  flags: readonly CliFlagNormalized[];
}) {
  if (flags.length === 0) {
    return null;
  }

  const anyDefault = flags.some(
    (flag) => displayableDefault(flag) !== undefined,
  );

  return (
    <section className="space-y-2" data-cli-flags="">
      <h4 className="m-0 text-sm font-semibold text-foreground">Flags</h4>
      <div className="overflow-x-auto">
        <table className={TABLE_CLASS}>
          <thead>
            <tr>
              <th scope="col">Flag</th>
              <th scope="col">Type</th>
              {anyDefault ? <th scope="col">Default</th> : null}
              <th scope="col">Description</th>
            </tr>
          </thead>
          <tbody>
            {flags.map((flag) => {
              const defaultValue = displayableDefault(flag);
              return (
                <tr data-cli-flag={flag.long} key={flag.id}>
                  <td className="whitespace-nowrap font-mono text-foreground">
                    {cliFlagInvocation(flag)}
                    {flag.required ? (
                      <span className="ml-2 font-sans text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        required
                      </span>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap font-mono text-muted-foreground">
                    {flag.valueType ?? UNPUBLISHED_CELL}
                  </td>
                  {anyDefault ? (
                    <td className="whitespace-nowrap font-mono text-muted-foreground">
                      {defaultValue ?? UNPUBLISHED_CELL}
                    </td>
                  ) : null}
                  <td className="text-muted-foreground">
                    {flag.usage !== undefined ? (
                      <ContractDescriptionProse className="m-0">
                        {flag.usage}
                      </ContractDescriptionProse>
                    ) : (
                      UNPUBLISHED_CELL
                    )}
                    {flag.enumValues !== undefined &&
                    flag.enumValues.length > 0 ? (
                      <span className="mt-1 block font-mono text-xs">
                        {flag.enumValues.join(" | ")}
                      </span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/**
 * One-line pointer to the global flags a subcommand re-declares. They are
 * documented in full on the root `you` card, so repeating four identical rows
 * on 40 commands would only pad the page.
 */
export function CliInheritedFlagsNote({
  flags,
  rootAnchor,
}: {
  flags: readonly CliFlagNormalized[];
  rootAnchor?: string;
}) {
  if (flags.length === 0) {
    return null;
  }

  const names = flags.map((flag) => `--${flag.long}`);
  return (
    <p
      className="m-0 text-sm text-muted-foreground"
      data-cli-inherited-flags=""
    >
      Also accepts the global flags{" "}
      {names.map((name, index) => (
        <span key={name}>
          {index > 0 ? ", " : null}
          <code className="font-mono">{name}</code>
        </span>
      ))}
      {rootAnchor !== undefined ? (
        <>
          {" "}
          (see <a href={`#${rootAnchor}`}>you</a>).
        </>
      ) : (
        "."
      )}
    </p>
  );
}
