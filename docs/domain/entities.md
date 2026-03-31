# MedStream Entity Table

## Notes
- This document reflects the **final MVP domain model** currently shown in the diagram, including `Person`, `Patient`, `Clinician`, `PatientAccessGrant`, and `PatientAccessAudit`. The current diagram does **not** include the removed emergency access entity. fileciteturn4file10turn4file8
- MedStream uses **ABP Identity** for authenticated users and authorization. Authentication is still expected to use JWT transported in secure HttpOnly cookies. fileciteturn4file4
- **Do not put an authorization role attribute on `Person`.** In ABP, authorization roles belong to the Identity user and user-role mapping, not to the shared person/profile record.
- If `Clinician.Role` is kept, it should be treated as a **domain or operational role label** (for example doctor, nurse practitioner, triage nurse, medical officer), **not** as the source of authorization. Authorization should come from ABP roles/permissions.
- For implementation, it is recommended that `Patient` and `Clinician` profiles each support linkage to an ABP user account, even if that link is optional for some onboarding flows. The current domain diagram focuses on the clinical model, not the ABP tables.
- Most workflow data is facility-scoped.
- Current implementation supports manual SOAP editing plus clinician-reviewed AI draft suggestions returned by the consultation application service. These suggestions are not yet persisted as a separate entity.
- For MVP, multilingual support is not a core workflow requirement, but some language-related fields still exist on `Person`, `SymptomIntake`, and `ConsultationTranscript` because they are already part of the current model. fileciteturn4file10turn4file7

## ABP Identity / authorization mapping
The domain diagram does not explicitly draw the ABP Identity tables, but the expected implementation is:
- **ABP User** = authenticated account used for login, authorization, permissions, auditing, and session management.
- **Person** = shared biographical profile data.
- **Clinician** = clinical/staff profile used by MedStream workflows.
- **Patient** = patient profile used for visits, history, and timeline.

Recommended implementation rule:
- `Person` should **not** contain authorization fields such as `Role`.
- ABP `IdentityUser` should hold authorization concerns.
- `Clinician` may store a domain-facing `Role` string if the team wants it for workflow display, filtering, or staffing context.

Current MedStream ABP permission keys for user administration and approval workflow:
- `Pages.Users`
- `Pages.Users.View`
- `Pages.Users.Activation`
- `Pages.Users.Approvals`
- `Pages.Users.Approvals.View`
- `Pages.Users.Approvals.Approve`
- `Pages.Users.Approvals.Decline`
- `Pages.Facilities`
- `Pages.Facilities.View`
- `Pages.Facilities.Create`
- `Pages.Facilities.Edit`
- `Pages.Facilities.Activation`
- `Pages.Facilities.AssignClinician`

Facility management note:
- `Facility` should be treated as a managed reference list.
- Patient and clinician flows should use active facilities from this list for facility selection.

Current MedStream auth onboarding fields on ABP `IdentityUser`:
- `AccountType` (controlled values: `Patient`, `Clinician`)
- `RequestedRegistrationRole` (expected values: `Patient`, `Clinician`)
- `IsClinicianApprovalPending`
- `ClinicianApprovedAt`
- `ClinicianApprovedByUserId`
- `ApprovalStatus` (controlled values: `PendingApproval`, `Approved`, `Rejected`)
- `ApprovalDecisionReason`
- `IdNumber`
- `DateOfBirth`
- `PhoneNumber`
- `ProfessionType` (controlled values: `Doctor`, `Nurse`, `AlliedHealth`, `Other`)
- `RegulatoryBody` (controlled values: `HPCSA`, `SANC`, `Other`)
- `RegistrationNumber`
- `RequestedFacility`
- `ClinicianFacilityId`
- `ClinicianSubmittedAt`
- `ClinicianDeclinedAt`
- `ClinicianDeclinedByUserId`

Behavioral notes:
- Patient self-registration assigns the `Patient` ABP role immediately.
- Clinician self-registration keeps the user pending without `Clinician` role.
- Admin approval assigns `Clinician` role and clears pending status.

---

## 1. Person
**Purpose:** Shared personal/biographical information that can be reused by patient and clinician profiles.

**Key fields**
- Id
- FullName
- PhoneNumber
- Email
- DateOfBirth
- Sex
- PreferredLanguage

**Relationships**
- may be referenced by one Patient profile
- may be referenced by one Clinician profile

**Implementation notes**
- `Person` is the shared profile root in the domain diagram.
- `Person` should not own authorization roles.

---

## 2. Facility
**Purpose:** Represents a clinic or hospital location.

