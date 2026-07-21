"use client";

import { MissingMessageKey } from "@/features/docs/components/MissingMessageKey";
import { usePageMessages } from "@/features/docs/components/page-messages-context";
import {
  TeachingList,
  type TeachingListItem,
} from "@/features/teaching-ui/lists";
import { lookupMessage } from "@/lib/content/messages";

/**
 * Soft-wires public TeachingList for the PatternList slot.
 * Item titles/descriptions and listLabel come from colocated page messages.
 */
const PATTERN_ITEM_SPECS = [
  {
    id: "larger-planner",
    titleKey: "links.patternLargerPlannerTitle",
    descriptionKey: "links.patternLargerPlannerDescription",
  },
  {
    id: "smaller-executor",
    titleKey: "links.patternSmallerExecutorTitle",
    descriptionKey: "links.patternSmallerExecutorDescription",
  },
  {
    id: "same-roles",
    titleKey: "links.patternSameRolesTitle",
    descriptionKey: "links.patternSameRolesDescription",
  },
] as const;

export function PatternListTeachingList() {
  const { messages, isDev } = usePageMessages();
  const listLabelResult = lookupMessage(messages, "links.patternListLabel");

  if (!listLabelResult.ok) {
    if (isDev) {
      return (
        <MissingMessageKey
          messageKey="links.patternListLabel"
          reason={listLabelResult.reason}
        />
      );
    }
    return null;
  }

  const items: TeachingListItem[] = [];
  for (const spec of PATTERN_ITEM_SPECS) {
    const titleResult = lookupMessage(messages, spec.titleKey);
    if (!titleResult.ok) {
      if (isDev) {
        return (
          <MissingMessageKey
            messageKey={spec.titleKey}
            reason={titleResult.reason}
          />
        );
      }
      return null;
    }

    const descriptionResult = lookupMessage(messages, spec.descriptionKey);
    items.push({
      id: spec.id,
      title: titleResult.value,
      description: descriptionResult.ok ? descriptionResult.value : undefined,
    });
  }

  return <TeachingList items={items} listLabel={listLabelResult.value} />;
}
