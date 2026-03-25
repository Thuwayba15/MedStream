---
name: medstream-domain-context
description: Use this skill for any MedStream work that touches product behavior, entities, workflows, permissions, clinician/patient experiences, visit lifecycle, queue, triage, SOAP documentation, access control, or MVP-vs-stretch scope. Apply it before making frontend or backend changes when the task could affect how the system behaves.
---

# MedStream Domain Context Skill

## Purpose
Use this skill to keep MedStream implementation aligned with the product and domain rules.

This skill exists so the agent does not invent workflows, blur MVP and stretch scope, break domain language, or implement frontend/backend behavior that conflicts with the documented MedStream model.

Use this skill together with:
- the frontend skill for frontend work
- the backend skill for backend work

## Required references
Before making changes that affect behavior, entities, permissions, or workflows, review:
- `docs/product/srs.md`
- `docs/domain/entities.md`

If the task changes documented behavior, roles, entities, field meaning, workflow order, or access rules, the docs must be updated before finishing.

## Core product framing
MedStream is a:
- patient-centric
- visit-based
- clinician workflow system

The MVP is centered around:
- patient registration/profile
- visit creation
- structured symptom intake
- triage assessment
- queue management
- clinician consultation
- SOAP note documentation
- patient timeline/history
- access restriction and auditing

Do not introduce stretch behavior into MVP work unless the task explicitly asks for it.

## MVP scope rules
For MVP, prioritize:
- clear and safe clinician workflows
- clean patient history visibility
- visit-driven data ownership
- consistent access control
- auditability
- readable and maintainable implementation

For MVP, defer or avoid building:
- multilingual workflows unless explicitly requested
- emergency / EMT workflows unless explicitly requested
- advanced AI automation beyond what is already agreed
- unnecessary analytics
- overengineered abstractions not needed for current flows

## Source of truth
Use the documented MedStream terminology exactly where possible:
- Person
- Patient
- Clinician
- Visit
- SymptomIntake
- IntakeAnswer
- TriageAssessment
- QueueTicket
- QueueEvent
- VitalSigns
- EncounterNote
- MedicalReport
- PatientCondition
- Allergy
- Medication
- PatientAccessGrant
- PatientAccessAudit

Do not silently rename domain concepts unless the task explicitly requires it and the docs are updated too.

## Core workflow
The default MVP flow is:

1. Patient exists or is created
2. Visit is created for the patient at a facility
3. Symptom intake is captured
4. Triage assessment is generated or recorded
5. Queue ticket is created and updated through queue events
6. Clinician is assigned to the visit
7. Clinician reviews the visit context
8. Clinician records vitals and consultation information
9. Encounter note is completed using SOAP structure
10. Reports or longitudinal updates may be attached
11. Timeline/history reflects completed clinical activity

When implementing features, make sure screens, DTOs, entities, services, and tests support this flow instead of fragmenting it.

## Visit-first design
A Visit is the central transactional unit of care in MVP.

Most clinical actions should be tied to a Visit, including:
- intake
- triage
- queue
- vitals
- encounter notes
- reports
- clinician assignment

Do not attach visit-scoped behavior directly to Patient when it belongs to Visit.

Use Patient for longitudinal history such as:
- chronic conditions
- allergies
- medications
- long-term profile data

## SOAP note rules
Encounter notes should follow the SOAP structure:
- Subjective
- Objective
- Assessment
- Plan

When implementing clinician workflows:
- preserve draft-friendly editing where applicable
- make subjective/objective/assessment/plan clearly separable in data and UI
- avoid mixing queue, triage, and SOAP concerns into a single confusing object
- keep note lifecycle clear if status/state exists

## Access and privacy rules
MedStream is privacy-sensitive.

For MVP:
- a clinician must not automatically have access to all patients
- patient access should be tied to the visit or an explicit access grant
- access-sensitive views and queries should be restricted
- meaningful access events should be auditable

If a task affects:
- search
- profile viewing
- history/timeline viewing
- report access
- visit assignment
- clinician handoff

then explicitly consider PatientAccessGrant and PatientAccessAudit.

Do not build broad unrestricted clinician visibility unless the task explicitly asks for it and the docs are updated.

## ABP awareness
ABP already provides important platform features.
Do not recreate existing platform concepts unnecessarily.

Keep these distinctions clear:
- ABP identity and authorization handle application-level auth concerns
- MedStream entities model domain behavior and clinical workflow
- domain-specific labels must not replace ABP auth concepts unless that is explicitly intended

Example:
- do not store authorization logic in a generic Person role field if ABP roles/permissions already own that concern
- domain entities may still contain operational fields that matter to workflow

## Frontend expectations from a domain perspective
When doing frontend work:
- align pages and components with the documented workflow
- use domain terminology consistently in labels, headings, sections, and forms
- keep clinician flow efficient and obvious
- keep patient-facing screens simpler and easier to understand
- reflect loading, error, empty, and success states for real workflow situations
- do not expose stretch-only features inside MVP screens

## Backend expectations from a domain perspective
When doing backend work:
- keep entities, DTOs, app services, and tests aligned with domain language
- model visit-scoped vs patient-scoped data correctly
- do not leak private data through overly broad queries
- keep write paths and read paths understandable
- preserve auditable actions where required
- avoid giant app services that mix multiple workflows irresponsibly

## What to do when a task is ambiguous
If the task is unclear, prefer:
- the documented SRS
- the documented entities
- MVP-safe implementation
- visit-first workflow consistency
- privacy-safe defaults

Do not invent major new workflows just to complete a task quickly.

## Definition of done for domain-sensitive work
Before finishing, verify:
- the implementation matches `docs/product/srs.md`
- the implementation matches `docs/domain/entities.md`
- terminology is consistent
- MVP scope is respected
- privacy-sensitive behavior was considered
- tests cover the main workflow changes
- docs were updated if behavior or entities changed
