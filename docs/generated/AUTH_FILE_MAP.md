# Auth File Map (Current Working Tree)

This is a brief map of the files added/changed for auth, approval gating, and role-based routing.

## Backend auth workflow

- `backend/aspnet-core/src/MedStream.Application/Authorization/Accounts/AccountAppService.cs`
  - Registration flow, patient vs clinician behavior, tenant `1`, pending clinician handling.
- `backend/aspnet-core/src/MedStream.Application/Authorization/Accounts/Dto/RegisterInput.cs`
  - Expanded registration request fields.
- `backend/aspnet-core/src/MedStream.Application/Authorization/Accounts/Dto/RegisterInputFluentValidator.cs`
  - FluentValidation rules for all registration fields.
- `backend/aspnet-core/src/MedStream.Application/Authorization/Accounts/Dto/RegisterOutput.cs`
  - Registration response fields used by frontend routing.
- `backend/aspnet-core/src/MedStream.Application/Users/IUserAppService.cs`
  - Approval endpoint contract.
- `backend/aspnet-core/src/MedStream.Application/Users/UserAppService.cs`
  - Admin clinician approval logic and role assignment.
- `backend/aspnet-core/src/MedStream.Application/Users/Dto/UserDto.cs`
  - Admin-facing user fields for application review.
- `backend/aspnet-core/src/MedStream.Application/Sessions/SessionAppService.cs`
  - Session payload includes approval/registration fields.
- `backend/aspnet-core/src/MedStream.Application/Sessions/Dto/UserLoginInfoDto.cs`
  - Session DTO extensions.
- `backend/aspnet-core/src/MedStream.Application/MedStream.Application.csproj`
  - Adds FluentValidation package.

## Backend identity/domain + roles

- `backend/aspnet-core/src/MedStream.Core/Authorization/Users/User.cs`
  - Adds account type, approval status, clinician application fields.
- `backend/aspnet-core/src/MedStream.Core/Authorization/Users/UserRegistrationManager.cs`
  - Registration manager adjustments for tenant-aware registration.
- `backend/aspnet-core/src/MedStream.Core/Authorization/Users/UserRegistrationConstants.cs`
  - Controlled values for account type/profession/regulator/approval.
- `backend/aspnet-core/src/MedStream.Core/Authorization/Users/UserClaimTypes.cs`
  - Custom claim keys.
- `backend/aspnet-core/src/MedStream.Core/Authorization/Roles/StaticRoleNames.cs`
  - Static tenant roles for Patient and Clinician.
- `backend/aspnet-core/src/MedStream.Core/Authorization/Roles/AppRoleConfig.cs`
  - Role registration in ABP role config.
- `backend/aspnet-core/src/MedStream.EntityFrameworkCore/EntityFrameworkCore/Seed/Tenants/TenantRoleAndUserBuilder.cs`
  - Seed updates for expected roles.

## Auth token + API boundary

- `backend/aspnet-core/src/MedStream.Web.Core/Controllers/TokenAuthController.cs`
  - Token claims include auth/approval state.
- `backend/aspnet-core/src/MedStream.Web.Core/Models/TokenAuth/AuthenticateModel.cs`
  - Login contract includes tenant id.
- `frontend/src/constants/api.ts`
  - Backend endpoint constants and tenant header constants.
- `frontend/src/lib/api/client.ts`
  - Shared Axios instance (`apiClient`) with tenant header defaults.
- `frontend/src/lib/api/abp.ts`
  - ABP envelope unwrap + backend error extraction helpers.
- `frontend/src/services/auth/authService.ts`
  - Auth service methods for login/register backend calls.
- `frontend/src/services/auth/adminAuthService.ts`
  - Admin auth service methods for user list + clinician approval.
- `frontend/src/services/auth/types.ts`
  - Auth service request/response interfaces.
- `frontend/src/app/api/auth/login/route.ts`
  - Thin route handler: input validation, service call, cookie set.
- `frontend/src/app/api/auth/register/route.ts`
  - Thin route handler: registration + auto-login + cookie set + debug mapping.
- `frontend/src/app/api/auth/logout/route.ts`
  - Cookie cleanup and logout response.
- `frontend/src/app/api/auth/me/route.ts`
  - Current auth-state endpoint.
- `frontend/src/app/api/auth/admin/users/route.ts`
  - Thin route handler for admin users list service call.
- `frontend/src/app/api/auth/admin/approve/route.ts`
  - Thin route handler for clinician approval service call.

## Frontend routing, provider, pages

- `frontend/src/proxy.ts`
  - Route guards for unauthenticated, patient, approved clinician, pending clinician, admin.
- `frontend/src/providers/auth/actions.tsx`
- `frontend/src/providers/auth/context.tsx`
- `frontend/src/providers/auth/reducer.tsx`
- `frontend/src/providers/auth/index.tsx`
  - 4-file auth provider structure (state, actions, reducer, hooks/provider).
- `frontend/src/providers/appProviders.tsx`
  - Wires `AuthProvider` at app root.
- `frontend/src/app/(auth)/login/page.tsx`
- `frontend/src/app/(auth)/registration/page.tsx`
- `frontend/src/app/patient/page.tsx`
- `frontend/src/app/clinician/page.tsx`
- `frontend/src/app/admin/page.tsx`
- `frontend/src/app/awaiting-approval/page.tsx`
  - Route targets per auth state.
- `frontend/src/components/auth/*`
  - Login/registration/logout components and auth styling.
- `frontend/src/components/admin/*`
  - Admin clinician review/approval UI and styling.
- `frontend/src/lib/auth/*`
  - Auth constants and token-derived state helpers.
- `frontend/src/lib/server/*`
  - Backend API helper utilities.

## Database migrations

- `backend/aspnet-core/src/MedStream.EntityFrameworkCore/Migrations/20260325182502_UpdateUsersTable*.cs`
- `backend/aspnet-core/src/MedStream.EntityFrameworkCore/Migrations/20260325183000_AddUserRegistrationApprovalFields.cs`
- `backend/aspnet-core/src/MedStream.EntityFrameworkCore/Migrations/20260325183406___PendingCheck__*.cs`
- `backend/aspnet-core/src/MedStream.EntityFrameworkCore/Migrations/20260325200500_SyncUserRegistrationColumns.cs`
- `backend/aspnet-core/src/MedStream.EntityFrameworkCore/Migrations/MedStreamDbContextModelSnapshot.cs`
  - DB schema changes/snapshot for registration and clinician approval fields.

## Tests and docs

- `backend/aspnet-core/test/MedStream.Tests/Authorization/Accounts/AccountAppService_Tests.cs`
  - Backend tests for patient registration, clinician pending state, and clinician approval.
- `frontend/tests/auth-and-landing.spec.ts`
  - Frontend auth-state and guard flow tests.
- `frontend/tests/landing.spec.ts`
  - Landing page navigation assertions used by auth flow.
- `docs/product/srs.md`
- `docs/domain/entities.md`
  - Documentation updates for workflow/entity truth.
