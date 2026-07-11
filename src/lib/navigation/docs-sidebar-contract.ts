import type * as PageTree from "fumadocs-core/page-tree";
import type { Node } from "fumadocs-core/page-tree";

/** Factory concept page used by reader-facing sidebar / a11y contracts. */
export const TOKENS_CONCEPT_URL = "/docs/concepts/tokens";
export const HARNESS_CONCEPT_URL = "/docs/concepts/harness";
export const RALPH_TECHNIQUE_URL = "/docs/techniques/ralph";
export const GETTING_STARTED_GUIDE_URL = "/docs/guides/getting-started";
export const INSTALL_DOCS_URL = "/docs/documentation/install";
/** Top-level explorer FAQ entry; content stays on the documentation route. */
export const FAQ_DOCS_URL = "/docs/documentation/faq";

/** @deprecated Atlas glossary URL retained for soft-skip built-HTML fixtures. */
export const TOKEN_GLOSSARY_URL = "/docs/glossary/token";
/** @deprecated Atlas model URL retained for soft-skip built-HTML fixtures. */
export const GPT_3_MODEL_URL = "/docs/models/gpt-3";
/** @deprecated Atlas paper URL retained for soft-skip built-HTML fixtures. */
export const DEEPSEEK_V4_PAPER_URL = "/docs/papers/deepseek-v4";
/** @deprecated Atlas module URL retained for soft-skip built-HTML fixtures. */
export const GROUPED_QUERY_ATTENTION_URL =
  "/docs/modules/grouped-query-attention";
/** @deprecated Atlas concept URL retained for soft-skip built-HTML fixtures. */
export const WHY_LONG_CONTEXT_IS_HARD_URL =
  "/docs/concepts/why-long-context-is-hard";
/** @deprecated Atlas training URL retained for soft-skip built-HTML fixtures. */
export const DPO_TRAINING_URL = "/docs/training/dpo";
/** @deprecated Atlas system URL retained for soft-skip built-HTML fixtures. */
export const ROUTING_SYSTEM_URL = "/docs/systems/routing";

/** Copy shown only by the legacy DocsShell placeholder sidebar. */
export const PLACEHOLDER_SIDEBAR_DESCRIPTION =
  "Browse modules, concepts, and tags.";

export type SidebarPageLink = {
  name: string;
  url: string;
};

export function collectSidebarPageLinks(
  nodes: Node[] | PageTree.Root,
): SidebarPageLink[] {
  const children = Array.isArray(nodes) ? nodes : nodes.children;
  const links: SidebarPageLink[] = [];

  for (const node of children) {
    if (
      node.type === "page" &&
      "url" in node &&
      typeof node.url === "string" &&
      typeof node.name === "string"
    ) {
      links.push({ name: node.name, url: node.url });
    }
    if (node.type === "folder" && "children" in node) {
      links.push(...collectSidebarPageLinks(node.children));
    }
  }

  return links;
}

export function findSidebarPageLink(
  links: SidebarPageLink[],
  url: string,
): SidebarPageLink | undefined {
  return links.find((link) => link.url === url);
}

/** Removes embedded payloads so placeholder UI copy in messages JSON does not false-fail HTML checks. */
export function stripHtmlScripts(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, "");
}

export function extractNdSidebarHtml(html: string): string {
  const sidebarStart = html.indexOf('id="nd-sidebar"');
  if (sidebarStart < 0) {
    return "";
  }

  const pageStart = html.indexOf('id="nd-page"', sidebarStart);
  const searchEnd = pageStart > sidebarStart ? pageStart : html.length;
  return html.slice(sidebarStart, searchEnd);
}

export function hasLegacyPlaceholderSidebar(html: string): boolean {
  return (
    html.includes('aria-label="Docs sidebar"') &&
    html.includes(PLACEHOLDER_SIDEBAR_DESCRIPTION)
  );
}
