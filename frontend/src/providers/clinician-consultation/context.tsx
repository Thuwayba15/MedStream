"use client";

import { createContext } from "react";
import type { IClinicianQueueReview, IUpdateQueueStatusResponse } from "@/services/queue-operations/types";
import type {
    IAttachConsultationTranscriptRequest,
    IConsultationAiDraft,
    IConsultationInbox,
    IConsultationTranscript,
    IConsultationVitalSigns,
    IConsultationWorkspace,
    IEncounterNote,
    ISaveEncounterNoteDraftRequest,
    ISaveVitalsRequest,
    ITranscribeConsultationAudioRequest,
} from "@/services/consultation/types";

export interface IClinicianConsultationStateContext {
    inbox: IConsultationInbox | null;
    workspace: IConsultationWorkspace | null;
    review: IClinicianQueueReview | null;
    subjectiveDraft: IConsultationAiDraft | null;
    assessmentPlanDraft: IConsultationAiDraft | null;
    isLoadingWorkspace: boolean;
    isSavingDraft: boolean;
    isSavingVitals: boolean;
    isAttachingTranscript: boolean;
    isGeneratingSubjective: boolean;
    isGeneratingAssessmentPlan: boolean;
    isFinalizing: boolean;
    isCompletingVisit: boolean;
    errorMessage?: string;
    successMessage?: string;
}

export interface ILoadConsultationWorkspaceInput {
    visitId: number;
    queueTicketId?: number;
}

export interface IClinicianConsultationActionContext {
    loadInbox: () => Promise<void>;
    loadWorkspace: (input: ILoadConsultationWorkspaceInput) => Promise<void>;
    saveEncounterNoteDraft: (payload: ISaveEncounterNoteDraftRequest) => Promise<IEncounterNote | null>;
    saveVitals: (payload: ISaveVitalsRequest) => Promise<IConsultationVitalSigns | null>;
    attachTranscript: (payload: IAttachConsultationTranscriptRequest) => Promise<IConsultationTranscript | null>;
    transcribeAudio: (payload: ITranscribeConsultationAudioRequest) => Promise<IConsultationTranscript | null>;
    generateSubjectiveDraft: (visitId: number) => Promise<IConsultationAiDraft | null>;
    generateAssessmentPlanDraft: (visitId: number) => Promise<IConsultationAiDraft | null>;
    finalizeEncounterNote: (visitId: number) => Promise<IEncounterNote | null>;
    completeVisit: (queueTicketId: number) => Promise<IUpdateQueueStatusResponse | null>;
    clearMessages: () => void;
}

export const INITIAL_STATE: IClinicianConsultationStateContext = {
    inbox: null,
    workspace: null,
    review: null,
    subjectiveDraft: null,
    assessmentPlanDraft: null,
    isLoadingWorkspace: false,
    isSavingDraft: false,
    isSavingVitals: false,
    isAttachingTranscript: false,
    isGeneratingSubjective: false,
    isGeneratingAssessmentPlan: false,
    isFinalizing: false,
    isCompletingVisit: false,
    errorMessage: undefined,
    successMessage: undefined,
};

export const INITIAL_ACTION_STATE: IClinicianConsultationActionContext = {
    loadInbox: async () => Promise.resolve(),
    loadWorkspace: async () => Promise.resolve(),
    saveEncounterNoteDraft: async () => null,
    saveVitals: async () => null,
    attachTranscript: async () => null,
    transcribeAudio: async () => null,
    generateSubjectiveDraft: async () => null,
    generateAssessmentPlanDraft: async () => null,
    finalizeEncounterNote: async () => null,
    completeVisit: async () => null,
    clearMessages: () => undefined,
};

export const ClinicianConsultationStateContext = createContext<IClinicianConsultationStateContext>(INITIAL_STATE);
export const ClinicianConsultationActionContext = createContext<IClinicianConsultationActionContext | undefined>(undefined);
