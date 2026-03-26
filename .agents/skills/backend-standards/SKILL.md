---
name: backend-abp-standards
description: Use this skill for any backend work in the MedStream ASP.NET Boilerplate (ABP) application, including new features, bug fixes, refactors, API changes, database changes, permissions, DTOs, app services, repositories, migrations, and tests. Apply it automatically whenever editing code under aspnet-core/src or aspnet-core/test.
---

# Backend MedStream ABP Standards

## Purpose
This skill defines the required standards for all backend work in MedStream. It ensures the agent follows the repository's ABP layered architecture, folder structure, coding standards, and testing expectations on every backend task.

## When to use
Use this skill whenever the task touches backend code, including:
- domain entities
- application services
- DTOs
- permissions / authorization
- EF Core / DbContext / migrations
- validation
- seed data
- configuration
- tests
- API behavior exposed by ABP app services

## Required domain references
Before making behavior-affecting changes, review:
- `docs/product/srs.md`
- `docs/domain/entities.md`

Use the `medstream-domain-context` skill for domain-sensitive work.
Use the `docs-sync` skill whenever implementation changes documented system behavior or structure.

## Mandatory references before coding
Before making backend changes, review these when relevant:
- `AGENTS.md`
- `docs/product/srs.md`
- `docs/domain/entities.md`
- backend structure guide used by this repo
- coding standards used by this repo

If the task changes business behavior, align implementation with the SRS and entities docs first.

## Core architecture rules
Follow the ABP layered structure exactly.

Expected structure:
- `aspnet-core/src/<Project>.Core`
- `aspnet-core/src/<Project>.Application`
- `aspnet-core/src/<Project>.EntityFrameworkCore`
- `aspnet-core/src/<Project>.Web.Core`
- `aspnet-core/src/<Project>.Web.Host`
- `aspnet-core/test/<Project>.Tests`
- `aspnet-core/test/<Project>.Web.Tests`

Respect one-way dependencies:
- Web.Host -> Web.Core -> Application -> Core
- EntityFrameworkCore -> Core
- No layer may reference a layer above it.

Do not place business logic in the wrong layer.

## Layer responsibilities

### Core
Use for:
- entities
- enums
- domain services
- domain rules
- constants tied to domain concepts

Do not put in Core:
- DTOs
- AppServices
- HTTP logic
- EF Core-specific logic
- UI-specific concerns

### Application
Use for:
- AppServices
- service interfaces
- DTOs
- orchestration of use cases
- permission checks
- mapping

Do not put domain logic directly in AppServices when it belongs in the domain.

### EntityFrameworkCore
Use for:
- DbContext registration
- EF configuration
- repositories
- migrations
- seed extensions if needed

### Web layers
Use for:
- auth plumbing
- configuration
- middleware
- host setup

Do not add business logic here unless absolutely required by framework plumbing.

## ABP-specific rules
- Reuse ABP features instead of reinventing them.
- Prefer `FullAuditedEntity<Guid>` for domain entities unless there is a very strong reason not to.
- Prefer ABP repositories (`IRepository<TEntity, TPrimaryKey>`) over direct DbContext usage in the Application layer.
- Prefer `AsyncCrudAppService` when standard CRUD is a good fit; use `ApplicationService` for custom workflows.
- Use `[AbpAuthorize]` and ABP permissions consistently.
- Respect ABP identity, roles, tenancy, audit logging, validation, and exception handling conventions.
- Do not duplicate functionality ABP already provides.
- If auth/roles/permissions are needed, integrate with ABP Identity rather than creating parallel role systems.

## Naming and folder conventions
Follow the backend structure guide exactly.

### Entities
- Place entities in the appropriate domain folder in Core.
- Keep entities focused and cohesive.
- Use clear names that match the domain language from `entities.md` and `srs.md`.

### App services
For each service:
- create an interface: `I<EntityName>AppService`
- create an implementation: `<EntityName>AppService`
- place DTOs in the service's `DTO` or `Dtos` folder according to repo convention

### DTOs
- Use DTO names that clearly express purpose.
- If a DTO serves a single endpoint or action, prefer names like `{ActionName}Request` or `{ActionName}Response` where that fits the repo standard.
- Do not expose navigation properties carelessly.
- Flatten or shape DTOs intentionally.

## Code quality standards
Apply these at all times:
- keep classes short; avoid classes longer than roughly 350 lines unless unavoidable
- keep methods short and easy to read
- use guard clauses early
- avoid excessive nesting
- use clear names
- remove dead code
- avoid magic numbers; use constants or enums
- keep code DRY
- prefer simple, direct implementations over clever ones
- format code consistently
- add comments where intent is not obvious
- every public class and public method should have useful comments where not self-evident

## MedStream-specific backend expectations
- Use `docs/domain/entities.md` as the source of truth for entities, attributes, and relationships.
- Use `docs/product/srs.md` as the source of truth for workflows and functional behavior.
- Preserve MedStream concepts such as:
  - Patient
  - Clinician
  - Visit
  - EncounterNote
  - VitalSigns
  - PatientAccessGrant
  - PatientAccessAudit
- Do not broaden data access beyond the documented access rules.
- When implementing clinician/patient behavior, keep POPIA/privacy requirements in mind.

## File size and readability constraints
- Do not create giant files.
- Break large implementations into smaller cohesive files.
- Prefer one clear responsibility per class.
- If an AppService starts getting large, extract helper/domain logic into a domain service or dedicated internal class where appropriate.
- If a DTO file becomes crowded, split DTOs by purpose.

## Testing requirements
Backend work is not complete without tests.

Whenever adding or editing backend behavior, also add or update the relevant tests.

### Minimum expectations
- add or update unit tests for all changed business logic
- add or update integration/application tests for changed AppService behavior where appropriate
- add or update web/API tests when host-level behavior or auth behavior changes
- keep coverage high for the touched feature area
- do not leave untested happy-path-only logic if validation, authorization, or failure paths also changed

### Test coverage checklist
For new/changed work, test at least where relevant:
- successful path
- validation failures
- unauthorized/forbidden access
- not found behavior
- domain rule enforcement
- mapping correctness for DTOs
- persistence behavior if relevant
- audit/access side effects if required by the feature

### Testing style
- keep tests readable and focused
- one behavioral concern per test
- clear arrange/act/assert structure
- prefer meaningful fixtures/builders over noisy setup duplication
- do not over-mock when ABP/integration test helpers provide a better path

## Migrations and persistence
When adding or changing persisted entities:
- update DbContext
- add EF configuration if needed
- generate or update migrations when appropriate
- ensure naming aligns with the domain model
- do not leave model changes half-finished

If a task should not create a migration yet, state that clearly in the final response.

## Implementation workflow
When performing backend work:
1. Read AGENTS.md and relevant docs.
2. Identify the correct layer and folder before writing code.
3. Reuse ABP patterns already present in the repo.
4. Implement the smallest clean solution that fits the architecture.
5. Add or update tests immediately after code changes.
6. Verify compile/test impact mentally and with available commands when possible.
7. Summarize what changed, including tests.

## Final response expectations
When finishing backend tasks, report briefly:
- what was changed
- where it was changed
- what tests were added/updated
- any migration or follow-up needed

Do not claim tests passed unless they were actually run.
