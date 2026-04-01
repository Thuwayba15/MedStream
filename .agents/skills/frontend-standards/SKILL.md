---
name: frontend-standards
description: Use this skill for any frontend task in the repository involving Next.js App Router, TypeScript, Ant Design, antd-style, responsive UI, UX feedback, and Playwright test creation or maintenance. Apply it when creating, editing, refactoring, reviewing, or debugging frontend pages, layouts, components, forms, tables, flows, and user-facing interactions.
---

# Frontend Standards Skill

## When to use this skill

Use this skill for every frontend task, including:
- creating new pages, routes, layouts, and components
- editing or refactoring existing UI
- implementing forms, tables, dashboards, modals, drawers, steps, timelines, queues, and detail views
- wiring UI to API data, loaders, empty states, and error states
- improving accessibility, responsiveness, and user feedback
- adding, fixing, or updating Playwright tests for any changed frontend behavior

If the task affects visible UI or frontend behavior, this skill applies.

## Required domain references
Before making behavior-affecting changes, review:
- `docs/product/srs.md`
- `docs/domain/entities.md`

Use the `medstream-domain-context` skill for domain-sensitive work.
Use the `docs-sync` skill whenever implementation changes documented system behavior or structure.

## Primary objectives

Always produce frontend work that is:
- strongly typed
- modular and easy to extend
- responsive across mobile, tablet, laptop, and desktop
- accessible and keyboard-friendly
- consistent with Ant Design and antd-style patterns
- clear in user feedback and state transitions
- covered by Playwright tests when functionality is added or changed

## Stack and framework rules

### Framework
- Use Next.js App Router.
- Prefer server components by default.
- Use client components only when required for hooks, browser APIs, interactivity, form state, or imperative navigation.
- Add `"use client"` only where it is actually required.

### Language and typing
- Use TypeScript everywhere.
- Avoid `any`.
- Type all props, domain models, utility function inputs, return values, and async responses.
- Use clear interfaces or type aliases.
- Prefer domain-specific names over vague names.

### UI library
- Use Ant Design for standard UI primitives whenever it provides a good fit.
- Prefer built-in Ant Design patterns for forms, tables, alerts, empty states, drawers, modals, steps, tabs, pagination, badges, result screens, and notifications.
- Do not reinvent common controls without a strong reason.

### Styling
- Use `antd-style` for component and page styling.
- Define styles in a colocated `style.ts` or `styles.ts` file.
- Prefer Ant Design tokens and theme values over hard-coded colors.
- There needs to be a central file for storing colours, fonts, etc, so if i want to change a colour, I only have to change it in one place. This file should be imported into the style.ts files of each component, and the tokens should be used instead of hardcoded values.
- Avoid inline styles except for trivial one-off cases that do not justify a style definition.
- Keep visual language clean, modern, and consistent.

## Project structure rules

### App Router structure
- Keep route files under `app/`.
- Use nested layouts and route groups where appropriate.
- Keep route entry files slim.
- Move substantial UI into separate components.

### Component decomposition
Break work into focused pieces such as:
- page entry
- data section
- form section
- summary section
- table/list component
- modal/drawer component
- shared view-state component
- colocated styles
- colocated types when needed

### File organization
- Within a feature area, prefer the order `hooks`, then `helpers`, then `actions`.
- Keep separation of concerns clear: hooks for stateful orchestration, helpers for pure logic and mapping, actions for workflow triggers.
- For provider-related work, enforce the order `hooks`, then `helpers`, then `actions` in supporting files and nearby feature structure.
- No file should grow beyond 350 lines; split before it becomes hard to navigate.
- `style.ts` or `styles.ts` files may exceed 350 lines when keeping the visual system together is clearer than splitting them artificially.

### File naming
- Use clear, intention-revealing names.
- Match file names to the main component or exported function.
- Avoid vague names like `helpers2`, `temp`, or `newComponent`.

## Responsive design requirements

Responsive design is mandatory.

For every new or edited frontend feature:
- ensure the UI works on mobile, tablet, and desktop widths
- avoid fixed widths unless they are bounded and safe
- use flexible layouts, wrapping, responsive grid, and breakpoint-aware behavior
- ensure tables and dense content degrade gracefully on smaller screens
- ensure forms remain usable on mobile
- ensure action buttons remain discoverable and reachable
- ensure modals, drawers, and panels fit small screens appropriately
- ensure typography, spacing, and hierarchy remain readable

Before considering a task done, check:
- narrow mobile layout
- tablet layout
- standard desktop layout

## UX feedback requirements

User feedback is mandatory.

Whenever the UI performs an action, provide appropriate feedback such as:
- loading indicators during async work
- disabled buttons while submitting
- skeletons or placeholders where helpful
- success confirmation after create, update, or delete actions
- clear empty states when no data exists
- clear error messages when something fails
- validation messages for bad input
- confirmation for destructive actions
- retry affordances when appropriate

Do not leave users guessing whether something worked.

## Accessibility requirements

