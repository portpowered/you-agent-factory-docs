import Link from "next/link";
import { LocalizedLinkList } from "@/features/docs/components/LocalizedLinkList";
import { Section } from "@/features/docs/components/Section";
import { T } from "@/features/docs/components/T";
import { workstationsPageHref } from "@/lib/content/content-hrefs";
import { WorkstationBaseSchemaEmbed } from "./WorkstationBaseSchemaEmbed";

/** Factory WorkstationType selection rows. */
const WORKSTATION_TYPE_SELECTION_ROWS = [
  {
    href: workstationsPageHref("inference-run"),
    typeKey: "links.selectionInferenceRunType",
    whenKey: "links.selectionInferenceRunWhen",
    pageKey: "links.selectionInferenceRunPage",
  },
  {
    href: workstationsPageHref("agent-run"),
    typeKey: "links.selectionAgentRunType",
    whenKey: "links.selectionAgentRunWhen",
    pageKey: "links.selectionAgentRunPage",
  },
  {
    href: workstationsPageHref("script-run"),
    typeKey: "links.selectionScriptRunType",
    whenKey: "links.selectionScriptRunWhen",
    pageKey: "links.selectionScriptRunPage",
  },
  {
    href: workstationsPageHref("poller-run"),
    typeKey: "links.selectionPollerRunType",
    whenKey: "links.selectionPollerRunWhen",
    pageKey: "links.selectionPollerRunPage",
  },
  {
    href: workstationsPageHref("model-workstation"),
    typeKey: "links.selectionModelWorkstationType",
    whenKey: "links.selectionModelWorkstationWhen",
    pageKey: "links.selectionModelWorkstationPage",
  },
  {
    href: workstationsPageHref("model-invoke"),
    typeKey: "links.selectionModelInvokeType",
    whenKey: "links.selectionModelInvokeWhen",
    pageKey: "links.selectionModelInvokePage",
  },
  {
    href: workstationsPageHref("logical-move"),
    typeKey: "links.selectionLogicalMoveType",
    whenKey: "links.selectionLogicalMoveWhen",
    pageKey: "links.selectionLogicalMovePage",
  },
  {
    href: workstationsPageHref("classifier"),
    typeKey: "links.selectionClassifierType",
    whenKey: "links.selectionClassifierWhen",
    pageKey: "links.selectionClassifierPage",
  },
] as const;

/** Factory WorkstationKind (behavior) selection rows. */
const WORKSTATION_BEHAVIOR_SELECTION_ROWS = [
  {
    href: workstationsPageHref("standard"),
    behaviorKey: "links.selectionStandardBehavior",
    whenKey: "links.selectionStandardWhen",
    pageKey: "links.selectionStandardPage",
  },
  {
    href: workstationsPageHref("repeater"),
    behaviorKey: "links.selectionRepeaterBehavior",
    whenKey: "links.selectionRepeaterWhen",
    pageKey: "links.selectionRepeaterPage",
  },
  {
    href: workstationsPageHref("cron"),
    behaviorKey: "links.selectionCronBehavior",
    whenKey: "links.selectionCronWhen",
    pageKey: "links.selectionCronPage",
  },
  {
    href: workstationsPageHref("poller"),
    behaviorKey: "links.selectionPollerBehavior",
    whenKey: "links.selectionPollerWhen",
    pageKey: "links.selectionPollerPage",
  },
] as const;

/** Type rows for the type-versus-behavior compatibility matrix. */
const COMPATIBILITY_TYPE_ROWS = [
  {
    typeKey: "links.matrixInferenceRun",
    pageHref: workstationsPageHref("inference-run"),
  },
  {
    typeKey: "links.matrixAgentRun",
    pageHref: workstationsPageHref("agent-run"),
  },
  {
    typeKey: "links.matrixScriptRun",
    pageHref: workstationsPageHref("script-run"),
  },
  {
    typeKey: "links.matrixPollerRun",
    pageHref: workstationsPageHref("poller-run"),
  },
  {
    typeKey: "links.matrixModelWorkstation",
    pageHref: workstationsPageHref("model-workstation"),
  },
  {
    typeKey: "links.matrixModelInvoke",
    pageHref: workstationsPageHref("model-invoke"),
  },
  {
    typeKey: "links.matrixLogicalMove",
    pageHref: workstationsPageHref("logical-move"),
  },
  {
    typeKey: "links.matrixClassifier",
    pageHref: workstationsPageHref("classifier"),
  },
] as const;

const COMPATIBILITY_BEHAVIOR_COLUMNS = [
  {
    headerKey: "links.matrixStandardHeader",
    behaviorHref: workstationsPageHref("standard"),
  },
  {
    headerKey: "links.matrixRepeaterHeader",
    behaviorHref: workstationsPageHref("repeater"),
  },
  {
    headerKey: "links.matrixCronHeader",
    behaviorHref: workstationsPageHref("cron"),
  },
  {
    headerKey: "links.matrixPollerHeader",
    behaviorHref: workstationsPageHref("poller"),
  },
] as const;

