/**
 * Page-local NotesList for blog/comparing-orchestrators.
 * Messages-owned items; TeachingList from the public lists barrel only.
 */
import { TeachingList } from "@/features/teaching-ui/lists";
import en from "./messages/en.json";

export function ComparingOrchestratorsNotesList() {
  return (
    <TeachingList
      items={en.notes.items}
      listLabel={en.notes.listLabel}
      variant="plain"
    />
  );
}
