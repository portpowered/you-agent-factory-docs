/**
 * Group published CLI commands into the families a reader navigates by.
 *
 * Pure transform over already-normalized projections. Both the rendered
 * inventory and the right-rail table of contents call this, so the headings on
 * the page and the links in the rail can never drift apart.
 */

import type { CliCommandNormalized } from "./family-normalized-models";
import { provisionalAnchorFromIdentity } from "./family-normalized-models";

/** Root command path every published command hangs off. */
const CLI_ROOT_PATH = "you";

export type CliCommandGroup = {
  /** Group identity — the shared command prefix (for example `you factory`). */
  path: string;
  /** Heading anchor. Prefixed so it cannot collide with a command anchor. */
  anchor: string;
  /** Commands in the group, parent command first, then alphabetical. */
  commands: readonly CliCommandNormalized[];
};

function commandSegments(commandPath: string): string[] {
  return commandPath.split(/\s+/).filter((segment) => segment.length > 0);
}

/**
 * Prefix a command would group under when its family is large enough to earn a
 * heading: the first two segments (`you factory list` → `you factory`). The
 * root command and single-segment commands have no such prefix.
 */
function candidateGroupPath(commandPath: string): string | undefined {
  const segments = commandSegments(commandPath);
  if (segments.length < 2) {
    return undefined;
  }
  return segments.slice(0, 2).join(" ");
}

/** Stable heading anchor for a group. */
export function cliCommandGroupAnchor(groupPath: string): string {
  return `commands-${provisionalAnchorFromIdentity(groupPath)}`;
}

/**
 * Split commands into navigable groups.
 *
 * A two-segment prefix earns its own group once at least two commands share it
 * — so `you factory` collects eleven commands while one-off top-level commands
 * such as `you run` stay in the root group instead of each spawning a heading
 * of one. Order is deterministic: the root group first, then groups
 * alphabetically; inside a group the family's own command leads.
 */
export function groupCliCommands(
  commands: readonly CliCommandNormalized[],
): CliCommandGroup[] {
  const familySizes = new Map<string, number>();
  for (const command of commands) {
    const candidate = candidateGroupPath(command.commandPath);
    if (candidate !== undefined) {
      familySizes.set(candidate, (familySizes.get(candidate) ?? 0) + 1);
    }
  }

  const byGroup = new Map<string, CliCommandNormalized[]>();
  for (const command of commands) {
    const candidate = candidateGroupPath(command.commandPath);
    const groupPath =
      candidate !== undefined && (familySizes.get(candidate) ?? 0) > 1
        ? candidate
        : CLI_ROOT_PATH;
    const bucket = byGroup.get(groupPath);
    if (bucket) {
      bucket.push(command);
    } else {
      byGroup.set(groupPath, [command]);
    }
  }

  const groupPaths = [...byGroup.keys()].sort((left, right) => {
    if (left === CLI_ROOT_PATH) {
      return right === CLI_ROOT_PATH ? 0 : -1;
    }
    if (right === CLI_ROOT_PATH) {
      return 1;
    }
    return left.localeCompare(right);
  });

  return groupPaths.map((groupPath) => ({
    path: groupPath,
    anchor: cliCommandGroupAnchor(groupPath),
    commands: (byGroup.get(groupPath) ?? []).slice().sort((left, right) => {
      // The family's own command leads its group; the rest read alphabetically.
      if (left.commandPath === groupPath) {
        return right.commandPath === groupPath ? 0 : -1;
      }
      if (right.commandPath === groupPath) {
        return 1;
      }
      return left.commandPath.localeCompare(right.commandPath);
    }),
  }));
}
