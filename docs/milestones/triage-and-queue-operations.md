# Triage And Queue Operations Milestone

## Purpose

This milestone completes the MVP flow from patient intake through clinician queue operations:

1. Patient completes intake
2. Backend persists triage
3. Backend creates or reuses a queue ticket
4. Clinician sees prioritized live queue data
5. Clinician reviews triage context
6. Clinician updates queue state or overrides urgency
7. Patient queue view reflects the latest active visit state
8. Queue changes are pushed live through SignalR without polling

---

## What Counts As Done

The milestone is considered complete when all of the following are true:

- Triage is persisted in the backend as a `TriageAssessment`
- Completing intake creates a persistent `QueueTicket`
- Queue ticket is linked to the `Visit` and `TriageAssessment`
- Queue ordering is based on urgency, then priority score, then oldest entered queue time
- Clinicians can view facility-scoped live queue data
- Clinicians can open review context for a queue ticket
- Clinicians can update queue statuses using constrained transitions
- Clinicians can override urgency and the queue ranking updates accordingly
- Patients see queue state for the active visit
- Patients are restored to the active queue view after refresh if the queue ticket is still active
- Queue updates are delivered through SignalR and not by interval polling

---

## Domain Model

### Core entities

- `Visit`
  - the central encounter object
  - owns the intake, triage, queue, and consultation lifecycle

- `SymptomIntake`
  - stores free-text complaint, selected symptoms, extracted symptoms, follow-up answers, and subjective summary

- `TriageAssessment`
  - stores urgency level, priority score, explanation, red flags, queue message, and queue timestamps

- `QueueTicket`
  - represents the active queue item for a visit
  - carries queue number, status, stage, timestamps, clinician linkage, and facility scope

- `QueueEvent`
  - audit trail for queue entry creation, status changes, consultation start, cancellation, and supersession

### Important queue rules

- Queue numbers are scoped by facility and reset daily by `QueueDate`
- Only one live active queue ticket should exist per patient across active visits
- When a newer visit is queued, older active queue tickets for that patient are superseded and cancelled
- Patient-facing queue views must not expose raw `priorityScore`

---

## Backend Flow

### 1. Patient intake and triage

Primary application service:

- [PatientIntakeAppService.cs](C:/Users/Thuwayba/Desktop/Projects/MedStream/backend/aspnet-core/src/MedStream.Application/Services/PatientIntakeService/PatientIntakeAppService.cs)

Key methods:

- `CheckIn`
  - creates a `Visit`

- `CaptureSymptoms`
  - persists initial symptom input

- `ExtractSymptoms`
  - determines extracted primary symptoms and pathway routing

- `UrgentCheck`
  - evaluates immediate danger signals before full triage

- `AssessTriage`
  - persists `TriageAssessment`
  - creates or reuses `QueueTicket`
  - supersedes older active tickets for the same patient
  - writes `QueueEvent`
  - updates visit status to queued
  - publishes realtime queue change notifications

- `GetCurrentQueueStatus`
  - returns current patient queue state for the active visit
  - used by patient refresh restore and realtime update handling

Supporting DTOs live in:

- [PatientIntakeService/DTO](C:/Users/Thuwayba/Desktop/Projects/MedStream/backend/aspnet-core/src/MedStream.Application/Services/PatientIntakeService/DTO)

### 2. Clinician queue operations

Primary application service:

- [QueueOperationsAppService.cs](C:/Users/Thuwayba/Desktop/Projects/MedStream/backend/aspnet-core/src/MedStream.Application/Services/QueueOperationsService/QueueOperationsAppService.cs)

Key methods:

- `GetClinicianQueue`
  - returns facility-scoped active queue rows
  - ordered by urgency rank, then descending priority score, then oldest entered queue time

- `GetQueueTicketForReview`
  - returns merged queue + triage + intake review context

- `UpdateQueueTicketStatus`
  - enforces allowed queue transitions
  - writes `QueueEvent`
  - updates `Visit.Status`
  - publishes realtime notifications

- `OverrideQueueTicketUrgency`
  - updates `TriageAssessment.UrgencyLevel`
  - recalculates priority score
  - writes `QueueEvent`
  - publishes realtime notifications

Primary DTO folder:

- [QueueOperationsService/DTO](C:/Users/Thuwayba/Desktop/Projects/MedStream/backend/aspnet-core/src/MedStream.Application/Services/QueueOperationsService/DTO)

---

## Realtime Architecture

