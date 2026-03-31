import { createAction } from "redux-actions";
import type { IClinicianConsultationStateContext } from "./context";
import type { IClinicianQueueReview, IUpdateQueueStatusResponse } from "@/services/queue-operations/types";
import type {
    IConsultationAiDraft,
    IConsultationTranscript,
    IConsultationVitalSigns,
    IConsultationWorkspace,
    IEncounterNote,
} from "@/services/consultation/types";

export enum ClinicianConsultationActionEnums {
    loadWorkspaceStarted = "CLINICIAN_CONSULTATION_LOAD_STARTED",
    loadWorkspaceSucceeded = "CLINICIAN_CONSULTATION_LOAD_SUCCEEDED",
    loadWorkspaceFailed = "CLINICIAN_CONSULTATION_LOAD_FAILED",
    saveDraftStarted = "CLINICIAN_CONSULTATION_SAVE_DRAFT_STARTED",
    saveDraftSucceeded = "CLINICIAN_CONSULTATION_SAVE_DRAFT_SUCCEEDED",
    saveDraftFailed = "CLINICIAN_CONSULTATION_SAVE_DRAFT_FAILED",
    saveVitalsStarted = "CLINICIAN_CONSULTATION_SAVE_VITALS_STARTED",
    saveVitalsSucceeded = "CLINICIAN_CONSULTATION_SAVE_VITALS_SUCCEEDED",
    saveVitalsFailed = "CLINICIAN_CONSULTATION_SAVE_VITALS_FAILED",
    attachTranscriptStarted = "CLINICIAN_CONSULTATION_ATTACH_TRANSCRIPT_STARTED",
    attachTranscriptSucceeded = "CLINICIAN_CONSULTATION_ATTACH_TRANSCRIPT_SUCCEEDED",
    attachTranscriptFailed = "CLINICIAN_CONSULTATION_ATTACH_TRANSCRIPT_FAILED",
    generateSubjectiveStarted = "CLINICIAN_CONSULTATION_GENERATE_SUBJECTIVE_STARTED",
    generateSubjectiveSucceeded = "CLINICIAN_CONSULTATION_GENERATE_SUBJECTIVE_SUCCEEDED",
    generateSubjectiveFailed = "CLINICIAN_CONSULTATION_GENERATE_SUBJECTIVE_FAILED",
    generateAssessmentPlanStarted = "CLINICIAN_CONSULTATION_GENERATE_AP_STARTED",
    generateAssessmentPlanSucceeded = "CLINICIAN_CONSULTATION_GENERATE_AP_SUCCEEDED",
    generateAssessmentPlanFailed = "CLINICIAN_CONSULTATION_GENERATE_AP_FAILED",
    finalizeStarted = "CLINICIAN_CONSULTATION_FINALIZE_STARTED",
    finalizeSucceeded = "CLINICIAN_CONSULTATION_FINALIZE_SUCCEEDED",
    finalizeFailed = "CLINICIAN_CONSULTATION_FINALIZE_FAILED",
    completeVisitStarted = "CLINICIAN_CONSULTATION_COMPLETE_VISIT_STARTED",
    completeVisitSucceeded = "CLINICIAN_CONSULTATION_COMPLETE_VISIT_SUCCEEDED",
    completeVisitFailed = "CLINICIAN_CONSULTATION_COMPLETE_VISIT_FAILED",
    clearMessages = "CLINICIAN_CONSULTATION_CLEAR_MESSAGES",
}

export interface IClinicianConsultationStateAction {
    type: ClinicianConsultationActionEnums;
    payload: IClinicianConsultationStatePayload;
}

export type IClinicianConsultationStatePayload = Partial<IClinicianConsultationStateContext>;

export const loadWorkspaceStarted = createAction<IClinicianConsultationStatePayload>(ClinicianConsultationActionEnums.loadWorkspaceStarted, () => ({
    isLoadingWorkspace: true,
    errorMessage: undefined,
    successMessage: undefined,
}));

export const loadWorkspaceSucceeded = createAction<IClinicianConsultationStatePayload, IConsultationWorkspace, IClinicianQueueReview | null>(
    ClinicianConsultationActionEnums.loadWorkspaceSucceeded,
    (workspace, review) => ({
        workspace,
        review,
        isLoadingWorkspace: false,
        errorMessage: undefined,
    })
);

export const loadWorkspaceFailed = createAction<IClinicianConsultationStatePayload, string>(ClinicianConsultationActionEnums.loadWorkspaceFailed, (message) => ({
    isLoadingWorkspace: false,
    errorMessage: message,
}));

export const saveDraftStarted = createAction<IClinicianConsultationStatePayload>(ClinicianConsultationActionEnums.saveDraftStarted, () => ({
    isSavingDraft: true,
    errorMessage: undefined,
    successMessage: undefined,
}));

export const saveDraftSucceeded = createAction<IClinicianConsultationStatePayload, IConsultationWorkspace, string>(
    ClinicianConsultationActionEnums.saveDraftSucceeded,
    (workspace, message) => ({
        workspace,
        isSavingDraft: false,
        successMessage: message,
        errorMessage: undefined,
    })
);

export const saveDraftFailed = createAction<IClinicianConsultationStatePayload, string>(ClinicianConsultationActionEnums.saveDraftFailed, (message) => ({
    isSavingDraft: false,
    errorMessage: message,
}));