**Key fields**
- Id
- Name
- Code
- FacilityType
- Province
- District
- Address
- IsActive

**Relationships**
- has many Patients
- has many Clinicians
- has many Visits
- has many QueueTickets
- has many PatientAccessGrants
- has many PatientAccessAudits
- may receive many Referrals

---

## 3. Patient
**Purpose:** Patient-specific profile used for visits, history, and clinical continuity.

**Key fields**
- Id
- PersonId
- FacilityId
- NationalIdOrFileNumber
- Address
- EmergencyContactName
- EmergencyContactPhone
- Status

**Relationships**
- belongs to Person
- belongs to Facility
- has many Visits
- has many PatientConditions
- has many Allergies
- has many Medications
- has many PatientAccessGrants
- has many PatientAccessAudits

**Implementation notes**
- In ABP-backed implementation, `Patient` may optionally link to an ABP user account for patient login, but that link is not shown directly in the current domain diagram.

---

## 4. Clinician
**Purpose:** Staff/clinical profile used in triage, consultation, transcription, note approval, uploads, and access control.

**Key fields**
- Id
- PersonId
- FacilityId
- ProfessionType
- Role
- RegistrationNumber
- CanApproveEncounter
- IsActive

**Relationships**
- belongs to Person
- belongs to Facility
- may be assigned to many Visits
- records many VitalSigns entries
- creates many EncounterNotes
- approves many EncounterNotes
- creates many Referrals
- uploads many MedicalReports
- captures many ConsultationTranscripts
- may receive many PatientAccessGrants
- may create many PatientAccessAudit entries

**Implementation notes**
- `Role` here is best treated as a **domain/operational role label**, not ABP authorization.
- Actual authorization should come from ABP roles and permissions.

---

## 5. Visit
**Purpose:** One encounter/clinic visit. This is the central transactional entity that ties the clinical workflow together.

**Key fields**
- Id
- FacilityId
- PatientId
- AssignedClinicianId
- VisitDate
- VisitType
- Source
- Status
- ArrivalMethod

**Relationships**
- belongs to Facility
- belongs to Patient
- may be assigned to one Clinician
- has one SymptomIntake
- has one TriageAssessment
- has one QueueTicket
- has many VitalSigns records
- has one EncounterNote
- has many Referrals
- has many MedicalReports
- may be referenced by PatientAccessGrants
- may be referenced by PatientAccessAudits

**Implementation notes**
- The current final model supports **multiple vital sign recordings per visit**, not just one latest snapshot, because `VitalSigns` now carries `Phase` and `IsLatest` in the diagram. The old `entities.md` was outdated on this point. fileciteturn4file12turn4file7

---

## 6. SymptomIntake
**Purpose:** Captures intake details for the visit before consultation.

**Key fields**
- Id
- VisitId
- FreeTextComplaint
- SelectedSymptoms
- ExtractedPrimarySymptoms
- ExtractionSource
- MappedInputValues
- FollowUpAnswersJson
- SubjectiveSummary
- SubmittedAt

**Relationships**
- belongs to Visit

**Implementation notes**
- `MappedInputValues` stores deterministic/AI-assisted pre-mapped pathway input key-values.
- `FollowUpAnswersJson` stores structured follow-up responses used by triage and SOAP handoff.
- `SubjectiveSummary` stores clinician-readable subjective text intended to seed SOAP `S`.
- Clinician queue review may additionally derive a clinician-facing intake summary and friendly reasoning view from `FollowUpAnswersJson`, triage explanation, and red-flag outcomes; these review helpers are generated read-model fields rather than separate persisted columns.
- Intake routing mode (`approved_json` vs `apc_fallback`) is currently computed at runtime and not persisted as a dedicated column.

---

## 7. ComplaintPathway
**Purpose:** Defines a supported complaint flow and associated question set.

**Key fields**
- Id
- Name
- Description
- GuidelineReference
- UrgencyLevels
- IsActive

**Relationships**
- has many IntakeQuestionDefinitions
- used by many TriageAssessments

---

## 8. IntakeQuestionDefinition
**Purpose:** Defines dynamic intake questions for a complaint pathway.

**Key fields**
- Id
- ComplaintPathwayId
- QuestionKey
- QuestionText
- InputType
- AnswerOptions
- DisplayOrder
- ShowWhenExpression
- IsRequired
- RedFlagWeight

**Relationships**
- belongs to ComplaintPathway
- referenced by many IntakeAnswers

---

## 9. IntakeAnswer
**Purpose:** Stores the answer given to a specific intake question.

