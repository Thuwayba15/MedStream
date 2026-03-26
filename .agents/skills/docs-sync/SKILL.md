---
name: docs-sync
description: Use this skill whenever code changes affect documented behavior, domain entities, workflows, permissions, APIs, tests, setup, or user-facing functionality. It keeps MedStream documentation in sync with implementation.
---

# Docs Sync Skill

## Purpose
Use this skill to keep project documentation aligned with the actual codebase.

This skill is required whenever a task changes:
- product behavior
- domain concepts
- entities or attributes
- relationships
- workflow order
- access rules
- frontend flows
- backend API behavior
- setup or usage instructions
- test coverage expectations that should be documented

## Primary documents
Review and update these when relevant:
- `docs/product/srs.md`
- `docs/domain/entities.md`

Also update other docs when applicable, such as:
- `README.md`
- feature-specific docs in `docs/`
- onboarding/setup notes
- testing docs if the testing approach changes materially

## When updates are mandatory

### Update `docs/domain/entities.md` when:
- a new entity is added
- an entity is renamed
- an attribute is added, removed, or renamed
- a relationship changes
- field meaning changes
- ownership moves from one entity to another
- a new audit/access concept is introduced
- an entity stops being part of MVP

### Update `docs/product/srs.md` when:
- a workflow changes
- a role gains or loses behavior
- a screen/form changes meaningfully
- a functional requirement is added, removed, or changed
- access rules change
- the MVP/stretch boundary changes
- the user flow changes
- the behavior Codex or future developers should understand at a glance changes

### Update `README.md` when:
- local setup changes
- commands change
- dependencies or required services change
- test commands change
- project structure guidance changes

## How to update docs
Make documentation updates precise, implementation-aware, and easy to scan.

Always:
- keep wording clear and direct
- reflect the current truth of the system
- remove stale information instead of layering contradictions
- keep terminology consistent with the domain model
- preserve MVP vs stretch distinction
- avoid vague placeholders if the implementation already made the decision

## Entities doc standards
When updating `docs/domain/entities.md`:
- list all relevant entities clearly
- describe purpose, key attributes, and important relationships
- distinguish patient-scoped vs visit-scoped information
- note privacy/access entities when relevant
- keep names aligned with the actual code/domain vocabulary

## SRS doc standards
When updating `docs/product/srs.md`:
- keep functional requirements structured and easy to trace
- reflect both clinician and patient flows when relevant
- describe the basic system flow clearly
- keep MVP requirements separate from stretch features
- update terminology if the domain model evolved

## Docs are part of the task
Do not treat docs as optional cleanup.
If the task changed system truth, the task is not complete until the relevant docs are updated.

## Definition of done for docs-sensitive tasks
Before finishing, verify:
- relevant docs were reviewed
- stale statements were corrected
- entity names and relationships are current
- SRS behavior matches implementation
- MVP/stretch boundaries are still clear
- no obvious contradiction remains between docs and code
