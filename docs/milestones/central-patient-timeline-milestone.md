# Central Patient Timeline Milestone

## Purpose

This milestone delivers a usable longitudinal patient record across facilities, with distinct clinician and patient views.

It completes:

- timeline-ready consultation summaries
- clinician timeline access with access control and auditing
- clinician workspace tab continuity between consultation and history
- patient self-history with patient-safe summaries
- fallback behavior for older visits without finalized summaries

---

## Scope Delivered

### Core outcomes

- Consultation now stores two additive timeline summary fields on encounter notes:
  - `ClinicianTimelineSummary`
  - `PatientTimelineSummary`
- Finalization requires both summaries.
- A dedicated patient timeline backend read model now aggregates visits across facilities for the same patient account.
- Clinician timeline reads are access-controlled and audited.
- Patient self-history uses patient-facing summary content only.
- Clinician workspace tab switching between `Consultation` and `Patient Timeline` preserves active patient consultation context, and clears only when:
  - consultation is completed
  - a different patient consultation is opened

### Issue sequencing completed

1. Consultation summary fields and validation
2. Consultation UI capture flow for summaries
3. Backend timeline read model + access rules + audit
4. Clinician timeline UI and consultation/history tab continuity
5. Patient self-history UI and patient-safe rendering
6. Stabilization, docs alignment, and regression hardening integrated during delivery

---

## Domain And Data Model

### Encounter note timeline summaries

The encounter note now includes:

- `ClinicianTimelineSummary` for clinician history views
- `PatientTimelineSummary` for patient history views

Both are required at finalization and remain editable while the note is draft.

### Access/audit entities

The following domain entities support timeline privacy and traceability:

- `PatientAccessGrant`
- `PatientAccessAudit`

Clinician timeline access is authorized only by assigned visit access or active grant, and successful clinician reads create `PatientAccessAudit` entries.

---

## Backend Architecture

### Timeline application service

Primary service:

- [PatientTimelineAppService.cs](C:/Users/Thuwayba/Desktop/Projects/MedStream/backend/aspnet-core/src/MedStream.Application/Services/PatientTimelineService/PatientTimelineAppService.cs)

Contract:

- [IPatientTimelineAppService.cs](C:/Users/Thuwayba/Desktop/Projects/MedStream/backend/aspnet-core/src/MedStream.Application/Services/PatientTimelineService/IPatientTimelineAppService.cs)
- [PatientTimelineDtos.cs](C:/Users/Thuwayba/Desktop/Projects/MedStream/backend/aspnet-core/src/MedStream.Application/Services/PatientTimelineService/DTO/PatientTimelineDtos.cs)

Behavior:

- `GetPatientTimeline` for authorized clinician reads
- `GetMyTimeline` for patient self-history
- cross-facility visit aggregation
- summary selection by audience:
  - clinician view prefers clinician summary
  - patient view prefers patient summary
- fallback summary derivation for older visits missing persisted summary fields

### Persistence and EF wiring

- [PatientAccessGrant.cs](C:/Users/Thuwayba/Desktop/Projects/MedStream/backend/aspnet-core/src/MedStream.Core/Domains/Patient%20Access/PatientAccessGrant.cs)
- [PatientAccessAudit.cs](C:/Users/Thuwayba/Desktop/Projects/MedStream/backend/aspnet-core/src/MedStream.Core/Domains/Patient%20Access/PatientAccessAudit.cs)
- [PatientAccessConstants.cs](C:/Users/Thuwayba/Desktop/Projects/MedStream/backend/aspnet-core/src/MedStream.Core/Domains/Patient%20Access/PatientAccessConstants.cs)
- [MedStreamDbContext.cs](C:/Users/Thuwayba/Desktop/Projects/MedStream/backend/aspnet-core/src/MedStream.EntityFrameworkCore/EntityFrameworkCore/MedStreamDbContext.cs)

---

## Frontend Architecture

### Clinician timeline experience

Route:

- [frontend/src/app/clinician/history/page.tsx](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/app/clinician/history/page.tsx)

UI:

- [clinicianHistoryPage.tsx](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/components/clinician/clinicianHistoryPage.tsx)
- [historyStyle.ts](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/components/clinician/historyStyle.ts)

Provider and API proxy:

- [frontend/src/providers/clinician-history/index.tsx](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/providers/clinician-history/index.tsx)
- [frontend/src/app/api/clinician/history/route.ts](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/app/api/clinician/history/route.ts)

