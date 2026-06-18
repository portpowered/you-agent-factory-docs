# Customer and System Goals

## 1. Problem Statement

Engineering teams increasingly want to use AI agents for recurring development work, but they still lack a clear way to design, run, compare, document, and improve reusable agent workflows.

Customers commonly need help with:

1. using agents more consistently, not only one-off
2. learning orchestration patterns and approval-loop design
3. comparing orchestrators with a neutral, engineering-native frame
4. finding documentation that explains operating models and tradeoffs clearly
5. making workflows reliable through validation, review, logging, replay, and cost control
6. finding examples, support material, and references in one place

## 2. Product Goal

Build the You Agent Factory website as the public documentation, learning, and product-marketing site for You Agent Factory.

The site should help users:

* understand what You Agent Factory is
* understand why agent orchestration matters
* install and run You Agent Factory
* learn orchestration concepts and patterns
* compare You Agent Factory to adjacent tools
* inspect practical workflows, configuration, and best practices
* navigate content effectively as both humans and AI agents

The site is intended to be the primary public guide for the product and should be hosted through a fully static GitHub Pages deployment path.

## 3. Positioning

You Agent Factory should be positioned as:

> An open-source, engineering-native platform for turning recurring development work into reusable, inspectable AI agent workflows.

The site should emphasize:

* engineering-native workflows
* local-first usage
* open-source adoption
* file and config-driven setup
* harness agnosticism
* human approval gates
* inspectable workflow graphs
* logs and replays
* reusable workflow templates
* practical process improvement

The site should avoid implying that You Agent Factory:

* replaces engineers
* removes the need for process or review
* automates everything safely by default
* guarantees correctness
* is a generic no-code automation product

## 4. User Experience Goals

### 4.1 Primary Journey

The intended user journey is:

1. A user lands on the homepage.
2. Within 30 seconds, they understand what the product does.
3. They see recognizable workflow examples.
4. They move into installation or quickstart.
5. They run one example workflow.
6. They inspect workflow structure, logs, config, and outputs.
7. They modify or create a workflow.
8. They return to concepts, references, comparisons, or use cases as needed.

### 4.2 Homepage Questions

The homepage should answer:

1. What is this?
2. Who is it for?
3. What problem does it solve?
4. What can I build with it?
5. How is it different from existing tools?
6. How do I try it?

Target homepage sections:

* hero
* problem
* solution
* example workflows
* how it works
* why You Agent Factory
* final CTA

### 4.3 Documentation Reading Modes

The docs should support:

1. Task mode: install, configure, or run something
2. Concept mode: understand orchestration models and patterns
3. Reference mode: find exact CLI, config, schema, or API detail

### 4.4 Localization Goal

Localization should be message-based and canonical-identity-based rather than route-tree duplication.

Goals:

* stable routes such as `/docs/installation`
* localized component and shell text from shared messages
* localized content variants tied to one canonical page identity
* fallback to a default locale
* validation for missing keys or invalid locale metadata

### 4.5 Quality Goal

The site should feel fast, accessible, and reliable.

Expected qualities:

* predictable navigation
* working search
* easy-to-scan content
* copyable code examples
* readable diagrams
* stable layout
* keyboard accessibility
* screen-reader support
* CI-backed quality checks

## 5. Required Content Outcomes

### 5.1 Core Docs

Required core docs:

1. Introduction
2. Installation
3. Quickstart
4. CLI Guide
5. Configuration Guide
6. Workflow Guide
7. Agent Patterns
8. Human Approval Gates
9. Logs, Replays, and Debugging
10. MCP Installation
11. Deployment
12. FAQ
13. Glossary

### 5.2 Use Cases

Required use cases:

1. PR Review Factory
2. Release Readiness Factory
3. Incident Follow-up Factory
4. Data Question Factory
5. Runbook Maintenance Factory
6. Coder / Reviewer Pattern
7. Fully Automated Worktree Merge
8. Dynamic Workflows
9. Browser Backend / Chrome Automation
10. Local Demo / "Just Test It Out"

### 5.3 Concept Pages

Required concepts:

1. What is an agent factory?
2. What is agent orchestration?
3. What is an agentic harness?
4. Strong orchestrator vs. weak executor
5. Generator / discriminator pattern
6. Coder / reviewer pattern
7. Dynamic workflows
8. Fusion
9. Leaderboards
10. Kanban for agent workflows
11. Poka-yoke for agent systems
12. Industrial engineering for agent orchestration
13. Bottlenecks, queues, and throughput
14. Cascading failure in agent systems
15. Guardrails, validation, and infection control

### 5.4 Blog Themes

Initial blog topics:

1. 5000 Commits Later: Agent Factory Pitfalls and Consequences
2. Scripts > Agents: On Cascading Failure
3. Infinite Agents, Infinite Bottlenecks
4. Agent Factories: A Case Study in Manga Translation

### 5.5 References and Comparisons

The site should also collect:

* external references
* related repos
* essays
* talks
* examples
* comparison pages against adjacent tools

## 6. Launch Minimum

The first public launch should include:

1. Landing page
2. What is You Agent Factory?
3. Installation guide
4. Quickstart guide
5. CLI guide
6. Configuration guide
7. Workflow concepts
8. PR Review Factory use case
9. Release Readiness Factory use case
10. Coder / Reviewer pattern
11. Logs and replays guide
12. FAQ
13. Glossary starter page
14. One comparison page
15. GitHub CTA
16. Hosted or waitlist CTA if applicable

Launch priorities:

* a clear homepage
* a successful installation path
* one runnable example workflow
* enough concept material to teach the core mental model

## 7. Definition of Done

The first public version is done when:

1. The site builds statically and publishes through the GitHub Pages path.
2. The homepage explains the product in under 30 seconds.
3. The docs explain installation, quickstart, CLI, configuration, and workflows.
4. A new user can run one example workflow.
5. Search and navigation work across public pages.
6. Localization supports both shared UI messages and localized content variants.
7. Components avoid hardcoded user-facing strings.
8. Accessibility, localization, content, search, and build validations pass in CI.
9. Contributors and CI use the same top-level `make` entrypoints successfully.
10. The repo can add new docs, glossary entries, references, comparisons, and locales cheaply.
