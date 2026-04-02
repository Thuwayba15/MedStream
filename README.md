![MedStream Logo](docs/design/medstream-logo.png)

## What is MedStream?

MedStream is a patient-centric clinical workflow platform designed for visit-based care in healthcare facilities. It supports structured patient intake, triage, queue management, clinician consultation, SOAP documentation, and a longitudinal patient timeline with access-aware history views.

The system is built to help clinicians move from intake to consultation with clearer context, faster handoff, and better documentation continuity across the visit lifecycle.

## Why Choose MedStream?

Quality of care support: MedStream captures structured intake, triage context, vitals, and consultation notes in one workflow so clinicians can make more informed decisions.

Workflow efficiency: Patients move through a guided intake flow, while clinicians receive queue prioritization, AI-assisted summaries, and consultation draft support.

Visit-based continuity: Intake, triage, queue, vitals, notes, transcripts, and timeline summaries are all tied to a single visit.

Access control and auditability: Clinician access is visit-aware and aligned with MedStream’s privacy-sensitive workflow design.

## Documentation

## Software Requirement Specification

### Overview

MedStream is a clinical workflow system that enables:

- Structured patient intake
- Triage and prioritization
- Queue-based consultation management
- SOAP-based clinical documentation
- A unified patient timeline
- Secure, role-based access to patient data

### Components and Functional Requirements

**1. Authentication and Authorization Management**

- Users can register as patients or clinicians
- Users can log into the MedStream web application
- Role and approval-aware route access is enforced
- Pending clinicians are blocked from clinician workspace access until approved

**2. Patient and Profile Management**

- Patients can view their own history and visit timeline
- Clinicians can access patient context only through permitted workflows
- Facility selection is used during patient visit check-in

**3. Patient Intake and Triage Subsystem**

- Patients can check in to a selected facility
- Patients complete an urgent safety check
- Patients describe symptoms in free text
- The system extracts symptoms and routes intake using deterministic pathways first
- Fallback APC-guided intake questions are generated when no strong pathway match exists
- Triage urgency and queue placement are generated from the collected intake data

**4. Queue Management Subsystem**

- Clinicians can view and filter the active queue
- Clinicians can review queue ticket details before consultation
- Queue status transitions support waiting, called, in consultation, completed, and cancelled states
- Queue updates are reflected in patient and clinician flows

**5. Consultation and SOAP Documentation Subsystem**

- Clinicians can open a consultation workspace for an active visit
- Clinicians can record or attach transcripts
- Clinicians can save vitals and free-text objective findings
- Clinicians can edit Subjective, Objective, Assessment, and Plan sections
- AI-assisted draft generation supports subjective and assessment/plan refinement
- Clinicians can finalize encounter notes with clinician-facing and patient-friendly timeline summaries

**6. Patient Timeline and History Subsystem**

- Patients can view their own medical history timeline
- Clinicians can view authorized patient history and timeline context
- Finalized visit outputs contribute to a longitudinal record

**7. Administration and Governance**

- Admins can review clinician applicants
- Admins can approve or decline clinician applications with reasons
- Admins can manage facilities and clinician facility assignments
- Only active facilities appear in relevant selection flows

## Design

## Figma

- [Figma Wireframes](https://www.figma.com/design/UQoCEBcal7BMEmwCxdbdmh/MedStream?node-id=1669-162202&t=O6gvalCXDHFoSksU-1)
- [Figma Prototype View](https://www.figma.com/proto/UQoCEBcal7BMEmwCxdbdmh/MedStream?node-id=1669-162202&t=O6gvalCXDHFoSksU-1)

## Domain Model

- [Entity Reference](docs/domain/entities.md)
- [Domain Model](https://drive.google.com/file/d/1B2O07GVoSAOepOn3CciCOKC-GZC8MIRo/view?usp=sharing)

## AI Usage Disclaimer

MedStream includes AI-assisted functionality for selected workflow tasks such as symptom extraction fallback, clinician handoff summaries, consultation draft generation, and temporary APC-based question generation.

These AI outputs are assistive only. They are not diagnoses, not treatment instructions, and not a substitute for clinician judgment. Final clinical decisions must be made by qualified healthcare professionals.

AI-supported flows are intentionally bounded by deterministic rules where possible, and some parts of the system fall back to deterministic behavior when AI is unavailable or not appropriate.

## How AI was used

- Assisting with **code generation, scaffolding and structure**
- Generating and refining **documentation (README, specs, explanations)**
- Supporting **UI/UX structuring and component breakdowns**
- Debugging and improving implementation efficiency

## Assumptions and Trade-Offs

- Deterministic pathways are preferred for primary routing because they are simpler and more grounded than AI responses which may vary.
- APC fallback is used to broaden intake coverage, but not every complaint is yet modeled as a first-class structured pathway.
- AI can improve summaries and draft quality, but the system is designed so core workflows still function when AI is unavailable.
- The system assumes a single-tenant runtime flow in current authentication behavior.

## Architecture and Stack

**Frontend**

- Next.js App Router
- TypeScript
- Ant Design
- antd-style
- Playwright for end-to-end tests

**Backend**

- ASP.NET Boilerplate (ABP)
- .NET 9
- PostgreSQL-oriented architecture and EF Core data layer
- Application services under `backend/aspnet-core/src/MedStream.Application`

## Running the Application

## Frontend

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

### Frontend Tests

```bash
npx playwright test
```

## Backend

Open the backend solution in Visual Studio.

### Restore

```bash
cd backend/aspnet-core
dotnet restore MedStream.sln
```

### Build

```bash
dotnet build MedStream.sln
```

### Test

```bash
dotnet test MedStream.sln
```

### Run

- In Visual Studio, select `MedStream.Web.Host` as the startup project and run it
- Or run the host from the CLI according to your local setup

## Continuous Integration

GitHub Actions currently runs:

- Backend restore, build, and test
- Frontend install, ESLint, and Prettier checks

See:

- [CI Workflow](.github/workflows/ci.yml)