/**
 * Authored `/docs/workstations` family index body: purpose lead (opening
 * summary), how-to-use, type and behavior selection, type-versus-behavior
 * compatibility matrix, shared-field summary, live Workstation schema embed,
 * and discovery links.
 */
export function WorkstationsFamilyIndexContent() {
  return (
    <div className="min-w-0 space-y-8" data-workstations-family-index="">
      <Section id="how-to-use" titleKey="sections.howToUse.title">
        <T k="sections.howToUse.body" />
      </Section>

      <Section id="select-type" titleKey="sections.selectType.title">
        <T k="sections.selectType.body" />
        <table data-workstations-type-selection-table="">
          <thead>
            <tr>
              <th>
                <T k="links.selectionTypeHeader" />
              </th>
              <th>
                <T k="links.selectionWhenHeader" />
              </th>
              <th>
                <T k="links.selectionPageHeader" />
              </th>
            </tr>
          </thead>
          <tbody>
            {WORKSTATION_TYPE_SELECTION_ROWS.map((row) => (
              <tr key={row.href}>
                <td>
                  <T k={row.typeKey} />
                </td>
                <td>
                  <T k={row.whenKey} />
                </td>
                <td>
                  <Link href={row.href}>
                    <T k={row.pageKey} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section id="select-behavior" titleKey="sections.selectBehavior.title">
        <T k="sections.selectBehavior.body" />
        <table data-workstations-behavior-selection-table="">
          <thead>
            <tr>
              <th>
                <T k="links.selectionBehaviorHeader" />
              </th>
              <th>
                <T k="links.selectionWhenHeader" />
              </th>
              <th>
                <T k="links.selectionPageHeader" />
              </th>
            </tr>
          </thead>
          <tbody>
            {WORKSTATION_BEHAVIOR_SELECTION_ROWS.map((row) => (
              <tr key={row.href}>
                <td>
                  <T k={row.behaviorKey} />
                </td>
                <td>
                  <T k={row.whenKey} />
                </td>
                <td>
                  <Link href={row.href}>
                    <T k={row.pageKey} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p data-workstations-poller-axes-note="">
          <T k="links.pollerAxesNote" />
        </p>
      </Section>

      <Section
        id="type-behavior-matrix"
        titleKey="sections.typeBehaviorMatrix.title"
      >
        <T k="sections.typeBehaviorMatrix.body" />
        <table data-workstations-compatibility-matrix="">
          <thead>
            <tr>
              <th>
                <T k="links.matrixTypeHeader" />
              </th>
              {COMPATIBILITY_BEHAVIOR_COLUMNS.map((column) => (
                <th key={column.headerKey}>
                  <Link href={column.behaviorHref}>
                    <T k={column.headerKey} />
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPATIBILITY_TYPE_ROWS.map((row) => (
              <tr key={row.pageHref}>
                <td>
                  <Link href={row.pageHref}>
                    <T k={row.typeKey} />
                  </Link>
                </td>
                {COMPATIBILITY_BEHAVIOR_COLUMNS.map((column) => (
                  <td key={`${row.pageHref}:${column.headerKey}`}>
                    <T k="links.matrixCompatible" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section id="shared-fields" titleKey="sections.sharedFields.title">
        <T k="sections.sharedFields.body" />
        <table data-workstations-shared-fields-table="">
          <thead>
            <tr>
              <th>
                <T k="links.sharedFieldHeader" />
              </th>
              <th>
                <T k="links.sharedRoleHeader" />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <T k="links.sharedNameField" />
              </td>
              <td>
                <T k="links.sharedNameRole" />
              </td>
            </tr>
            <tr>
              <td>
                <T k="links.sharedWorkerField" />
              </td>
              <td>
                <T k="links.sharedWorkerRole" />
              </td>
            </tr>
            <tr>
              <td>
                <T k="links.sharedInputsField" />
              </td>
              <td>
                <T k="links.sharedInputsRole" />
              </td>
            </tr>
            <tr>
              <td>
                <T k="links.sharedTypeField" />
              </td>
              <td>
                <T k="links.sharedTypeRole" />
              </td>
            </tr>
            <tr>
              <td>
                <T k="links.sharedBehaviorField" />
              </td>
              <td>
                <T k="links.sharedBehaviorRole" />
              </td>
            </tr>
            <tr>
              <td>
                <T k="links.sharedOutputsField" />
              </td>
              <td>
                <T k="links.sharedOutputsRole" />
              </td>
            </tr>
            <tr>
              <td>
                <T k="links.sharedOnFailureField" />
              </td>
              <td>
                <T k="links.sharedOnFailureRole" />
              </td>
            </tr>
            <tr>
              <td>
                <T k="links.sharedLimitsField" />
              </td>
              <td>
                <T k="links.sharedLimitsRole" />
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Section
        id="workstation-schema"
        titleKey="sections.workstationSchema.title"
      >
        <T k="sections.workstationSchema.body" />
        <WorkstationBaseSchemaEmbed />
        <LocalizedLinkList
          items={[
            {
              href: "/docs/references/factory-schema",
              labelKey: "links.fullFactorySchema",
            },
          ]}
        />
      </Section>
    </div>
  );
}
