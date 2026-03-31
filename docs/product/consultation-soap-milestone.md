# Consultation and SOAP Milestone

## Overview

This milestone delivers the clinician consultation workflow as a visit-scoped workspace that connects queue review, vitals capture, SOAP note drafting, clinician editing, and transcription-assisted note support.

The goal is to let a clinician:

- open a visit from the queue or triage review
- review the intake and triage handoff
- capture or update consultation vitals
- maintain one evolving SOAP note for the visit
- use AI to draft or refine `Subjective`, `Assessment`, and `Plan`
- record consultation audio, transcribe it, and review the resulting transcript
- save work as a draft and return later
- finalize the note before the visit can be completed

## End-to-End Clinician Flow

1. A patient completes intake and triage.
2. The system creates or updates the queue ticket.
3. A clinician opens the queue dashboard and selects `Review`.
4. In triage review, the clinician sees:
   - urgency and reasoning
   - AI handoff summary
   - chief complaint and symptom context
5. The clinician starts consultation.
6. In consultation, the clinician can:
   - review patient context and latest vitals
   - record new vitals in the `Objective` workflow
   - type notes or attach transcript text
   - start and stop browser-based live transcription capture
   - review the generated transcript in the transcript textbox after recording stops
   - refresh `Subjective` with AI
   - generate `Assessment` and `Plan` drafts with AI
   - edit all SOAP sections manually
   - save a draft and return to it later from the consultation inbox
7. Once the note is clinically complete, the clinician finalizes it.
8. Only after finalization can the visit be completed from the consultation workflow.

## Patient and Visit Model

This workflow remains visit-first:

- one `Visit` is the central unit of care
- one evolving `EncounterNote` exists per visit
- multiple `VitalSigns` records can exist per visit
- one latest vitals record is surfaced for the current consultation view
- transcripts are stored separately and linked to the note

## AI and Drafting Behavior

### Subjective

- `Subjective` is seeded from the intake handoff
- transcript content can be used to refresh the draft
- AI should produce clinician-readable narrative prose rather than raw intake fields or transcript fragments
- clinicians always remain the final editor

### Objective

- structured vitals are captured with quick-entry fields
- free-text objective findings can be added and are included in later AI drafting context
- abnormal latest vitals are visually highlighted

### Assessment and Plan

- AI drafting uses the saved consultation context, including:
  - current `Subjective`
  - current `Objective`
  - latest vitals
  - transcript text
  - triage context
  - pathway guidance
  - targeted APC reference guidance
- APC guidance is used as bounded support, not as an autonomous diagnosis engine
- clinicians must review and edit the output before finalizing

## Transcription

This milestone supports browser-based consultation recording with post-stop transcription:

- the clinician starts recording in the consultation page
- the browser captures audio with `MediaRecorder`
- once recording stops, audio is uploaded for transcription
- the returned transcript is:
  - persisted as a `ConsultationTranscript`
  - attached to the current visit note context
  - shown in the transcript textbox for clinician review

Current scope:

- start/stop recording is supported
- transcription happens after recording stops
- typed transcript attachment is still supported

Out of scope for this milestone:

- streaming partial transcript text while a clinician is still speaking
- autonomous note finalization
- autonomous diagnosis or treatment decisions

## Frontend Changes

The clinician frontend now includes:

- a tabbed clinician workspace shell aligned with the admin-style navigation pattern
- a queue dashboard with:
  - one-row search and filters
  - pagination
  - working summary cards
  - live updates without the old visible live-update pill
- a triage review tab
- a consultation workspace with:
  - patient context
  - AI handoff summary
  - latest vitals
  - transcription controls
  - horizontal visit workflow
  - SOAP tabs
  - today’s consultation inbox for reopening drafts

## Backend Changes

The backend now includes:

- consultation domain entities and persistence for:
  - `EncounterNote`
  - `VitalSigns`
  - `ConsultationTranscript`
- consultation application services for:
  - workspace loading
  - draft saving
  - vitals saving
  - transcript attachment
  - subjective draft generation
  - assessment/plan draft generation
  - note finalization
- finalization guardrails so visits cannot be completed with an incomplete or draft-only note

## Validation and Testing

Work completed across the milestone includes:

- backend consultation tests for persistence, draft generation, and finalization rules
- frontend Playwright coverage for:
  - queue dashboard flow
  - review to consultation navigation
  - consultation inbox
  - live transcription capture
  - transcript review state after recording

## Known Quality Notes

- AI output is a clinician-assist feature, not a source of truth on its own
- the current drafting quality is intended to be useful and editable, but still benefits from iterative prompt tuning
- real-time queue SignalR negotiation may log warnings in Playwright test environments even when tests pass

## Milestone Outcome

This milestone is considered complete when a clinician can move from queue review into consultation, capture vitals and transcript context, work through one evolving SOAP note, save and reopen drafts, and finalize the visit note safely before completing the visit.
