export const LOCAL_COMPONENT_INTAKE_IMPORT_PATH = "@/components/ui";

export type UpstreamLibraryId = "shadcn-ui" | "magic-ui" | "performative-ui";

export type IntakeStatus = "approved" | "deferred";

export type ComponentIntakeDecision = {
  library: UpstreamLibraryId;
  status: IntakeStatus;
  components: string[];
  rationale: string;
};

export const COMPONENT_INTAKE_DECISIONS: readonly ComponentIntakeDecision[] = [
  {
    library: "shadcn-ui",
    status: "approved",
    components: [
      "Button",
      "ButtonLink",
      "Card",
      "CardDescription",
      "CardTitle",
    ],
    rationale:
      "These local shadcn-style primitives already back the shared shell and landing surfaces through the stable repo-local intake path.",
  },
  {
    library: "magic-ui",
    status: "deferred",
    components: [
      "animated spotlight and particle surfaces",
      "browser-observed marquee and motion-heavy wrappers",
    ],
    rationale:
      "Magic UI intake stays deferred until representative components are adapted for reduced-motion behavior and verified against the static-export deployment model.",
  },
  {
    library: "performative-ui",
    status: "deferred",
    components: [
      "browser-only visual treatment surfaces",
      "animation-first presentational wrappers",
    ],
    rationale:
      "Performative UI intake stays deferred until the current Next.js, Tailwind v4, React 19, and GitHub Pages stack can prove compatible local copies without request-time behavior or accessibility regressions.",
  },
] as const;

export const APPROVED_COMPONENT_INTAKE_DECISIONS =
  COMPONENT_INTAKE_DECISIONS.filter(
    (decision) => decision.status === "approved",
  );

export const DEFERRED_COMPONENT_INTAKE_DECISIONS =
  COMPONENT_INTAKE_DECISIONS.filter(
    (decision) => decision.status === "deferred",
  );

export function getComponentIntakeDecision(
  library: UpstreamLibraryId,
): ComponentIntakeDecision | undefined {
  return COMPONENT_INTAKE_DECISIONS.find(
    (decision) => decision.library === library,
  );
}
