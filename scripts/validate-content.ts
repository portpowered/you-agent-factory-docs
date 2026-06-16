import { assertValidFoundationContentMetadata } from "@/lib/validation/foundation-content";
import { resolveFoundationContentMetadataForGate } from "@/lib/validation/gate-fixtures";

assertValidFoundationContentMetadata(resolveFoundationContentMetadataForGate());
console.log("Foundation content validation passed");
