"use client";

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
    ISaveEncounterNoteDraftRequest,
    ISaveVitalsRequest,
    ITranscribeConsultationAudioRequest,
} from "@/services/consultation/types";
import {
    attachTranscriptFailed,
    attachTranscriptStarted,
    attachTranscriptSucceeded,
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

const parseResponse = async <TResponse,>(response: Response, fallbackMessage: string): Promise<TResponse> => {
    const body = (await response.json()) as TResponse & IMessageResponse;
    if (!response.ok) {
        throw new Error(body.message ?? fallbackMessage);
    }

    return body;
};

const loadQueueReview = async (queueTicketId: number): Promise<IClinicianQueueReview> => {
    const response = await fetch(`${API.CLINICIAN_QUEUE_TICKET_ROUTE_PREFIX}/${queueTicketId}`);
    return parseResponse<IClinicianQueueReview>(response, "Unable to load consultation handoff.");
};

const loadConsultationInbox = async (): Promise<IConsultationInbox> => {
    const response = await fetch(API.CLINICIAN_CONSULTATION_ROUTE);
    return parseResponse<IConsultationInbox>(response, "Unable to load clinician consultation list.");
};

const loadConsultationWorkspace = async (visitId: number, queueTicketId?: number): Promise<IConsultationWorkspace> => {
    const query = new URLSearchParams({ visitId: String(visitId) });
    if (queueTicketId) {
        query.set("queueTicketId", String(queueTicketId));
    }

    const response = await fetch(`${API.CLINICIAN_CONSULTATION_ROUTE}?${query.toString()}`);
    return parseResponse<IConsultationWorkspace>(response, "Unable to load consultation workspace.");
};

const postJson = async <TResponse,>(url: string, payload: object, fallbackMessage: string): Promise<TResponse> => {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    return parseResponse<TResponse>(response, fallbackMessage);
};

const postFormData = async <TResponse,>(url: string, payload: FormData, fallbackMessage: string): Promise<TResponse> => {
    const response = await fetch(url, {
        method: "POST",
        body: payload,
    });

    return parseResponse<TResponse>(response, fallbackMessage);
};

export const ClinicianConsultationProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, dispatch] = useReducer(clinicianConsultationReducer, INITIAL_STATE);

    const loadInbox = useCallback(async (): Promise<void> => {
        dispatch(loadInboxStarted());
        try {
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
        async (payload: ISaveEncounterNoteDraftRequest): Promise<IEncounterNote | null> => {
            dispatch(saveDraftStarted());
            try {
                const note = await postJson<IEncounterNote>(API.CLINICIAN_CONSULTATION_NOTE_ROUTE, payload, "Unable to save SOAP draft.");
                const workspace = await refreshWorkspace(payload.visitId);
                dispatch(saveDraftSucceeded(workspace, "Draft saved."));
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
        async (visitId: number): Promise<IEncounterNote | null> => {
            dispatch(finalizeStarted());
            try {
                const note = await postJson<IEncounterNote>(API.CLINICIAN_CONSULTATION_FINALIZE_ROUTE, { visitId }, "Unable to finalize note.");
                const workspace = await refreshWorkspace(visitId);
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