**Key fields**
- Id
- SymptomIntakeId
- IntakeQuestionDefinitionId
- AnswerValue
- AnswerLabel
- IsRedFlagTriggered
- CreatedAt

**Relationships**
- belongs to SymptomIntake
- references IntakeQuestionDefinition

---

## 10. TriageAssessment
**Purpose:** Stores the rule-based triage output derived from intake.

**Key fields**
- Id
- VisitId
- UrgencyLevel
- PriorityScore
- Explanation
- RedFlagsDetected
- PositionPending
- QueueMessage
- LastQueueUpdatedAt
- AssessedAt

**Relationships**
- belongs to Visit
- is referenced by QueueTicket

**Implementation notes**
- `PriorityScore` is used for clinician/system queue ordering logic and should not be exposed in patient-facing queue status views.
- clinician review may override `UrgencyLevel`; when this happens the persisted `PriorityScore` should be recalibrated so queue ordering remains consistent with the override

---

## 11. QueueTicket
**Purpose:** Live queue item representing the visit in the facility workflow.

**Key fields**
- Id
- FacilityId
- VisitId
- TriageAssessmentId
- QueueNumber
- QueueDate
- QueueStatus
- CurrentStage
- IsActive
- EnteredQueueAt
- CalledAt
- ConsultationStartedAt
- ConsultationStartedByClinicianUserId
- CompletedAt
- CancelledAt
- AssignedRoom
- CurrentClinicianUserId
- LastStatusChangedAt

**Relationships**
- belongs to Facility
- belongs to Visit
- based on TriageAssessment
- has many QueueEvents

**Implementation notes**
- `QueueStatus` follows constrained transitions:
`waiting -> called|in_consultation|cancelled`,
`called -> waiting|in_consultation|cancelled`,
`in_consultation -> completed|cancelled`
- `completed` and `cancelled` are terminal states and should set `IsActive = false`
- queue listing for live clinician operations should be based on active (`IsActive = true`) tickets only
- when a newer visit is queued for the same patient, older active queue tickets for that patient should be superseded and cancelled so only one live queue ticket remains active per patient
- `QueueNumber` is facility-scoped and resets by `QueueDate`, so numbering starts again each day per facility
- queue changes may emit realtime SignalR notifications to facility-scoped clinician subscribers and patient-scoped subscribers; these notifications are transport behavior and are not persisted as separate entities
- patient-facing workspace state may cache the active queued `VisitId` client-side so queue status can be restored after refresh, but the source of truth remains the persisted `QueueTicket` and `TriageAssessment`

---

## 12. QueueEvent
**Purpose:** Audit trail for queue status and movement changes.

**Key fields**
- Id
- QueueTicketId
- EventType
- OldStatus
- NewStatus
- ChangedByClinicianUserId
- Notes
- EventAt

**Relationships**
- belongs to QueueTicket
- may be changed by a Clinician

**Implementation notes**
- `EventType` should distinguish generic status changes from consultation-start transitions so timeline/audit views can render queue progression correctly

---

## 13. VitalSigns
**Purpose:** Clinician-recorded measured findings for a visit.

**Key fields**
- Id
- VisitId
- RecordedByClinicianId
- Phase
- IsLatest
- BloodPressureSystolic
- BloodPressureDiastolic
- HeartRate
- RespiratoryRate
- TemperatureCelsius
- OxygenSaturation
- BloodGlucose
- WeightKg
- RecordedAt

**Relationships**
- belongs to Visit
- recorded by Clinician

**Implementation notes**
- A single visit may have multiple vital sign records over time.
- `Phase` distinguishes when vitals were captured, for example triage or consultation.
- `IsLatest` makes it easy to identify the current snapshot for UI purposes.

---

## 14. EncounterNote
**Purpose:** One evolving SOAP note for the visit.

**Key fields**
- Id
- VisitId
- CreatedByClinicianId
- IntakeSubjective
- Subjective
- Objective
- Assessment
- Plan
- Status
- FinalizedAt

**Relationships**
- belongs to Visit
- created by Clinician
- has many ConsultationTranscripts

**Implementation notes**
- `IntakeSubjective` stores the handoff baseline from `SymptomIntake.SubjectiveSummary`.
- `Subjective`, `Objective`, `Assessment`, and `Plan` are the evolving clinician-editable SOAP sections.
- AI draft suggestions are currently generated at the application-service layer and returned to the client for clinician review rather than being stored as a dedicated entity.

---

## 15. ConsultationTranscript
**Purpose:** Stores transcript or typed consultation capture linked to the encounter note.