export const saveVitalsStarted = createAction<IClinicianConsultationStatePayload>(ClinicianConsultationActionEnums.saveVitalsStarted, () => ({
    isSavingVitals: true,
    errorMessage: undefined,
    successMessage: undefined,
}));

export const saveVitalsSucceeded = createAction<IClinicianConsultationStatePayload, IConsultationWorkspace>(
    ClinicianConsultationActionEnums.saveVitalsSucceeded,
    (workspace) => ({
        workspace,
        isSavingVitals: false,
        successMessage: "Vitals updated for this consultation.",
        errorMessage: undefined,
    })
);

export const saveVitalsFailed = createAction<IClinicianConsultationStatePayload, string>(ClinicianConsultationActionEnums.saveVitalsFailed, (message) => ({
    isSavingVitals: false,
    errorMessage: message,
}));

export const attachTranscriptStarted = createAction<IClinicianConsultationStatePayload>(ClinicianConsultationActionEnums.attachTranscriptStarted, () => ({
    isAttachingTranscript: true,
    errorMessage: undefined,
    successMessage: undefined,
}));

export const attachTranscriptSucceeded = createAction<IClinicianConsultationStatePayload, IConsultationWorkspace>(
    ClinicianConsultationActionEnums.attachTranscriptSucceeded,
    (workspace) => ({
        workspace,
        isAttachingTranscript: false,
        successMessage: "Consultation transcript attached.",
        errorMessage: undefined,
    })
);

export const attachTranscriptFailed = createAction<IClinicianConsultationStatePayload, string>(
    ClinicianConsultationActionEnums.attachTranscriptFailed,
    (message) => ({
        isAttachingTranscript: false,
        errorMessage: message,
    })
);

export const generateSubjectiveStarted = createAction<IClinicianConsultationStatePayload>(ClinicianConsultationActionEnums.generateSubjectiveStarted, () => ({
    isGeneratingSubjective: true,
    errorMessage: undefined,
    successMessage: undefined,
}));

export const generateSubjectiveSucceeded = createAction<IClinicianConsultationStatePayload, IConsultationAiDraft>(
    ClinicianConsultationActionEnums.generateSubjectiveSucceeded,
    (subjectiveDraft) => ({
        subjectiveDraft,
        isGeneratingSubjective: false,
        successMessage: "Updated subjective draft is ready for review.",
        errorMessage: undefined,
    })
);

export const generateSubjectiveFailed = createAction<IClinicianConsultationStatePayload, string>(
    ClinicianConsultationActionEnums.generateSubjectiveFailed,
    (message) => ({
        isGeneratingSubjective: false,
        errorMessage: message,
    })
);

export const generateAssessmentPlanStarted = createAction<IClinicianConsultationStatePayload>(ClinicianConsultationActionEnums.generateAssessmentPlanStarted, () => ({
    isGeneratingAssessmentPlan: true,
    errorMessage: undefined,
    successMessage: undefined,
}));

export const generateAssessmentPlanSucceeded = createAction<IClinicianConsultationStatePayload, IConsultationAiDraft>(
    ClinicianConsultationActionEnums.generateAssessmentPlanSucceeded,
    (assessmentPlanDraft) => ({
        assessmentPlanDraft,
        isGeneratingAssessmentPlan: false,
        successMessage: "Assessment and plan draft generated for review.",
        errorMessage: undefined,
    })
);

export const generateAssessmentPlanFailed = createAction<IClinicianConsultationStatePayload, string>(
    ClinicianConsultationActionEnums.generateAssessmentPlanFailed,
    (message) => ({
        isGeneratingAssessmentPlan: false,
        errorMessage: message,
    })
);

export const finalizeStarted = createAction<IClinicianConsultationStatePayload>(ClinicianConsultationActionEnums.finalizeStarted, () => ({
    isFinalizing: true,
    errorMessage: undefined,
    successMessage: undefined,
}));

export const finalizeSucceeded = createAction<IClinicianConsultationStatePayload, IConsultationWorkspace>(
    ClinicianConsultationActionEnums.finalizeSucceeded,
    (workspace) => ({
        workspace,
        isFinalizing: false,
        successMessage: "SOAP note finalized.",
        errorMessage: undefined,
    })
);

export const finalizeFailed = createAction<IClinicianConsultationStatePayload, string>(ClinicianConsultationActionEnums.finalizeFailed, (message) => ({
    isFinalizing: false,
    errorMessage: message,
}));

export const completeVisitStarted = createAction<IClinicianConsultationStatePayload>(ClinicianConsultationActionEnums.completeVisitStarted, () => ({
    isCompletingVisit: true,
    errorMessage: undefined,
    successMessage: undefined,
}));

export const completeVisitSucceeded = createAction<IClinicianConsultationStatePayload, IClinicianQueueReview | null, IUpdateQueueStatusResponse>(
    ClinicianConsultationActionEnums.completeVisitSucceeded,
    (review, result) => ({
        review,
        isCompletingVisit: false,
        successMessage: `Consultation marked ${result.newStatus.replace("_", " ")}.`,
        errorMessage: undefined,
    })
);

export const completeVisitFailed = createAction<IClinicianConsultationStatePayload, string>(ClinicianConsultationActionEnums.completeVisitFailed, (message) => ({
    isCompletingVisit: false,
    errorMessage: message,
}));

export const clearMessages = createAction<IClinicianConsultationStatePayload>(ClinicianConsultationActionEnums.clearMessages, () => ({
    errorMessage: undefined,
    successMessage: undefined,
}));
