import Link from "next/link";
import { LocalizedLinkList } from "@/features/docs/components/LocalizedLinkList";
import { Section } from "@/features/docs/components/Section";
import { T } from "@/features/docs/components/T";
import { workersPageHref } from "@/lib/content/content-hrefs";
import { WorkerBaseSchemaEmbed } from "./WorkerBaseSchemaEmbed";

/** Factory WorkerType selection rows (mock workers stay separate). */
const FACTORY_WORKER_SELECTION_ROWS = [
  {
    href: workersPageHref("inference"),
    typeKey: "links.selectionInferenceType",
    whenKey: "links.selectionInferenceWhen",
    pageKey: "links.selectionInferencePage",
  },
  {
    href: workersPageHref("agent"),
    typeKey: "links.selectionAgentType",
    whenKey: "links.selectionAgentWhen",
    pageKey: "links.selectionAgentPage",
  },
  {
    href: workersPageHref("script"),
    typeKey: "links.selectionScriptType",
    whenKey: "links.selectionScriptWhen",
    pageKey: "links.selectionScriptPage",
  },
  {
    href: workersPageHref("poller"),
    typeKey: "links.selectionPollerType",
    whenKey: "links.selectionPollerWhen",
    pageKey: "links.selectionPollerPage",
  },
  {
    href: workersPageHref("model"),
    typeKey: "links.selectionModelType",
    whenKey: "links.selectionModelWhen",
    pageKey: "links.selectionModelPage",
  },
  {
    href: workersPageHref("hosted"),
    typeKey: "links.selectionHostedType",
    whenKey: "links.selectionHostedWhen",
    pageKey: "links.selectionHostedPage",
  },
] as const;

/**
 * Authored `/docs/workers` family index body: purpose lead (opening summary),
 * how-to-use, selection table, shared-field summary, live Worker schema embed,
 * and discovery links.
 */
export function WorkersFamilyIndexContent() {
  return (
    <div className="min-w-0 space-y-8" data-workers-family-index="">
      <Section id="how-to-use" titleKey="sections.howToUse.title">
        <T k="sections.howToUse.body" />
      </Section>

      <Section id="selection" titleKey="sections.selection.title">
        <T k="sections.selection.body" />
        <table data-workers-selection-table="">
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
            {FACTORY_WORKER_SELECTION_ROWS.map((row) => (
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
            <tr data-workers-selection-mock="">
              <td>
                <T k="links.selectionMockType" />
              </td>
              <td>
                <T k="links.selectionMockWhen" />
              </td>
              <td>
                <Link href={workersPageHref("mock")}>
                  <T k="links.selectionMockPage" />
                </Link>
              </td>
            </tr>
          </tbody>
        </table>
        <p>
          <T k="links.selectionMockNote" />
        </p>
      </Section>

      <Section id="shared-fields" titleKey="sections.sharedFields.title">
        <T k="sections.sharedFields.body" />
        <table data-workers-shared-fields-table="">
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
                <T k="links.sharedTypeField" />
              </td>
              <td>
                <T k="links.sharedTypeRole" />
              </td>
            </tr>
            <tr>
              <td>
                <T k="links.sharedBodyField" />
              </td>
              <td>
                <T k="links.sharedBodyRole" />
              </td>
            </tr>
            <tr>
              <td>
                <T k="links.sharedTimeoutField" />
              </td>
              <td>
                <T k="links.sharedTimeoutRole" />
              </td>
            </tr>
            <tr>
              <td>
                <T k="links.sharedResourcesField" />
              </td>
              <td>
                <T k="links.sharedResourcesRole" />
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Section id="worker-schema" titleKey="sections.workerSchema.title">
        <T k="sections.workerSchema.body" />
        <WorkerBaseSchemaEmbed />
        <LocalizedLinkList
          items={[
            {
              href: "/docs/references/factory-schema",
              labelKey: "links.fullFactorySchema",
            },
          ]}
        />
      </Section>

      <Section id="related" titleKey="sections.related.title">
        <LocalizedLinkList
          items={[
            {
              href: "/docs/workstations",
              labelKey: "links.siblingWorkstations",
            },
            {
              href: "/docs/factories/configuration",
              labelKey: "links.siblingConfiguration",
            },
            {
              href: "/docs/documentation/resources",
              labelKey: "links.siblingResources",
            },
          ]}
        />
      </Section>
    </div>
  );
}
