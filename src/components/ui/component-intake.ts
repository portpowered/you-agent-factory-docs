export const LOCAL_COMPONENT_INTAKE_IMPORT_PATH = "@/components/ui";

export type UpstreamLibraryId = "shadcn-ui" | "magic-ui" | "performative-ui";

export type IntakeStatus = "approved" | "deferred" | "mixed";

export type ComponentIntakeDecision = {
  approvedComponents: string[];
  deferredComponents: string[];
  library: UpstreamLibraryId;
  rationale: string;
  status: IntakeStatus;
};

export const COMPONENT_INTAKE_DECISIONS: readonly ComponentIntakeDecision[] = [
  {
    approvedComponents: [
      "Accordion",
      "AccordionContent",
      "AccordionItem",
      "AccordionTrigger",
      "Alert",
      "AlertDescription",
      "AlertTitle",
      "Button",
      "ButtonLink",
      "Card",
      "CardDescription",
      "CardTitle",
      "Dialog",
      "DialogClose",
      "DialogContent",
      "DialogDescription",
      "DialogFooter",
      "DialogHeader",
      "DialogTitle",
      "DialogTrigger",
      "Input",
      "Label",
      "Table",
      "TableBody",
      "TableCaption",
      "TableCell",
      "TableHead",
      "TableHeader",
      "TableRow",
      "Tabs",
      "TabsContent",
      "TabsList",
      "TabsTrigger",
    ],
    deferredComponents: [],
    library: "shadcn-ui",
    status: "approved",
    rationale:
      "These local shadcn-style primitives now cover shared actions, form controls, disclosure, navigation, overlay, table, and feedback patterns through the stable repo-local intake path.",
  },
  {
    approvedComponents: ["Marquee"],
    deferredComponents: ["Globe", "Particles", "VideoText"],
    library: "magic-ui",
    status: "mixed",
    rationale:
      "Magic UI intake now approves a local Marquee copy because it can run as a client-safe CSS animation with a reduced-motion fallback, while heavier browser-observed and media-backed surfaces stay deferred until they fit the static-export deployment model.",
  },
  {
    approvedComponents: ["GradientText"],
    deferredComponents: ["Aurora", "NodeGraphBackground", "WibblingSpinner"],
    library: "performative-ui",
    status: "mixed",
    rationale:
      "Performative UI now approves a local GradientText copy because it is a static-safe presentational accent, while browser-heavier animated backgrounds and spinners stay deferred until they can prove compatibility without accessibility regressions.",
  },
] as const;

export const APPROVED_COMPONENT_INTAKE_DECISIONS =
  COMPONENT_INTAKE_DECISIONS.filter(
    (decision) => decision.approvedComponents.length > 0,
  );

export const DEFERRED_COMPONENT_INTAKE_DECISIONS =
  COMPONENT_INTAKE_DECISIONS.filter(
    (decision) => decision.deferredComponents.length > 0,
  );

export function getComponentIntakeDecision(
  library: UpstreamLibraryId,
): ComponentIntakeDecision | undefined {
  return COMPONENT_INTAKE_DECISIONS.find(
    (decision) => decision.library === library,
  );
}
