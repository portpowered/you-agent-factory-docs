# You Agent Factory Docs Architecture Index

This directory now splits the former all-in-one architecture document into three focused documents:

1. [Customer and System Goals](./customer-system-goals.md)
2. [Target System Plan](./target-system-plan.md)
3. [Technology Choices and Actual Architecture](./technology-choices-and-actual-architecture.md)

## Why This Split Exists

The previous `architecture.md` mixed three different concerns:

* customer and product goals
* phased implementation planning
* architecture and technology decisions

The repository planning standards prefer documents with clear intent boundaries, reviewer-verifiable outcomes, and sparse architecture guidance. Splitting the material makes it easier to:

* align customer intent without reading implementation detail
* track target delivery phases without re-reading product positioning
* understand the current stack and architecture separately from aspirational plan items

## Document Ownership

Use each document for the following updates:

* [customer-system-goals.md](./customer-system-goals.md): customer problems, product positioning, user journeys, launch goals, and definition-of-done outcomes
* [target-system-plan.md](./target-system-plan.md): phased implementation plan, launch sequencing, and reviewer-verifiable completion criteria
* [technology-choices-and-actual-architecture.md](./technology-choices-and-actual-architecture.md): current stack, static-hosting constraints, current repo architecture, target architectural shape, and system rules

## Maintenance Rule

Keep this index sparse. New architecture detail should usually go into the focused documents above rather than expanding this file back into a monolith.
