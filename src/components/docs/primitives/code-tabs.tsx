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

function getPanelIndex(panels: CodeTabPanel[], panelId: string): number {
  const index = panels.findIndex((panel) => panel.id === panelId);
  return index === -1 ? 0 : index;
}

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

  const activeIndex = getPanelIndex(panels, activePanelId);
  const activePanel = panels[activeIndex] ?? panels[0];

  const focusTab = (panelId: string) => {
    const tab = document.getElementById(`${baseId}-tab-${panelId}`);
    tab?.focus();
  };

  const selectPanel = (panelId: string) => {
    setActivePanelId(panelId);
  };

  const moveToPanelIndex = (nextIndex: number) => {
    const panel = panels[nextIndex];
    if (!panel) {
      return;
    }

    selectPanel(panel.id);
    focusTab(panel.id);
  };

  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown": {
        event.preventDefault();
        moveToPanelIndex((currentIndex + 1) % panels.length);
        break;
      }
      case "ArrowLeft":
      case "ArrowUp": {
        event.preventDefault();
        moveToPanelIndex((currentIndex - 1 + panels.length) % panels.length);
        break;
      }
      case "Home": {
        event.preventDefault();
        moveToPanelIndex(0);
        break;
      }
      case "End": {
        event.preventDefault();
        moveToPanelIndex(panels.length - 1);
        break;
      }
      default:
        break;
    }
  };

  return (
    <section className="docs-code-tabs">
      <div
        aria-label={label}
        className="docs-code-tabs__tablist"
        role="tablist"
      >
        {panels.map((panel, index) => {
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
              onClick={() => selectPanel(panel.id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              role="tab"
              tabIndex={isSelected ? 0 : -1}
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
          >
            <CodeBlock code={panel.code} language={panel.language} />
          </div>
        );
      })}
    </section>
  );
}
