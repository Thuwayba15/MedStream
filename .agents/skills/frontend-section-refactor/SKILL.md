---
name: frontend-section-refactor
description: Use this skill when refactoring one MedStream frontend section at a time, such as auth, admin governance, intake, queue, consultation, history, or another feature slice. Apply it when the task requires reviewing and cleaning all related pages, components, providers, routes, styles, and tests for that section while improving structure, responsiveness, consistency, and provider layering.
---

# Frontend Section Refactor

Use this skill to refactor a single frontend section end-to-end without trying to clean the whole app in one pass.

Treat the section as a bounded slice:
- related route pages
- related components
- related providers
- related internal API routes
- related styles
- related hooks and helpers
- related Playwright tests

## Workflow

### 1. Build section context

Before changing code:
- apply [$frontend-standards](/C:/Users/Thuwayba/Desktop/Projects/MedStream/.agents/skills/frontend-standards/SKILL.md)
- review `docs/product/srs.md` and `docs/domain/entities.md` if the section affects behavior or terminology
- inspect the full section scope instead of editing one file in isolation

Map the section first:
- route pages under `src/app/**`
- components under `src/components/**`
- providers under `src/providers/**`
- supporting hooks under `src/hooks/**`
- supporting helpers under `src/lib/**` or another established shared folder
- internal API routes under `src/app/api/**`
- Playwright coverage under `frontend/tests/**`

### 2. Refactor structure first

Enforce these structural rules:
- keep provider state in the standard 4-file provider shape: `actions.tsx`, `context.tsx`, `reducer.tsx`, `index.tsx`
- keep provider request orchestration inside provider `index.tsx`
- keep API constants in `src/constants/api.ts`
- remove unnecessary frontend service files for provider-driven flows
- keep server-side shared request helpers in `src/lib/server/**` only when reuse is justified
- remove unnecessary internal `route.ts` proxies when the provider can safely call the backend endpoint directly without losing required auth, cookie, guard, or error-shaping behavior
- move shared hooks into `src/hooks/**`
- move shared pure helpers into `src/lib/**` or another existing shared helper area
- keep clear separation of concerns between hooks, helpers, actions, providers, routes, and components
- in provider-related work, keep the supporting order `hooks`, then `helpers`, then `actions`
- keep every file at 350 lines or fewer; split before it becomes hard to navigate
- allow `style.ts` or `styles.ts` files to exceed 350 lines when that keeps the styling system clearer

### 3. Clean behavior and feedback

For each refactored section:
- preserve documented MedStream behavior unless the task explicitly changes it
- preserve existing functionality while refactoring unless the user explicitly asks for behavior changes
- ensure loading, success, empty, and error states are explicit
- prefer inline field-level validation for form problems when that is the established UX for the section
- keep feedback specific and actionable instead of generic failure messages
- add provider method comments like:

```ts
// Get Single User
// GET /api/users/{id}
```

### 4. Refactor the UI deliberately

UI expectations for every section:
- keep the visual language cohesive with the current app
- use central theme tokens instead of hardcoded colors or fonts
- ensure mobile responsiveness is not an afterthought
- check mobile, tablet, and desktop layouts
- avoid brittle spacing or fixed-width layouts
- keep forms and action controls usable on small screens
- keep typography and hierarchy consistent

Do not over-redesign a section without being asked. Improve clarity, consistency, and polish while respecting the established direction unless the user requests a visual overhaul.

### 5. Update tests in the same task

If the refactor changes behavior, structure, or selectors:
- update existing Playwright tests
- add missing tests for new validation, state handling, or routing behavior
- do not leave stale selectors or failing tests behind
- include responsive-critical coverage when layout changes affect interaction

### 6. Finish with a standards check

Before closing the section:
- confirm there are no unnecessary service files left for the refactored provider flow
- confirm related files follow the intended shared-folder structure
- confirm no edited file exceeds 350 lines
- confirm the section is mobile responsive
- confirm UI feedback is clear and consistent
- run build validation
- run the affected Playwright tests
- mention any remaining limitation honestly if something could not be verified

## Output expectations

When using this skill, report:
- what section was refactored
- what structural cleanup was done
- what UI feedback and responsive adjustments were made
- which tests were updated or added
- whether the section now fully meets the stated standards, and any residual gap if not