### Why SignalR is used

Polling was explicitly avoided. Queue updates are pushed from the backend whenever queue state changes.

### Abstractions

Application-layer contract:

- [IQueueRealtimeNotifier.cs](C:/Users/Thuwayba/Desktop/Projects/MedStream/backend/aspnet-core/src/MedStream.Application/Services/QueueOperationsService/IQueueRealtimeNotifier.cs)

Test fallback:

- [NullQueueRealtimeNotifier.cs](C:/Users/Thuwayba/Desktop/Projects/MedStream/backend/aspnet-core/src/MedStream.Application/Services/QueueOperationsService/NullQueueRealtimeNotifier.cs)

Runtime host implementation:

- [QueueRealtimeNotifier.cs](C:/Users/Thuwayba/Desktop/Projects/MedStream/backend/aspnet-core/src/MedStream.Web.Host/SignalR/QueueRealtimeNotifier.cs)

### Hub

- [QueueHub.cs](C:/Users/Thuwayba/Desktop/Projects/MedStream/backend/aspnet-core/src/MedStream.Web.Host/SignalR/QueueHub.cs)
- [QueueHubGroupNames.cs](C:/Users/Thuwayba/Desktop/Projects/MedStream/backend/aspnet-core/src/MedStream.Web.Host/SignalR/QueueHubGroupNames.cs)

Group model:

- patient connections join `queue-patient-{patientUserId}`
- clinician connections join `queue-facility-{facilityId}`

### Authentication

JWT creation:

- [TokenAuthController.cs](C:/Users/Thuwayba/Desktop/Projects/MedStream/backend/aspnet-core/src/MedStream.Web.Core/Controllers/TokenAuthController.cs)
- [UserClaimTypes.cs](C:/Users/Thuwayba/Desktop/Projects/MedStream/backend/aspnet-core/src/MedStream.Core/Authorization/Users/UserClaimTypes.cs)

Relevant claims:

- approval state
- requested registration role
- clinician facility id

SignalR token resolution:

- [AuthConfigurer.cs](C:/Users/Thuwayba/Desktop/Projects/MedStream/backend/aspnet-core/src/MedStream.Web.Host/Startup/AuthConfigurer.cs)

The backend accepts:

- encrypted `enc_auth_token`
- standard SignalR `access_token`

### DI registration

Default application registration is test-safe via no-op notifier only in tests:

- [MedStreamTestModule.cs](C:/Users/Thuwayba/Desktop/Projects/MedStream/backend/aspnet-core/test/MedStream.Tests/MedStreamTestModule.cs)

Runtime host registration uses the real notifier:

- [MedStreamWebHostModule.cs](C:/Users/Thuwayba/Desktop/Projects/MedStream/backend/aspnet-core/src/MedStream.Web.Host/Startup/MedStreamWebHostModule.cs)

---

## Frontend Structure

### Patient workspace

Page:

- [patient/page.tsx](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/app/patient/page.tsx)

Provider:

- [patient-intake/index.tsx](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/providers/patient-intake/index.tsx)
- [patient-intake/context.tsx](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/providers/patient-intake/context.tsx)
- [patient-intake/actions.tsx](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/providers/patient-intake/actions.tsx)
- [patient-intake/reducer.tsx](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/providers/patient-intake/reducer.tsx)

UI:

- [patientIntakePage.tsx](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/components/patient-intake/patientIntakePage.tsx)

Important patient-side behavior:

- the active queued visit is cached in local storage
- on refresh, the provider attempts to restore the queued visit by calling `GetCurrentQueueStatus`
- `My Queue` is enabled once a queue exists
- patient subscribes to realtime updates only while on queue step state

Internal Next route handlers used by the patient workspace:

- [check-in/route.ts](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/app/api/patient-intake/check-in/route.ts)
- [symptoms/route.ts](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/app/api/patient-intake/symptoms/route.ts)
- [extract/route.ts](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/app/api/patient-intake/extract/route.ts)
- [questions/route.ts](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/app/api/patient-intake/questions/route.ts)
- [urgent-check/route.ts](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/app/api/patient-intake/urgent-check/route.ts)
- [triage/route.ts](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/app/api/patient-intake/triage/route.ts)
- [queue-status/route.ts](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/app/api/patient-intake/queue-status/route.ts)

### Clinician queue dashboard

Page:

- [clinician/page.tsx](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/app/clinician/page.tsx)

Provider:

