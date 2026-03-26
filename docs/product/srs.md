🧾 MedStream — Software Requirements Specification (SRS)

1. 📌 Introduction
1.1 Purpose
This document defines the functional and system requirements for MedStream, a patient-centric healthcare platform.
It is intended for:
Developers (Codex / engineers)
Designers
Stakeholders
The goal is to provide a clear, unambiguous understanding of:
System behavior
Data flow
User roles
Core features (MVP)

1.2 System Overview
MedStream is a clinical workflow system that enables:
Structured patient intake
Triage and prioritization
Queue-based consultation management
SOAP-based clinical documentation
A unified patient timeline
Secure, role-based access to patient data

1.3 Core Principles
Patient-centric: Everything revolves around a patient
Visit-based workflow: All actions occur within a Visit
Timeline-driven history
Strict access control (POPIA-aware)
MVP-first delivery

2. 👥 User Roles
2.1 Patient
Views own medical history
Views visit timeline
Passive role (MVP)

2.2 Clinician
Includes:
Doctors
Nurses (triage)
Capabilities:
Access assigned patients
Conduct consultations
Record notes (SOAP)
View patient history (restricted)

2.3 Admin (Implicit via ABP)
Manages users
Assigns roles
Not core to MVP flows

3. 🧠 Core System Concepts

3.1 Patient
Represents a medical subject.
Contains:
Personal info
Medical history (conditions, allergies, medications)

3.2 Visit (🔥 Core Entity)
Represents a single patient interaction with a facility.
All actions are tied to a Visit:
Intake
Triage
Queue
Consultation
Notes
Reports

3.3 Intake → Triage → Queue → Consultation Flow
Step 1: Intake
Patient symptoms captured via structured questions
Stored as SymptomIntake
Step 2: Triage
System generates TriageAssessment
Determines:
Urgency level
Priority score
Step 3: Queue
Patient enters queue via QueueTicket
Queue state tracked via QueueEvent
Step 4: Consultation
Clinician is assigned
SOAP note created via EncounterNote

3.4 SOAP Documentation Flow
Each consultation produces an EncounterNote:
S (Subjective) → Patient symptoms
O (Objective) → Vitals + observations
A (Assessment) → Diagnosis
P (Plan) → Treatment plan
States:
Draft
Finalized
Approved

3.5 Patient Timeline
A chronological record of:
Visits
Notes
Reports
Medications
Conditions
Access is restricted by access rules.

3.6 Access Control (CRITICAL)
A clinician may access a patient only if:
Assigned to the current Visit
OR has an active PatientAccessGrant
All access is logged via PatientAccessAudit.

4. ⚙️ Functional Requirements

F1. User Authentication
F1.1 Login
1.1 A user must be able to log in using credentials
 1.2 Authentication must use secure session (HttpOnly cookies)
 1.3 User roles must be resolved via ABP Identity
 1.4 Login requests must target tenant id `1` (single-tenant runtime behavior)

F1.2 Self-Registration
2.1 A registrant must choose either Patient or Clinician at registration time
 2.2 Patient registration must grant immediate patient access after successful registration
 2.3 Clinician registration must create a pending clinician applicant state
 2.4 Pending clinician applicants must not receive Clinician role until admin approval
 2.5 Patient registration form fields:
First name, Last name, Email, Phone number, Password, Confirm password
Optional: ID number, Date of birth
 2.6 Clinician registration form fields:
First name, Last name, Email, Phone number, Password, Confirm password
Required: ID number, Profession type, Regulatory body, Registration number, Requested facility
 2.7 Registration controlled values:
accountType = Patient | Clinician
professionType = Doctor | Nurse | AlliedHealth | Other
regulatoryBody = HPCSA | SANC | Other
approvalStatus = PendingApproval | Approved | Rejected

F1.3 Approval-Gated Clinician Access
3.1 Pending clinicians must only access an awaiting approval screen
 3.2 Admin must approve pending clinicians before clinician workspace access is allowed
 3.3 Clinician role assignment must occur only at approval time
 3.4 Admin review view must include:
Full name, Email, Phone number, ID number, Profession type, Regulatory body, Registration number, Requested facility, Submitted date, Approval status
 3.5 Backend approval endpoints must be protected by explicit ABP permissions:
