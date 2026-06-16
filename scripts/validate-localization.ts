import { resolveShellLocalizationCopyForGate } from "@/lib/validation/gate-fixtures";
import { assertValidShellLocalizationCopy } from "@/lib/validation/shell-localization";

assertValidShellLocalizationCopy(resolveShellLocalizationCopyForGate());
console.log("Shell localization validation passed");
