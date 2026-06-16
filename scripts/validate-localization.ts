import { resolveDefaultLocaleCatalogForGate } from "@/lib/validation/gate-fixtures";
import {
  assertValidRegisteredMessageCatalogs,
  validateDefaultLocaleMessages,
} from "@/localization/lib/validate-messages";

const fixture = process.env.EARLY_GATE_VALIDATION_FIXTURE;

if (fixture === "broken-shell-localization") {
  const result = validateDefaultLocaleMessages(
    resolveDefaultLocaleCatalogForGate(),
  );
  if (!result.valid) {
    const details = result.issues
      .map((issue) => {
        const keyPrefix = issue.key ? `${issue.key}: ` : "";
        return `${keyPrefix}${issue.message}`;
      })
      .join("\n");
    throw new Error(`Shared shell message validation failed:\n${details}`);
  }
} else {
  assertValidRegisteredMessageCatalogs();
}

console.log("Localization validation passed");
