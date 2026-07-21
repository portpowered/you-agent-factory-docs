import { notFound } from "next/navigation";
import { ReferenceChromeHarness } from "@/features/references/harness/ReferenceChromeHarness";
import { ReferenceCliHarness } from "@/features/references/harness/ReferenceCliHarness";
import { ReferenceJavascriptHarness } from "@/features/references/harness/ReferenceJavascriptHarness";
import { ReferenceMcpHarness } from "@/features/references/harness/ReferenceMcpHarness";

export default function ReferenceChromeHarnessPage() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_COMPONENT_EXAMPLES !== "1"
  ) {
    notFound();
  }

  return (
    <>
      <ReferenceChromeHarness />
      <ReferenceCliHarness />
      <ReferenceMcpHarness />
      <ReferenceJavascriptHarness />
    </>
  );
}