### Consultation/history continuity in clinician workspace

Provider placement moved to clinician layout scope:

- [frontend/src/app/clinician/layout.tsx](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/app/clinician/layout.tsx)
- [frontend/src/app/clinician/clinicianWorkspaceProviders.tsx](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/app/clinician/clinicianWorkspaceProviders.tsx)

Tab/query continuity:

- [clinicianWorkspaceShell.tsx](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/components/clinician/clinicianWorkspaceShell.tsx)
- [clinicianConsultationPage.tsx](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/components/clinician/clinicianConsultationPage.tsx)

### Patient self-history experience

Route:

- [frontend/src/app/patient/history/page.tsx](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/app/patient/history/page.tsx)

UI:

- [patientHistoryPage.tsx](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/components/patient/patientHistoryPage.tsx)
- [patientHistoryStyle.ts](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/components/patient/patientHistoryStyle.ts)

Patient provider and API proxy:

- [frontend/src/providers/patient-history/index.tsx](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/providers/patient-history/index.tsx)
- [frontend/src/app/api/patient/history/route.ts](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/app/api/patient/history/route.ts)

Bottom navigation updates:

- [patientBottomNav.tsx](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/components/patient/patientBottomNav.tsx)
- [patientBottomNavStyle.ts](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/components/patient/patientBottomNavStyle.ts)
- [patientIntakePage.tsx](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/components/patient-intake/patientIntakePage.tsx)

---

## API Surface

### ABP endpoints

- `GET /api/services/app/PatientTimeline/GetPatientTimeline`
- `GET /api/services/app/PatientTimeline/GetMyTimeline`

### Internal Next route handlers

- `GET /api/clinician/history`
- `GET /api/patient/history`

---

## Access, Privacy, And Exposure Policy

### Clinician history

- requires assigned visit access or active `PatientAccessGrant`
- successful reads generate `PatientAccessAudit`
- clinician view can include clinician summary content and clinical context expected for authorized care workflows

### Patient self-history

- uses `GetMyTimeline` only
- renders patient-facing summary text
- hides clinician-only internals, triage reasoning, and raw workflow details
- currently filters out non-patient-summary fallback entries in patient UI to keep the timeline demo-safe and understandable

---

## Fallback And Backfill Policy

Current implementation policy:

- older visits without persisted timeline summary fields use derived fallback summaries in backend payloads
- patient UI now displays finalized patient-summary entries only, reducing noise from legacy fallback data
- no bulk backfill script is required for the milestone demo path

If future rollout requires richer historical patient timelines, a one-time backfill strategy can be added later.

---

## Testing And Verification

### Backend

- Targeted timeline tests:
  - [PatientTimelineAppService_Tests.cs](C:/Users/Thuwayba/Desktop/Projects/MedStream/backend/aspnet-core/test/MedStream.Tests/PatientTimeline/PatientTimelineAppService_Tests.cs)
- Verification run: timeline tests passing and solution build passing

### Frontend

- Clinician flow coverage:
  - [clinician-queue.spec.ts](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/tests/clinician-queue.spec.ts)
- Patient history coverage:
  - [patient-history.spec.ts](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/tests/patient-history.spec.ts)

Verification completed:

- `npm run lint` passing
- `npm run build` passing
- targeted Playwright specs passing in Chromium for clinician and patient timeline flows

---

## Manual Regression Checklist

1. Open triage review for a queued patient and start consultation.
2. Confirm consultation captures both timeline summaries and blocks finalization if either summary is missing.
3. Save draft, refresh, and confirm summary values persist.
4. Open `Patient Timeline` tab from clinician workspace and confirm same patient context is retained.
5. Return to `Consultation` tab and confirm context still retained.
6. Complete consultation and confirm context is cleared.
7. As patient, open `/patient/history` and confirm only patient-safe finalized summary entries render.
8. Confirm empty-state behavior for patient accounts with no finalized patient summaries.

---

## Known Notes

- Legacy data can still contain low-quality fallback text at backend level; patient UI currently suppresses these entries for clarity.
- Playwright logs may include non-blocking realtime warnings in local test runs.

---

## Milestone Outcome

The Central Patient Timeline milestone is production-shaped for MVP workflows:

- clinicians get longitudinal cross-facility context with enforced access and audit
- patients get a clean self-history experience with patient-safe summaries
- consultation and history workflows are now connected as one continuous workspace experience
