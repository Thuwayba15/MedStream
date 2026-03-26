## Summary

This pull request introduces [short feature name] to [area], including [core pieces], [supporting logic], and [tests].

These changes enable [outcome/benefit] and make [system/component] more [quality attributes: testable/maintainable/scalable].

## What Changed

### [Feature Area 1] Implementation

- Added [component/provider/service] with [key responsibilities and architecture].
- Implemented [state/actions/reducer/hooks/API layer], including [important behavior].
- Added utility helpers for [tokens/persistence/formatting/etc.] using [storage/cookies/session mechanisms].
- Integrated [feature] into app composition ([path/to/layout], [path/to/providers], [path/to/entry]).

### [Feature Area 2] Testing and Tooling

- Added unit and integration tests for [modules] using [test framework].
- Added/updated test setup and environment configuration ([config files, mocks, setup scripts]).
- Updated dependencies and scripts in [path/to/package.json] to support test and runtime changes.

## Files of Interest

- [path/to/main/file]
- [path/to/secondary/file]
- [path/to/tests]
- [path/to/config]

## Why This Change

- Solves: [problem statement]
- Improves: [developer/user impact]
- Supports: [future work/mvp requirement]

## Test Plan

### Automated

- [ ] `npm run test`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `npx playwright test` (if frontend behavior changed)

### Manual

- [ ] Login flow verified
- [ ] Registration flow verified
- [ ] Logout/session persistence verified
- [ ] Error/empty/loading states verified

## Breaking Changes

- [ ] No breaking changes
- [ ] Yes (describe below)

### If Yes, describe breaking change

[Describe migration steps, API contract changes, and rollout considerations]