- [clinician-queue/index.tsx](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/providers/clinician-queue/index.tsx)

UI:

- [clinicianQueueDashboard.tsx](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/components/clinician/clinicianQueueDashboard.tsx)

Behavior:

- subscribes to queue realtime updates
- reloads current filtered queue view when a `queueUpdated` event arrives

Internal Next route handler:

- [queue/route.ts](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/app/api/clinician/queue/route.ts)

### Clinician review

Page:

- [review/[queueTicketId]/page.tsx](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/app/clinician/review/[queueTicketId]/page.tsx)

Provider:

- [clinician-queue-review/index.tsx](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/providers/clinician-queue-review/index.tsx)

UI:

- [clinicianTriageReviewPage.tsx](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/components/clinician/clinicianTriageReviewPage.tsx)

Internal Next route handlers:

- [[queueTicketId]/route.ts](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/app/api/clinician/queue/[queueTicketId]/route.ts)
- [[queueTicketId]/status/route.ts](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/app/api/clinician/queue/[queueTicketId]/status/route.ts)
- [[queueTicketId]/urgency/route.ts](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/app/api/clinician/queue/[queueTicketId]/urgency/route.ts)

### Realtime client

- [queueRealtimeClient.ts](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/services/realtime/queueRealtimeClient.ts)

Session token route:

- [signalr-token/route.ts](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/app/api/auth/signalr-token/route.ts)

What the frontend listens for:

- `queueUpdated`

Event payload shape:

- `scope`
- `facilityId`
- `patientUserId`
- `visitId`
- `queueTicketId`

---

## Ranking And Visibility Rules

### Queue ranking formula

The clinician queue is ordered using:

1. urgency rank
2. descending priority score within the same urgency band
3. oldest `EnteredQueueAt`

Current urgency rank mapping:

- `Urgent = 0`
- `Priority = 1`
- `Routine = 2`

This logic is implemented in:

- [QueueOperationsAppService.cs](C:/Users/Thuwayba/Desktop/Projects/MedStream/backend/aspnet-core/src/MedStream.Application/Services/QueueOperationsService/QueueOperationsAppService.cs)

### What the patient can and cannot see

Patient-facing queue views can see:

- queue number
- queue status
- active stage
- patient-friendly urgency messaging
- journey/status progression

Patient-facing queue views must not see:

- raw `priorityScore`
- clinician-only reasoning details
- internal red-flag codes
- facility-wide queue data about other patients

### What the clinician can see

Clinician-facing queue and review flows can see:

- urgency level
- priority score
- triage explanation
- clinician-friendly reasoning list
- chief complaint
- selected and extracted symptoms
- clinician summary
- status transition controls

---

## Review Screen Composition

The clinician review page is intentionally a merged read model built from:

- `QueueTicket`
- `TriageAssessment`
- `SymptomIntake`
- `Visit`
- `User` patient profile

The review DTO is:

- [ClinicianQueueReviewDto.cs](C:/Users/Thuwayba/Desktop/Projects/MedStream/backend/aspnet-core/src/MedStream.Application/Services/QueueOperationsService/DTO/ClinicianQueueReviewDto.cs)

It is designed to support:

- triage confirmation
- urgency override
- queue state transitions
- handoff into consultation
- handoff into patient history

Important shaping rules:

- chief complaint falls back from free text to symptom-derived complaint when needed
- clinician summary prefers AI if configured, and deterministic summary if AI is unavailable
- review reasoning is rendered in clinician-friendly language rather than internal rule ids where possible

---

## Realtime Troubleshooting Notes

### Expected local connection path

When realtime is healthy, browser and backend activity should show:

1. `GET /api/auth/signalr-token`
2. `POST /signalr/queue/negotiate`
3. `CONNECT /signalr/queue?...access_token=...`
4. subsequent UI refreshes triggered by `queueUpdated` events without manual page reload

### Common failure modes

- hub connect crash due server-side dependency usage without unit of work
- SignalR auth token not accepted from query string
- no-op notifier registered in runtime instead of the real SignalR notifier
- backend/frontend not restarted after claim or DI changes
- missing websocket support in deployment
- CORS blocking negotiate/connect

### Runtime files to inspect first

