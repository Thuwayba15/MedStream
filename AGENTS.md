# AGENTS.md

## Default workflow

Before starting any frontend task, apply the `frontend-standards` skill from:

`.agents/skills/frontend-standards/SKILL.md`

Treat that skill as mandatory for all frontend work.

## Frontend includes

Frontend work includes:
- pages
- layouts
- components
- forms
- tables
- drawers
- modals
- navigation
- view states
- styling
- client-side data handling
- Playwright tests for frontend behavior

## Documentation to reference when relevant

When a task touches product behavior, workflows, entities, access control, or naming, also reference:
- `docs/product/srs.md`
- `docs/domain/entities.md`

## Behavioral rules

- Do not ask for a plan first unless the user explicitly requests one.
- When frontend behavior changes, add or update Playwright tests.
- Keep UI responsive.
- Ensure user feedback is present for loading, success, error, empty, and confirmation states.
- Keep naming and workflow terminology aligned with MedStream documentation.

## Backend work

For any backend task under `aspnet-core/src` or `aspnet-core/test`, use the `backend-standards` skill before making changes.

Before backend implementation, review:
- `docs/product/srs.md`
- `docs/domain/entities.md`
- `docs/structure/BACKEND_STRUCTURE.md`

Backend changes must:
- follow the ABP layered architecture and folder structure used by this repo
- keep business logic in the correct layer
- reuse ABP features instead of reinventing them
- keep files/classes/methods clean and reasonably small
- add or update unit tests whenever backend code is added or edited
- add or update integration/web tests when application service or API behavior changes

## MedStream domain and documentation rules

For any task that affects product behavior, workflows, entities, permissions, clinician/patient experiences, or MVP scope, use the `medstream-domain-context` skill before making changes.

For any task that adds or changes system behavior, domain entities, relationships, functional requirements, access rules, or implementation-visible workflows, use the `docs-sync` skill before finishing the task.

Before domain-sensitive work, review:
- `docs/product/srs.md`
- `docs/domain/entities.md`

If implementation changes the documented truth of the system, update the relevant docs as part of the same task.