`Pages.Users.Approvals.View` for applicant listing and `Pages.Users.Approvals.Approve` for approval action

F1.4 Auth State Routing
4.1 Route guards must handle:
Not authenticated
Authenticated patient
Authenticated approved clinician
Authenticated admin
Authenticated clinician pending approval

F2. Patient Management
F2.1 Create Patient
1.1 Clinician must be able to create a patient profile
 1.2 Must include:
Name
Contact details
ID number (optional MVP)

F2.2 View Patient
2.1 Clinician must only see patients they have access to
 2.2 Access must be enforced via:
Assigned Visit
PatientAccessGrant

F3. Visit Management
F3.1 Create Visit
1.1 A Visit must be created when a patient enters the facility
 1.2 Visit must link:
Patient
Facility

F3.2 Assign Clinician
2.1 A clinician must be assigned to a Visit
 2.2 Assignment must:
Grant access automatically

F4. Symptom Intake
F4.1 Capture Intake
1.1 User must answer structured intake questions
 1.2 System must store responses as IntakeAnswer

F4.2 Generate Intake Summary
2.1 System must generate:
Complaint category
Extracted symptoms

F5. Triage Assessment
F5.1 Generate Triage
1.1 System must create a TriageAssessment from intake
 1.2 Must include:
Urgency level
Priority score

F6. Queue Management
F6.1 Create Queue Ticket
1.1 System must generate a queue ticket per Visit

F6.2 Track Queue State
2.1 System must log all queue changes via QueueEvent

F7. Vital Signs
F7.1 Record Vitals
1.1 Clinician must record vitals
 1.2 A Visit may have multiple vitals records

F7.2 Latest Vitals
2.1 System must mark one record as IsLatest = true

F8. Consultation (SOAP)
F8.1 Create Encounter Note
1.1 Clinician must create a SOAP note
 1.2 Must include:
Subjective
Objective
Assessment
Plan

F8.2 Draft & Finalize
2.1 Notes must support draft state
 2.2 Notes must be finalized before completion

F9. Medical Reports
F9.1 Upload Report
1.1 Clinician must upload reports
 1.2 Must attach to a Visit

F10. Patient History
F10.1 View Timeline
1.1 Clinician must view patient timeline
 1.2 Must be restricted by access rules

F10.2 Longitudinal Data
2.1 System must store:
Conditions
Allergies
Medications

F11. Data Provenance
F11.1 Source Tracking
1.1 Each medical record must track:
Who recorded it
When
Source visit

F12. Access Control
F12.1 Grant Access
1.1 System must create PatientAccessGrant when:
Clinician assigned to Visit

F12.2 Audit Access
2.1 Every access must create PatientAccessAudit

F12.3 Restrict Search
3.1 Clinicians must only search accessible patients

F12.4 RBAC Enforcement for Admin User Approval
4.1 The backend must enforce ABP permission checks on clinician applicant listing and approval endpoints
 4.2 Frontend admin proxy routes must reject non-admin tokens before calling backend endpoints

5. 🔄 System Flow Summary

Patient Flow
Patient arrives
Intake captured
Triage calculated
Added to queue
Assigned clinician
Consultation occurs
SOAP note created
Visit completed
Timeline updated

Clinician Flow
Logs in
Views queue
Selects patient (Visit)
Reviews intake + vitals
Conducts consultation
Writes SOAP note
Uploads reports
Finalizes visit

6. 🧱 Non-Functional Requirements
Secure authentication (ABP Identity)
Role-based access control
Audit logging (mandatory)
Scalable backend (API-first)
Data privacy (POPIA compliant)

7. 🚀 Stretch Features (NOT MVP)

S1. AI Transcription
Convert consultation speech → SOAP notes

S2. AI Clinical Suggestions
Diagnosis suggestions
Treatment recommendations

S3. Notifications
Patient notified on record access
Clinician alerts

S4. Multi-language Support
Translated intake questions
Multilingual UI

S5. Advanced Analytics
Patient risk scoring
Trend detection

S6. Referral Workflow Enhancements
Cross-facility transfers
Referral tracking

✅ Final Summary
MedStream is a:
Visit-based, patient-centric clinical system with structured intake, triage, queue management, and SOAP-driven consultations, secured by strict access control and audit logging.

