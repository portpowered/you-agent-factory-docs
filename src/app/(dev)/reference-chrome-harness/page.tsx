import { notFound } from "next/navigation";
import { ReferenceChromeHarness } from "@/components/references/harness/ReferenceChromeHarness";
import { ReferenceCliHarness } from "@/components/references/harness/ReferenceCliHarness";

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
    </>
  );
}
