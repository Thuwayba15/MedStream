export type TConsultationNoteStatus = "draft" | "finalized";

export type TVitalsPhase = "triage" | "consultation";

export type TTranscriptInputMode = "typed" | "audio_upload";

export interface IConsultationPatientContext {
    patientUserId: number;
    patientName: string;
    facilityId?: number;
    chiefComplaint: string;
    subjectiveSummary: string;
    urgencyLevel: string;
    queueStatus: string;
    visitDate: string;
}

export interface IEncounterNote {
    id: number;
    visitId: number;
    intakeSubjective: string;
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    status: TConsultationNoteStatus;
    finalizedAt?: string | null;
}

export interface IConsultationVitalSigns {
    id: number;
    visitId: number;
    phase: TVitalsPhase;
    bloodPressureSystolic?: number | null;
    bloodPressureDiastolic?: number | null;
    heartRate?: number | null;
    respiratoryRate?: number | null;
    temperatureCelsius?: number | null;
    oxygenSaturation?: number | null;
    bloodGlucose?: number | null;
    weightKg?: number | null;
    isLatest: boolean;
    recordedAt: string;
}

export interface IConsultationTranscript {
    id: number;
    encounterNoteId: number;
    inputMode: TTranscriptInputMode;
    rawTranscriptText: string;
    translatedTranscriptText?: string | null;
    languageDetected?: string | null;
    capturedAt: string;
}

export interface IConsultationAiDraft {
    visitId: number;
    encounterNoteId: number;
    source: string;
    generatedAt: string;
    subjective?: string | null;
    assessment?: string | null;
    plan?: string | null;
    summary: string;
}

export interface IConsultationWorkspace {
    visitId: number;
    queueTicketId?: number | null;
    visitStatus: string;
    patientContext: IConsultationPatientContext;
    encounterNote: IEncounterNote;
    latestVitals?: IConsultationVitalSigns | null;
    transcripts: IConsultationTranscript[];
}

export interface IGetConsultationWorkspaceRequest {
    visitId: number;
    queueTicketId?: number;
}

export interface ISaveVitalsRequest {
    visitId: number;
    phase: TVitalsPhase;
    bloodPressureSystolic?: number | null;
    bloodPressureDiastolic?: number | null;
    heartRate?: number | null;
    respiratoryRate?: number | null;
    temperatureCelsius?: number | null;
    oxygenSaturation?: number | null;
    bloodGlucose?: number | null;
    weightKg?: number | null;
}

export interface ISaveEncounterNoteDraftRequest {
    visitId: number;
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
}

export interface IAttachConsultationTranscriptRequest {
    visitId: number;
    inputMode: TTranscriptInputMode;
    rawTranscriptText: string;
    translatedTranscriptText?: string | null;
    languageDetected?: string | null;
}
