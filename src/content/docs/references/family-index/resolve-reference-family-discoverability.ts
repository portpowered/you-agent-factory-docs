import type { PageMessages } from "@/lib/content/schemas";
import {
  REFERENCE_FAMILY_DISCOVERABILITY_ROUTES,
  type ReferenceFamilyDiscoverabilityRoute,
} from "./reference-family-routes";

export type ReferenceFamilyDiscoverabilityCard = {
  id: ReferenceFamilyDiscoverabilityRoute["id"];
  href: ReferenceFamilyDiscoverabilityRoute["href"];
  title: string;
  description: string;
};

/**
 * Resolves authored discoverability cards from page-local messages + the
 * stable planned route table. Labels/descriptions come from message sections
 * keyed by route id; hrefs stay on the planned `/docs/references/...` paths
 * even when sibling page bodies are not published yet.
 */
export function resolveReferenceFamilyDiscoverabilityCards(
  messages: PageMessages,
): ReferenceFamilyDiscoverabilityCard[] {
  return REFERENCE_FAMILY_DISCOVERABILITY_ROUTES.map((route) => {
    const section = messages.sections?.[route.id];
    if (!section?.title || !section.body) {
      throw new Error(
        `References family index messages must define sections.${route.id} with title and body for discoverability`,
      );
    }

    return {
      id: route.id,
      href: route.href,
      title: section.title,
      description: section.body,
    };
  });
}
