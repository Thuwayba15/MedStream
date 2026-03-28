import { API } from "@/constants/api";
import { unwrapAbpResponse } from "@/lib/api/abp";
import { apiClient } from "@/lib/api/client";
import type {
    ICheckInResponse,
    IExtractSymptomsResponse,
    IGetQuestionsRequest,
    IIntakeQuestion,
    ISymptomCaptureRequest,
    ISymptomCaptureResponse,
    IUrgentCheckRequest,
    IUrgentCheckResponse,
    ITriageAssessRequest,
    ITriageResponse,
} from "./types";

const getAuthorizationHeader = (accessToken: string): { Authorization: string } => {
    return { Authorization: `Bearer ${accessToken}` };
};

const checkIn = async (accessToken: string): Promise<ICheckInResponse> => {
    const response = await apiClient.post(API.PATIENT_INTAKE_CHECKIN_ENDPOINT, {}, { headers: getAuthorizationHeader(accessToken) });
    return unwrapAbpResponse<ICheckInResponse>(response.data);
};

const captureSymptoms = async (payload: ISymptomCaptureRequest, accessToken: string): Promise<ISymptomCaptureResponse> => {
    const response = await apiClient.post(
        API.PATIENT_INTAKE_CAPTURE_SYMPTOMS_ENDPOINT,
        {
            visitId: payload.visitId,
            freeText: payload.freeText,
            selectedSymptoms: payload.selectedSymptoms,
        },
        { headers: getAuthorizationHeader(accessToken) }
    );
    return unwrapAbpResponse<ISymptomCaptureResponse>(response.data);
};

const extractSymptoms = async (payload: ISymptomCaptureRequest, accessToken: string): Promise<IExtractSymptomsResponse> => {
    const response = await apiClient.post(
        API.PATIENT_INTAKE_EXTRACT_SYMPTOMS_ENDPOINT,
        {
            visitId: payload.visitId,
            freeText: payload.freeText,
            selectedSymptoms: payload.selectedSymptoms,
        },
        { headers: getAuthorizationHeader(accessToken) }
    );
    return unwrapAbpResponse<IExtractSymptomsResponse>(response.data);
};

const getQuestions = async (payload: IGetQuestionsRequest, accessToken: string): Promise<IIntakeQuestion[]> => {
    const response = await apiClient.post(API.PATIENT_INTAKE_GET_QUESTIONS_ENDPOINT, payload, {
        headers: getAuthorizationHeader(accessToken),
    });
    const result = unwrapAbpResponse<{ questionSet: IIntakeQuestion[] }>(response.data);
    return result.questionSet ?? [];
};

const urgentCheck = async (payload: IUrgentCheckRequest, accessToken: string): Promise<IUrgentCheckResponse> => {
    const response = await apiClient.post(API.PATIENT_INTAKE_URGENT_CHECK_ENDPOINT, payload, {
        headers: getAuthorizationHeader(accessToken),
    });
    return unwrapAbpResponse<IUrgentCheckResponse>(response.data);
};

const assessTriage = async (payload: ITriageAssessRequest, accessToken: string): Promise<ITriageResponse> => {
    const response = await apiClient.post(
        API.PATIENT_INTAKE_ASSESS_TRIAGE_ENDPOINT,
        {
            visitId: payload.visitId,
            freeText: payload.freeText,
            selectedSymptoms: payload.selectedSymptoms,
            extractedPrimarySymptoms: payload.extractedPrimarySymptoms,
            answers: payload.answers,
        },
        { headers: getAuthorizationHeader(accessToken) }
    );
    return unwrapAbpResponse<ITriageResponse>(response.data);
};

export const patientIntakeService = {
    checkIn,
    captureSymptoms,
    extractSymptoms,
    getQuestions,
    urgentCheck,
    assessTriage,
};
