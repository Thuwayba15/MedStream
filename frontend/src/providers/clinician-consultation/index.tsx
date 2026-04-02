"use client";

import axios from "axios";
import { useCallback, useContext, useMemo, useReducer } from "react";
import { API } from "@/constants/api";
import type { IClinicianQueueReview, IUpdateQueueStatusResponse } from "@/services/queue-operations/types";
import type {
    IAttachConsultationTranscriptRequest,
    IConsultationAiDraft,
    IConsultationInbox,
    IConsultationTranscript,
    IConsultationVitalSigns,
    IConsultationWorkspace,
    IEncounterNote,
    IFinalizeEncounterNoteRequest,
    ISaveEncounterNoteDraftRequest,
    ISaveVitalsRequest,
    ITranscribeConsultationAudioRequest,
} from "@/services/consultation/types";
import {
    attachTranscriptFailed,
    attachTranscriptStarted,
    attachTranscriptSucceeded,
    clearActiveConsultation,
    clearMessages,
    completeVisitFailed,
    completeVisitStarted,
    completeVisitSucceeded,
    finalizeFailed,
    finalizeStarted,
    finalizeSucceeded,
    generateAssessmentPlanFailed,
    generateAssessmentPlanStarted,
    generateAssessmentPlanSucceeded,
    generateSubjectiveFailed,
    generateSubjectiveStarted,
    generateSubjectiveSucceeded,
    loadInboxFailed,
    loadInboxStarted,
    loadInboxSucceeded,
    loadWorkspaceFailed,
    loadWorkspaceStarted,
    loadWorkspaceSucceeded,
    saveDraftFailed,
    saveDraftStarted,
    saveDraftSucceeded,
    saveVitalsFailed,
    saveVitalsStarted,
    saveVitalsSucceeded,
} from "./actions";
import {
    ClinicianConsultationActionContext,
    ClinicianConsultationStateContext,
    INITIAL_STATE,
    type IClinicianConsultationActionContext,
    type IClinicianConsultationStateContext,
    type ILoadConsultationWorkspaceInput,
} from "./context";
import { clinicianConsultationReducer } from "./reducer";

interface IMessageResponse {
    message?: string;
}

const parseRouteError = (error: unknown, fallbackMessage: string): Error => {
    if (axios.isAxiosError<IMessageResponse>(error)) {
        return new Error(error.response?.data?.message ?? fallbackMessage);
    }

    return error instanceof Error ? error : new Error(fallbackMessage);
};

const loadQueueReview = async (queueTicketId: number): Promise<IClinicianQueueReview> => {
    const response = await axios.get<IClinicianQueueReview>(`${API.CLINICIAN_QUEUE_TICKET_ROUTE_PREFIX}/${queueTicketId}`);
    return response.data;
};

const loadConsultationInbox = async (): Promise<IConsultationInbox> => {
    const response = await axios.get<IConsultationInbox>(API.CLINICIAN_CONSULTATION_ROUTE);
    return response.data;
};

const loadConsultationWorkspace = async (visitId: number, queueTicketId?: number): Promise<IConsultationWorkspace> => {
    const query = new URLSearchParams({ visitId: String(visitId) });
    if (queueTicketId) {
        query.set("queueTicketId", String(queueTicketId));
    }

    const response = await axios.get<IConsultationWorkspace>(`${API.CLINICIAN_CONSULTATION_ROUTE}?${query.toString()}`);
    return response.data;
};

const postJson = async <TResponse,>(url: string, payload: object, fallbackMessage: string): Promise<TResponse> => {
    try {
        const response = await axios.post<TResponse>(url, payload);
        return response.data;
    } catch (error) {
        throw parseRouteError(error, fallbackMessage);
    }
};

const postFormData = async <TResponse,>(url: string, payload: FormData, fallbackMessage: string): Promise<TResponse> => {
    try {
        const response = await axios.post<TResponse>(url, payload);
        return response.data;
    } catch (error) {
        throw parseRouteError(error, fallbackMessage);
    }
};