Every frontend change should consider:
- semantic structure
- keyboard navigation
- focus visibility and focus order
- descriptive button and link text
- form labels and validation messaging
- aria attributes where needed
- contrast and readability
- screen-reader-friendly state messaging for important actions where practical

## Data and state rules

- Fetch data on the server when practical.
- Use suspense boundaries when they improve user experience.
- Keep client state local unless shared state is genuinely required.
- Avoid unnecessary global state.
- Handle loading, empty, success, and error states explicitly.
- Never assume data exists; guard null and undefined states properly.

## MedStream API and provider layering rules

For this repository, enforce these architecture rules on every frontend task:
- Keep all API path constants centralized in `src/constants/api.ts` (both backend ABP endpoints and internal Next route endpoints).
- Do not hardcode `"/api/..."` strings in components, providers, or services when a constant exists.
- Provider state must follow the exact 4-file pattern per feature: `actions.tsx`, `context.tsx`, `reducer.tsx`, `index.tsx`.
- Provider actions must use `redux-actions` (`createAction`) and reducers must use `redux-actions` (`handleActions`) to mirror the standard provider structure.
- Provider `index.tsx` files own the client-side API workflow for that provider feature (pending/success/error dispatch around network operations).
- Do not add a separate client-side service file for provider request flows unless the task explicitly needs shared logic beyond a single provider.
- Add short operation comments above provider request methods, for example `// Get Single User` and `// GET /api/users/{id}`.
- Components and pages must call provider actions; they must not perform business API calls directly.
- Server route handlers under `src/app/api/**` stay thin and delegate backend calls to shared server-side helpers under `src/lib/server/**` or another clearly-scoped non-provider server utility layer when reuse is justified.
- Components and route pages should not call `fetch` directly for business flows; they should use provider actions.
- Remove dead frontend artifacts (unused components, helpers, exports, and constants) as part of refactors.
- Avoid eager loading for role-specific data: load clinician-only data only when clinician flows are active.

## Frontend behavior rules

When implementing or changing frontend behavior:
- preserve existing flows unless the task explicitly changes them
- preserve existing functionality while refactoring unless the user explicitly requests a functional change
- do not silently remove validation, confirmations, or guardrails
- keep navigation predictable
- keep domain terminology consistent with MedStream docs and entities
- if a task affects forms or workflows, ensure related summaries, badges, labels, and statuses stay accurate

## Coding standards

Follow the repository’s JavaScript and TypeScript coding standards closely, including these important rules:
- 4-space indentation
- avoid `any`
- document types and interfaces clearly where appropriate
- declare return types
- use double quotes for strings
- use `===` and `!==`
- avoid unused code, unreachable code, and empty blocks
- use braces for control blocks
- avoid abbreviations in variable and method names
- keep names descriptive and consistent
- prefer documented, well-structured code over clever code

These standards come from the project coding standards document. fileciteturn6file0

## Testing requirements

Playwright work is mandatory when frontend behavior changes.

### When to add or update Playwright tests
Do this whenever you:
- add a new page or route
- add a new user flow
- change form behavior
- change navigation behavior
- change visible state transitions
- fix a frontend bug
- alter filtering, sorting, searching, pagination, tabs, modals, drawers, or timeline behavior

### Expectations for Playwright coverage
Where practical, tests should cover:
- happy path
- validation or guardrail behavior
- key error or empty state behavior
- responsive-critical behavior if layout changes meaningfully affect interaction

### Playwright quality rules
- prefer robust locators based on roles, labels, placeholder text, and stable test ids
- avoid brittle selectors
- keep tests readable and task-focused
- update existing tests if behavior changed
- if a refactor changes UI structure, feedback placement, or selectors, update the affected tests in the same task
- do not leave stale failing tests behind

If a feature cannot reasonably be covered end-to-end yet, add the best achievable Playwright coverage and note the remaining gap in your response.

## Definition of done

A frontend task is not complete unless all of the following are true:
- implementation follows App Router conventions
- server vs client boundaries are sensible
- code is typed clearly
- UI is responsive
- user feedback is present
- accessibility basics are addressed
- loading, empty, success, and error states are handled
- styles are colocated and consistent
- related Playwright tests are added or updated
- existing behavior was not broken unnecessarily

## How to work

Do not stop just to produce a plan unless the user explicitly asks for one.
Proceed with implementation directly.

When responding after making frontend changes:
- briefly state what was changed
- mention user-facing feedback states added or preserved
- mention responsive considerations handled
- mention Playwright tests added or updated
- mention any limitation or follow-up only if it materially matters

## MedStream-specific guidance

When this repo includes MedStream docs, align frontend work with them:
- follow the SRS for flow behavior
- follow the entities/domain docs for naming and relationships
- keep clinician and patient workflows distinct
- preserve visit-based workflow assumptions
- preserve access-restricted patient visibility assumptions in UI behavior

If the docs and existing UI conflict, prefer the documented MVP behavior unless the task explicitly says otherwise.
