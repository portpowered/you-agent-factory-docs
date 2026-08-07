/**
 * Page-local right-rail table of contents for `/docs/references/cli`.
 *
 * The page body is one generated inventory rather than authored `<Section>`
 * elements, so the generic `<Section>` scanner has nothing to find. This module
 * builds the rail from the same grouping helper the inventory renders with, so
 * every rail link resolves to a heading that is actually on the page.
 *
 * Server-only — resolves the package CLI contract at build/static-render time.
 */

import type { TOCItemType } from "fumadocs-core/toc";
import { assignCliCommandRegistryAnchors } from "@/lib/references/assign-family-reference-anchors";
import { groupCliCommands } from "@/lib/references/cli-command-groups";
import { loadCliReferenceInventory } from "@/lib/references/load-cli-reference-inventory";

/** Group headings sit at the page's top rail level; commands nest under them. */
const CLI_GROUP_TOC_DEPTH = 2;
const CLI_COMMAND_TOC_DEPTH = 3;

export function buildPageToc(): TOCItemType[] {
  const inventory = loadCliReferenceInventory();
  if (inventory.state !== "success") {
    return [];
  }

  const commands = assignCliCommandRegistryAnchors(inventory.commands).commands;
  const toc: TOCItemType[] = [];

  for (const group of groupCliCommands(commands)) {
    toc.push({
      title: group.path,
      url: `#${group.anchor}`,
      depth: CLI_GROUP_TOC_DEPTH,
    });
    for (const command of group.commands) {
      toc.push({
        title: command.commandPath,
        url: `#${command.anchor}`,
        depth: CLI_COMMAND_TOC_DEPTH,
      });
    }
  }

  return toc;
}
