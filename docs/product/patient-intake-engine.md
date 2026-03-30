# Patient Intake Engine (Approved JSON + APC Fallback)

## Purpose
This document defines the current MedStream intake engine behavior:
- deterministic approved JSON pathways first
- APC catalog + APC summaries as fallback context
- AI fallback used only to generate temporary subjective intake questions
- deterministic triage remains authoritative

## Runtime Components

### Backend
- `backend/aspnet-core/src/MedStream.Application/Services/PatientIntakeService/PatientIntakeAppService.cs`
  - check-in, capture, extraction, urgent-check, questions, triage orchestration
- `backend/aspnet-core/src/MedStream.Application/Services/PatientIntakeService/Pathways/PathwayClassifier.cs`
  - deterministic entry-pathway ranking and confidence
- `backend/aspnet-core/src/MedStream.Application/Services/PatientIntakeService/Pathways/PathwayExtractionService.cs`
  - deterministic-first extraction, mode selection, mapping
- `backend/aspnet-core/src/MedStream.Application/Services/PatientIntakeService/Pathways/EmbeddedJsonPathwayDefinitionProvider.cs`
  - approved JSON pathway loading
- `backend/aspnet-core/src/MedStream.Application/Services/PatientIntakeService/Pathways/EmbeddedApcReferenceProviders.cs`
  - embedded APC catalog and summaries loading
- `backend/aspnet-core/src/MedStream.Application/Services/PatientIntakeService/Pathways/ApcFallbackServices.cs`
  - APC retrieval selection and fallback question generation
- `backend/aspnet-core/src/MedStream.Application/Services/PatientIntakeService/Pathways/PathwayExecutionEngine.cs`
  - deterministic rule evaluation and triage indicators

### Frontend
- `frontend/src/providers/patient-intake/*`
  - unified intake state machine
- `frontend/src/components/patient-intake/patientIntakePage.tsx`
  - guided flow rendering
- `frontend/src/app/api/patient-intake/*`
  - thin proxy routes for patient intake API calls

## Intake Modes

- `approved_json`
  - selected when deterministic classifier finds a strong approved pathway
  - follow-up questions and rules come from approved JSON definition
- `apc_fallback`
  - selected when no strong approved pathway exists
  - pathway key is set to `general_unspecified_complaint`
  - follow-up questions are temporary subjective questions generated from APC summaries

## End-to-End Flow

1. **Check-In**
2. **Urgent Check (inline)**
   - runs global urgent safety checks only
   - if urgent: fast-track immediately to deterministic triage/status
3. **Describe Symptoms**
   - deterministic symptom extraction first
   - classifier ranks approved entry pathways
   - returns selected pathway + intake mode + fallback summary ids
4. **Follow-Up Questions**
   - approved JSON questions in `approved_json` mode
   - APC summary-based subjective questions in `apc_fallback` mode
5. **Status & Queue**
   - deterministic triage result + persistent queue ticket creation
   - patient receives assigned queue number and waiting status metadata

## APC Fallback Rules

Fallback is used only when approved deterministic routing is weak.

APC fallback uses:
- `docs/clinical-pathways/apc-catalog.v1.json` for retrieval/index
- `docs/clinical-pathways/apc-summaries.v1.json` for fallback question context

AI fallback input includes:
- complaint free text
- selected symptom chips
- extracted primary symptoms
- selected APC summaries

AI fallback output is strictly constrained to:
- bounded subjective intake questions
- structured JSON only
- no diagnosis, no treatment advice

If AI fallback is unavailable, deterministic summary-based fallback questions are generated.

## Safety and Visibility

- Patient responses do not expose clinician-only outcomes or recommendations.
- Deterministic triage remains the urgency authority for both modes.
- Clinician remains final reviewer and decision-maker.

## Persistence and SOAP Handoff

Persisted intake fields include:
- `SymptomIntake.FreeTextComplaint`
- `SymptomIntake.SelectedSymptoms`
- `SymptomIntake.ExtractedPrimarySymptoms`
- `SymptomIntake.ExtractionSource`
- `SymptomIntake.MappedInputValues`
- `SymptomIntake.FollowUpAnswersJson`
- `SymptomIntake.SubjectiveSummary`
- `Visit.PathwayKey`

`SymptomIntake.SubjectiveSummary` seeds SOAP `S` for clinician consultation.
