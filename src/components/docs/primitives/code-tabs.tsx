"use client";

import { useId, useState } from "react";
import { CodeBlock } from "./code-block";

export type CodeTabPanel = {
  id: string;
  label: string;
  language: string;
  code: string;
};

type CodeTabsProps = {
  panels: CodeTabPanel[];
  label?: string;
};

export function CodeTabs({
  panels,
  label = "Code variant tabs",
}: CodeTabsProps) {
  const baseId = useId();
  const [activePanelId, setActivePanelId] = useState(panels[0]?.id ?? "");

  if (panels.length === 0) {
    return (
      <output className="docs-code-tabs__empty">
        No code variants are available.
      </output>
    );
  }

  const activePanel =
    panels.find((panel) => panel.id === activePanelId) ?? panels[0];

  return (
    <section aria-label={label} className="docs-code-tabs">
      <div
        aria-label={label}
        className="docs-code-tabs__tablist"
        role="tablist"
      >
        {panels.map((panel) => {
          const tabId = `${baseId}-tab-${panel.id}`;
          const panelId = `${baseId}-panel-${panel.id}`;
          const isSelected = panel.id === activePanel.id;

          return (
            <button
              aria-controls={panelId}
              aria-selected={isSelected}
              className="docs-code-tabs__tab"
              id={tabId}
              key={panel.id}
              onClick={() => setActivePanelId(panel.id)}
              role="tab"
              type="button"
            >
              {panel.label}
            </button>
          );
        })}
      </div>
      {panels.map((panel) => {
        const tabId = `${baseId}-tab-${panel.id}`;
        const panelId = `${baseId}-panel-${panel.id}`;
        const isSelected = panel.id === activePanel.id;

        return (
          <div
            aria-labelledby={tabId}
            className="docs-code-tabs__panel"
            hidden={!isSelected}
            id={panelId}
            key={panel.id}
            role="tabpanel"
            tabIndex={isSelected ? 0 : -1}
          >
            <CodeBlock code={panel.code} language={panel.language} />
          </div>
        );
      })}
    </section>
  );
}
