import { join } from "node:path";
import { loadStarterContentRecords } from "@/lib/content/load-starter-content";
import {
  type StarterContentValidationFailure,
  validateStarterContent,
} from "@/lib/content/starter";
import { assertStarterContentValid } from "@/lib/content/starter-content-errors";
import { resolveStarterContentDescriptorForGate } from "@/lib/validation/gate-fixtures";

const fixtureDescriptor = resolveStarterContentDescriptorForGate();
if (fixtureDescriptor) {
  const result = validateStarterContent(fixtureDescriptor);
  if (!result.ok) {
    const failures: StarterContentValidationFailure[] = [result];
    assertStarterContentValid(failures);
  }
}

const contentRoot = join(import.meta.dir, "../src/content");
const { failures } = loadStarterContentRecords(contentRoot);
assertStarterContentValid(failures);

console.log("Content validation passed");
