import { API } from "@/constants/api";
import { unwrapAbpResponse } from "@/lib/api/abp";
import { apiClient } from "@/lib/api/client";
import type {
    IAttachConsultationTranscriptRequest,
    IConsultationAiDraft,
    IConsultationInbox,
    IConsultationTranscript,
    IConsultationVitalSigns,
    IConsultationWorkspace,
    IFinalizeEncounterNoteRequest,
    IGetConsultationWorkspaceRequest,
    IEncounterNote,
    ISaveEncounterNoteDraftRequest,
    ISaveVitalsRequest,
} from "./types";

const getAuthorizationHeader = (accessToken: string): { Authorization: string } => {
    return { Authorization: `Bearer ${accessToken}` };
};

const getConsultationInbox = async (accessToken: string): Promise<IConsultationInbox> => {
    const response = await apiClient.get(API.CONSULTATION_GET_INBOX_ENDPOINT, {
        headers: getAuthorizationHeader(accessToken),
    });

    return unwrapAbpResponse<IConsultationInbox>(response.data);
};

const getConsultationWorkspace = async (payload: IGetConsultationWorkspaceRequest, accessToken: string): Promise<IConsultationWorkspace> => {
    const response = await apiClient.get(API.CONSULTATION_GET_WORKSPACE_ENDPOINT, {
        params: {
            visitId: payload.visitId,
            queueTicketId: payload.queueTicketId,
        },
        headers: getAuthorizationHeader(accessToken),
    });

    return unwrapAbpResponse<IConsultationWorkspace>(response.data);
};

const saveVitals = async (payload: ISaveVitalsRequest, accessToken: string): Promise<IConsultationVitalSigns> => {
    const response = await apiClient.post(API.CONSULTATION_SAVE_VITALS_ENDPOINT, payload, {
        headers: getAuthorizationHeader(accessToken),
    });

    return unwrapAbpResponse<IConsultationVitalSigns>(response.data);
};

const saveEncounterNoteDraft = async (payload: ISaveEncounterNoteDraftRequest, accessToken: string): Promise<IEncounterNote> => {
    const response = await apiClient.post(API.CONSULTATION_SAVE_NOTE_DRAFT_ENDPOINT, payload, {
        headers: getAuthorizationHeader(accessToken),
    });

    return unwrapAbpResponse<IEncounterNote>(response.data);
};

const attachConsultationTranscript = async (payload: IAttachConsultationTranscriptRequest, accessToken: string): Promise<IConsultationTranscript> => {
    const response = await apiClient.post(API.CONSULTATION_ATTACH_TRANSCRIPT_ENDPOINT, payload, {
        headers: getAuthorizationHeader(accessToken),
    });

    return unwrapAbpResponse<IConsultationTranscript>(response.data);
};

const generateSubjectiveDraft = async (visitId: number, accessToken: string): Promise<IConsultationAiDraft> => {
    const response = await apiClient.post(
        API.CONSULTATION_GENERATE_SUBJECTIVE_ENDPOINT,
        { visitId },
        {
            headers: getAuthorizationHeader(accessToken),
        }
    );

    return unwrapAbpResponse<IConsultationAiDraft>(response.data);
};

const generateAssessmentPlanDraft = async (visitId: number, accessToken: string): Promise<IConsultationAiDraft> => {
    const response = await apiClient.post(
        API.CONSULTATION_GENERATE_ASSESSMENT_PLAN_ENDPOINT,
        { visitId },
        {
            headers: getAuthorizationHeader(accessToken),
        }
    );

    return unwrapAbpResponse<IConsultationAiDraft>(response.data);
};

const finalizeEncounterNote = async (payload: IFinalizeEncounterNoteRequest, accessToken: string): Promise<IEncounterNote> => {
    const response = await apiClient.post(
        API.CONSULTATION_FINALIZE_NOTE_ENDPOINT,
        payload,
        {
            headers: getAuthorizationHeader(accessToken),
        }
    );

    return unwrapAbpResponse<IEncounterNote>(response.data);
};

export const consultationService = {
    getConsultationInbox,
    getConsultationWorkspace,
    saveVitals,
    saveEncounterNoteDraft,
    attachConsultationTranscript,
    generateSubjectiveDraft,
    generateAssessmentPlanDraft,
    finalizeEncounterNote,
};