- [QueueHub.cs](C:/Users/Thuwayba/Desktop/Projects/MedStream/backend/aspnet-core/src/MedStream.Web.Host/SignalR/QueueHub.cs)
- [QueueRealtimeNotifier.cs](C:/Users/Thuwayba/Desktop/Projects/MedStream/backend/aspnet-core/src/MedStream.Web.Host/SignalR/QueueRealtimeNotifier.cs)
- [AuthConfigurer.cs](C:/Users/Thuwayba/Desktop/Projects/MedStream/backend/aspnet-core/src/MedStream.Web.Host/Startup/AuthConfigurer.cs)
- [queueRealtimeClient.ts](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/services/realtime/queueRealtimeClient.ts)
- [signalr-token/route.ts](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/app/api/auth/signalr-token/route.ts)

---

## Key Backend Wiring

Runtime module wiring:

- [MedStreamWebHostModule.cs](C:/Users/Thuwayba/Desktop/Projects/MedStream/backend/aspnet-core/src/MedStream.Web.Host/Startup/MedStreamWebHostModule.cs)

Test module wiring:

- [MedStreamTestModule.cs](C:/Users/Thuwayba/Desktop/Projects/MedStream/backend/aspnet-core/test/MedStream.Tests/MedStreamTestModule.cs)

Important distinction:

- tests register `NullQueueRealtimeNotifier`
- runtime host registers `QueueRealtimeNotifier`

This keeps backend tests deterministic while still enabling SignalR in the live host.

---

## Queue Status Model

Allowed transitions:

- `waiting -> called | in_consultation | cancelled`
- `called -> waiting | in_consultation | cancelled`
- `in_consultation -> completed | cancelled`

Terminal states:

- `completed`
- `cancelled`

Queue timestamps maintained:

- `EnteredQueueAt`
- `CalledAt`
- `ConsultationStartedAt`
- `CompletedAt`
- `CancelledAt`
- `LastStatusChangedAt`

Future-friendly fields already included:

- `ConsultationStartedByClinicianUserId`
- `CurrentClinicianUserId`
- `AssignedRoom`

---

## Patient Refresh Restore

Patient queue restore is intentionally limited to active queue state:

- if a queued visit is active, refresh returns the patient to queue view
- if the queue is terminal or missing, cached queue state is cleared
- a new visit flow starts normally afterwards

This behavior is implemented in:

- [patient-intake/index.tsx](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/src/providers/patient-intake/index.tsx)

---

## Test Coverage

Backend tests:

- [PatientIntakeAppService_Tests.cs](C:/Users/Thuwayba/Desktop/Projects/MedStream/backend/aspnet-core/test/MedStream.Tests/PatientIntake/PatientIntakeAppService_Tests.cs)
- [QueueOperationsAppService_Tests.cs](C:/Users/Thuwayba/Desktop/Projects/MedStream/backend/aspnet-core/test/MedStream.Tests/QueueOperations/QueueOperationsAppService_Tests.cs)

Frontend Playwright:

- [auth-and-landing.spec.ts](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/tests/auth-and-landing.spec.ts)
- [clinician-queue.spec.ts](C:/Users/Thuwayba/Desktop/Projects/MedStream/frontend/tests/clinician-queue.spec.ts)
- existing patient intake coverage under `frontend/tests`

Latest verification completed:

- backend targeted suite: `QueueOperationsAppService_Tests` passing
- frontend targeted suites: auth/landing and clinician queue passing in Chromium

---

## Manual Test Checklist

### Patient intake to queue

1. Log in as patient
2. Complete intake through triage
3. Confirm queue number and queue status are shown
4. Refresh `/patient`
5. Confirm the page restores to `My Queue`

### Clinician dashboard

1. Log in as clinician
2. Open queue dashboard
3. In patient session, complete intake and create queue entry
4. Confirm clinician dashboard updates without manual refresh

### Review and status change

1. Open `Review` for a waiting patient
2. Override urgency
3. Confirm patient queue view updates live
4. Start consultation
5. Confirm queue state changes to `in_consultation`

### Superseded visit

1. Create a queued visit for a patient
2. Create a second new visit for the same patient
3. Complete intake again
4. Confirm only the newer queue ticket remains active

---

## Deployment Notes

SignalR requires:

- correct backend URL in `NEXT_PUBLIC_API_BASE_URL`
- frontend origin allowed in backend CORS policy
- websocket support enabled in the reverse proxy / hosting platform

If the backend is scaled to multiple instances, SignalR will need scale-out support such as:

- Azure SignalR Service
- Redis backplane

Without that, queue events may not reliably reach all connected clients across instances.

Operational note:

- queue numbering is per facility per queue date, so numbers restart each day for each facility rather than increasing forever across all sites