**Key fields**
- Id
- EncounterNoteId
- CapturedByClinicianId
- InputMode
- RawTranscriptText
- TranslatedTranscriptText
- LanguageDetected
- CapturedAt

**Relationships**
- belongs to EncounterNote
- captured by Clinician

**Implementation notes**
- Current implementation supports typed transcript capture and browser-recorded microphone audio that is transcribed server-side after recording stops.
- `InputMode` currently includes `typed` and `audio_upload`.
- Externally-produced transcript text can also populate this same entity without changing the consultation note workflow.

---

## 16. PatientCondition
**Purpose:** Longitudinal patient condition/problem list.

**Key fields**
- Id
- PatientId
- ConditionName
- Status
- DiagnosisDate
- Notes
- RecordedAt
- RecordedByClinicianId
- LastVerifiedAt
- LastVerifiedByClinicianId
- SourceVisitId
- SourceType

**Relationships**
- belongs to Patient
- may be recorded by Clinician
- may be last verified by Clinician
- may reference source Visit

---

## 17. Allergy
**Purpose:** Longitudinal allergy history.

**Key fields**
- Id
- PatientId
- Allergen
- Reaction
- Severity
- Notes
- RecordedAt
- RecordedByClinicianId
- LastVerifiedAt
- LastVerifiedByClinicianId
- SourceVisitId
- SourceType

**Relationships**
- belongs to Patient
- may be recorded by Clinician
- may be last verified by Clinician
- may reference source Visit

---

## 18. Medication
**Purpose:** Longitudinal medication history.

**Key fields**
- Id
- PatientId
- MedicationName
- Dose
- Frequency
- IsCurrent
- StartDate
- EndDate
- Notes
- RecordedByClinicianId
- LastVerifiedAt
- LastVerifiedByClinicianId
- SourceVisitId
- SourceType

**Relationships**
- belongs to Patient
- may be recorded by Clinician
- may be last verified by Clinician
- may reference source Visit

---

## 19. Referral
**Purpose:** Referral created from a visit to another facility.

**Key fields**
- Id
- VisitId
- ReferredToFacilityId
- ReferralReason
- ReferralStatus
- ReferralLetterText
- CreatedByClinicianId
- CreatedAt
- CompletedAt

**Relationships**
- belongs to Visit
- referred to Facility
- created by Clinician

---

## 20. MedicalReport (Deferred)
**Purpose:** Uploaded report linked to a visit.

**Status**
- Deferred from MVP.
- Keep as a future/stretch entity if upload workflow is later enabled.

---

## 21. PatientAccessGrant
**Purpose:** Defines whether a clinician currently has explicit access to a patient's detailed clinical record.

**Key fields**
- Id
- PatientId
- ClinicianId
- FacilityId
- VisitId
- AccessType
- GrantedByClinicianId
- GrantedReason
- StartsAt
- EndsAt
- IsActive
- CreatedAt

**Relationships**
- belongs to Patient
- belongs to Clinician
- belongs to Facility
- may reference Visit
- may be granted by Clinician

**Implementation notes**
- This is the MVP privacy-control entity that prevents blanket access to all patients.
- A clinician should only be able to open detailed patient information when a valid access grant exists or when the application creates one as part of an allowed workflow.

---

## 22. PatientAccessAudit
**Purpose:** Audit trail for detailed patient data access.

**Key fields**
- Id
- PatientId
- AccessedByClinicianId
- FacilityId
- VisitId
- ActionType
- ReasonContext
- WasEmergencyOverride
- Notes
- AccessedAt

**Relationships**
- belongs to Patient
- belongs to Clinician
- belongs to Facility
- may reference Visit

**Implementation notes**
- Even though the emergency access entity was removed from MVP, the audit record still keeps `WasEmergencyOverride` because it is already part of the current final diagram and preserves future extensibility.

---

## Core relationship summary
- A **Facility** contains operational workflow for visits, queues, clinicians, and access control.
- A **Person** provides shared demographic/contact information.
- A **Patient** extends that shared identity with patient-specific state and longitudinal history.
- A **Clinician** extends that shared identity with staff-specific clinical and operational fields.
- A **Visit** is the center of the MVP workflow.
- **SymptomIntake -> TriageAssessment -> QueueTicket -> EncounterNote** forms the main encounter path.
- **VitalSigns** and **Referrals** attach to the visit in MVP.
- **MedicalReport** is deferred from MVP.
- **PatientCondition**, **Allergy**, and **Medication** attach to the patient as longitudinal records with provenance.
- **PatientAccessGrant** and **PatientAccessAudit** enforce and record patient-profile access for POPIA-sensitive workflows.