export const ClinicianConsultationProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, dispatch] = useReducer(clinicianConsultationReducer, INITIAL_STATE);

    const loadInbox = useCallback(async (): Promise<void> => {
        dispatch(loadInboxStarted());
        try {
            // Get Consultation Inbox
            // GET /api/clinician/consultation
            const inbox = await loadConsultationInbox();
            dispatch(loadInboxSucceeded(inbox));
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to load clinician consultation list.";
            dispatch(loadInboxFailed(message));
        }
    }, []);

    const refreshWorkspace = useCallback(
        async (visitId: number, queueTicketId?: number): Promise<IConsultationWorkspace> => {
            return loadConsultationWorkspace(visitId, queueTicketId ?? state.review?.queueTicketId ?? state.workspace?.queueTicketId ?? undefined);
        },
        [state.review?.queueTicketId, state.workspace?.queueTicketId]
    );

    const loadWorkspace = useCallback(async (input: ILoadConsultationWorkspaceInput): Promise<void> => {
        dispatch(loadWorkspaceStarted());
        try {
            // Get Consultation Workspace
            // GET /api/clinician/consultation
            const [workspace, review] = await Promise.all([
                loadConsultationWorkspace(input.visitId, input.queueTicketId),
                input.queueTicketId ? loadQueueReview(input.queueTicketId) : Promise.resolve(null),
            ]);

            dispatch(loadWorkspaceSucceeded(workspace, review));
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to load consultation workspace.";
            dispatch(loadWorkspaceFailed(message));
        }
    }, []);

    const saveEncounterNoteDraft = useCallback(
        async (payload: ISaveEncounterNoteDraftRequest, options?: { suppressSuccessMessage?: boolean }): Promise<IEncounterNote | null> => {
            dispatch(saveDraftStarted());
            try {
                // Save Encounter Note Draft
                // POST /api/clinician/consultation/note
                const note = await postJson<IEncounterNote>(API.CLINICIAN_CONSULTATION_NOTE_ROUTE, payload, "Unable to save SOAP draft.");
                const workspace = await refreshWorkspace(payload.visitId);
                dispatch(saveDraftSucceeded(workspace, options?.suppressSuccessMessage ? "" : "Draft saved."));
                return note;
            } catch (error) {
                const message = error instanceof Error ? error.message : "Unable to save SOAP draft.";
                dispatch(saveDraftFailed(message));
                return null;
            }
        },
        [refreshWorkspace]
    );

    const saveVitals = useCallback(
        async (payload: ISaveVitalsRequest): Promise<IConsultationVitalSigns | null> => {
            dispatch(saveVitalsStarted());
            try {
                // Save Consultation Vitals
                // POST /api/clinician/consultation/vitals
                const vitals = await postJson<IConsultationVitalSigns>(API.CLINICIAN_CONSULTATION_VITALS_ROUTE, payload, "Unable to save vitals.");
                const workspace = await refreshWorkspace(payload.visitId);
                dispatch(saveVitalsSucceeded(workspace));
                return vitals;
            } catch (error) {
                const message = error instanceof Error ? error.message : "Unable to save vitals.";
                dispatch(saveVitalsFailed(message));
                return null;
            }
        },
        [refreshWorkspace]
    );

    const attachTranscript = useCallback(
        async (payload: IAttachConsultationTranscriptRequest): Promise<IConsultationTranscript | null> => {
            dispatch(attachTranscriptStarted());
            try {
                // Attach Consultation Transcript
                // POST /api/clinician/consultation/transcript
                const transcript = await postJson<IConsultationTranscript>(API.CLINICIAN_CONSULTATION_TRANSCRIPT_ROUTE, payload, "Unable to attach consultation transcript.");
                const workspace = await refreshWorkspace(payload.visitId);
                dispatch(attachTranscriptSucceeded(workspace));
                return transcript;
            } catch (error) {
                const message = error instanceof Error ? error.message : "Unable to attach consultation transcript.";
                dispatch(attachTranscriptFailed(message));
                return null;
            }
        },
        [refreshWorkspace]
    );

    const transcribeAudio = useCallback(
        async (payload: ITranscribeConsultationAudioRequest): Promise<IConsultationTranscript | null> => {
            dispatch(attachTranscriptStarted());
            try {
                const formData = new FormData();
                formData.append("visitId", String(payload.visitId));
                formData.append("audio", payload.audioBlob, `consultation.${payload.mimeType?.includes("mp4") ? "mp4" : "webm"}`);
                if (payload.language?.trim()) {
                    formData.append("language", payload.language.trim());
                }

                // Transcribe Consultation Audio
                // POST /api/clinician/consultation/transcript
                const transcript = await postFormData<IConsultationTranscript>(API.CLINICIAN_CONSULTATION_TRANSCRIPT_ROUTE, formData, "Unable to transcribe consultation audio.");
                const workspace = await refreshWorkspace(payload.visitId);
                dispatch(attachTranscriptSucceeded(workspace));
                return transcript;
            } catch (error) {
                const message = error instanceof Error ? error.message : "Unable to transcribe consultation audio.";
                dispatch(attachTranscriptFailed(message));
                return null;
            }
        },
        [refreshWorkspace]
    );

    const generateSubjectiveDraft = useCallback(async (visitId: number): Promise<IConsultationAiDraft | null> => {
        dispatch(generateSubjectiveStarted());
        try {
            // Generate Subjective Draft
            // POST /api/clinician/consultation/drafts/subjective
            const draft = await postJson<IConsultationAiDraft>(API.CLINICIAN_CONSULTATION_SUBJECTIVE_DRAFT_ROUTE, { visitId }, "Unable to generate subjective draft.");
            dispatch(generateSubjectiveSucceeded(draft));
            return draft;
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to generate subjective draft.";
            dispatch(generateSubjectiveFailed(message));
            return null;
        }
    }, []);

    const generateAssessmentPlanDraft = useCallback(async (visitId: number): Promise<IConsultationAiDraft | null> => {
        dispatch(generateAssessmentPlanStarted());
        try {
            // Generate Assessment And Plan Draft
            // POST /api/clinician/consultation/drafts/assessment-plan
            const draft = await postJson<IConsultationAiDraft>(API.CLINICIAN_CONSULTATION_ASSESSMENT_PLAN_DRAFT_ROUTE, { visitId }, "Unable to generate assessment and plan draft.");
            dispatch(generateAssessmentPlanSucceeded(draft));
            return draft;
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to generate assessment and plan draft.";
            dispatch(generateAssessmentPlanFailed(message));
            return null;
        }
    }, []);

    const finalizeEncounterNote = useCallback(
        async (payload: IFinalizeEncounterNoteRequest): Promise<IEncounterNote | null> => {
            dispatch(finalizeStarted());
            try {
                // Finalize Encounter Note
                // POST /api/clinician/consultation/finalize
                const note = await postJson<IEncounterNote>(API.CLINICIAN_CONSULTATION_FINALIZE_ROUTE, payload, "Unable to finalize note.");
                const workspace = await refreshWorkspace(payload.visitId);
                dispatch(finalizeSucceeded(workspace));
                return note;
            } catch (error) {
                const message = error instanceof Error ? error.message : "Unable to finalize note.";
                dispatch(finalizeFailed(message));
                return null;
            }
        },
        [refreshWorkspace]
    );

    const completeVisit = useCallback(async (queueTicketId: number): Promise<IUpdateQueueStatusResponse | null> => {
        dispatch(completeVisitStarted());
        try {
            // Complete Consultation Visit
            // POST /api/clinician/queue/{queueTicketId}/status
            const result = await postJson<IUpdateQueueStatusResponse>(
                `${API.CLINICIAN_QUEUE_TICKET_ROUTE_PREFIX}/${queueTicketId}/status`,
                { newStatus: "completed" },
                "Unable to complete consultation."
            );
            const review = await loadQueueReview(queueTicketId);
            dispatch(completeVisitSucceeded(review, result));
            return result;
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to complete consultation.";
            dispatch(completeVisitFailed(message));
            return null;
        }
    }, []);

    const actions: IClinicianConsultationActionContext = useMemo(
        () => ({
            loadInbox,
            loadWorkspace,
            saveEncounterNoteDraft,
            saveVitals,
            attachTranscript,
            transcribeAudio,
            generateSubjectiveDraft,
            generateAssessmentPlanDraft,
            finalizeEncounterNote,
            completeVisit,
            clearActiveConsultation: () => dispatch(clearActiveConsultation()),
            clearMessages: () => dispatch(clearMessages()),
        }),
        [attachTranscript, completeVisit, finalizeEncounterNote, generateAssessmentPlanDraft, generateSubjectiveDraft, loadInbox, loadWorkspace, saveEncounterNoteDraft, saveVitals, transcribeAudio]
    );

    return (
        <ClinicianConsultationStateContext.Provider value={state}>
            <ClinicianConsultationActionContext.Provider value={actions}>{children}</ClinicianConsultationActionContext.Provider>
        </ClinicianConsultationStateContext.Provider>
    );
};

export const useClinicianConsultationState = (): IClinicianConsultationStateContext => {
    return useContext(ClinicianConsultationStateContext);
};

export const useClinicianConsultationActions = (): IClinicianConsultationActionContext => {
    const context = useContext(ClinicianConsultationActionContext);
    if (!context) {
        throw new Error("useClinicianConsultationActions must be used within a ClinicianConsultationProvider.");
    }

    return context;
};
