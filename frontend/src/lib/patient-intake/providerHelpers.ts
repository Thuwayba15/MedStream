import axios from "axios";
import { API } from "@/constants/api";
import { getVisibleQuestions } from "@/services/patient-intake/questionEngine";
import type { ICheckInResponse, IExtractSymptomsResponse, IIntakeQuestion, ISymptomCaptureRequest, ITriageResponse, IUrgentCheckResponse } from "@/services/patient-intake/types";

const PATIENT_QUEUE_STORAGE_KEY = "medstream.patient.queue";
const PATIENT_QUEUE_STORAGE_EVENT = "medstream:patient-queue-changed";

export interface IPersistedQueuedVisit {
    visitId: number;
    facilityName: string;
    selectedFacilityId: number | null;
    startedAt: string | null;
    pathwayKey: string;
}

interface IMessageResponse {
    message?: string;
}

interface IFacility {
    id: number;
    name: string;
}

interface IFacilitiesResponse {
    facilities: IFacility[];
}

export const logIntakeDebug = (message: string, payload?: unknown): void => {
    if (process.env.NODE_ENV === "production") {
        return;
    }

    if (payload === undefined) {
        return;
    }
};

export const readPersistedQueuedVisit = (): IPersistedQueuedVisit | null => {
    if (typeof window === "undefined") {
        return null;
    }

    try {
        const rawValue = window.localStorage.getItem(PATIENT_QUEUE_STORAGE_KEY);
        if (!rawValue) {
            return null;
        }

        return JSON.parse(rawValue) as IPersistedQueuedVisit;
    } catch {
        return null;
    }
};

export const clearPersistedQueuedVisit = (): void => {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.removeItem(PATIENT_QUEUE_STORAGE_KEY);
    window.dispatchEvent(new Event(PATIENT_QUEUE_STORAGE_EVENT));
};

export const persistQueuedVisit = (queuedVisit: IPersistedQueuedVisit): void => {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.setItem(PATIENT_QUEUE_STORAGE_KEY, JSON.stringify(queuedVisit));
    window.dispatchEvent(new Event(PATIENT_QUEUE_STORAGE_EVENT));
};

export const subscribeToPersistedQueuedVisit = (onStoreChange: () => void): (() => void) => {
    if (typeof window === "undefined") {
        return () => undefined;
    }

    const handleStorageChange = (event: Event) => {
        if (event instanceof StorageEvent && event.key && event.key !== PATIENT_QUEUE_STORAGE_KEY) {
            return;
        }

        onStoreChange();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(PATIENT_QUEUE_STORAGE_EVENT, handleStorageChange);

    return () => {
        window.removeEventListener("storage", handleStorageChange);
        window.removeEventListener(PATIENT_QUEUE_STORAGE_EVENT, handleStorageChange);
    };
};

const parseRouteError = (error: unknown, fallbackMessage: string): Error => {
    if (axios.isAxiosError<IMessageResponse>(error)) {
        return new Error(error.response?.data?.message ?? fallbackMessage);
    }

    return error instanceof Error ? error : new Error(fallbackMessage);
};

export const checkIn = async (): Promise<ICheckInResponse> => {
    try {
        const response = await axios.post<ICheckInResponse>(API.PATIENT_INTAKE_CHECKIN_ROUTE);
        return response.data;
    } catch (error) {
        throw parseRouteError(error, "Unable to start patient check-in.");
    }
};

export const getActiveFacilities = async (): Promise<IFacility[]> => {
    try {
        const response = await axios.get<IFacilitiesResponse>(API.ACTIVE_FACILITIES_ROUTE);
        return response.data.facilities ?? [];
    } catch (error) {
        throw parseRouteError(error, "Unable to load facilities.");
    }
};

export const submitSymptoms = async (payload: ISymptomCaptureRequest): Promise<void> => {
    try {
        await axios.post(API.PATIENT_INTAKE_SYMPTOMS_ROUTE, payload, {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        throw parseRouteError(error, "Unable to save symptoms.");
    }
};

export const extractSymptoms = async (payload: ISymptomCaptureRequest): Promise<IExtractSymptomsResponse> => {
    try {
        const response = await axios.post<IExtractSymptomsResponse>(API.PATIENT_INTAKE_EXTRACT_ROUTE, payload, {
            headers: { "Content-Type": "application/json" },
        });
        return response.data;
    } catch (error) {
        throw parseRouteError(error, "Unable to extract symptoms.");
    }
};

export const runUrgentCheck = async (payload: {
    visitId: number;
    pathwayKey: string;
    intakeMode: "approved_json" | "apc_fallback";
    freeText: string;
    selectedSymptoms: string[];
    extractedPrimarySymptoms: string[];
    fallbackSummaryIds: string[];
    answers: Record<string, string | number | boolean | string[]>;
}): Promise<IUrgentCheckResponse> => {
    try {
        const response = await axios.post<IUrgentCheckResponse>(API.PATIENT_INTAKE_URGENT_CHECK_ROUTE, payload, {
            headers: { "Content-Type": "application/json" },
        });
        return response.data;
    } catch (error) {
        throw parseRouteError(error, "Unable to run urgent check.");
    }
};

export const loadQuestions = async (payload: {
    visitId: number;
    pathwayKey: string;
    primarySymptom: string | null;
    freeText: string;
    selectedSymptoms: string[];
    extractedPrimarySymptoms: string[];
    fallbackSummaryIds: string[];
    useApcFallback: boolean;
    answers: Record<string, string | number | boolean | string[]>;
}): Promise<IIntakeQuestion[]> => {
    try {
        const response = await axios.post<{ questionSet: IIntakeQuestion[] }>(API.PATIENT_INTAKE_QUESTIONS_ROUTE, payload, {
            headers: { "Content-Type": "application/json" },
        });
        return response.data.questionSet ?? [];
    } catch (error) {
        throw parseRouteError(error, "Unable to load follow-up questions.");
    }
};

export const assessTriage = async (payload: {
    visitId: number;
    freeText: string;
    selectedSymptoms: string[];
    extractedPrimarySymptoms: string[];
    answers: Record<string, string | number | boolean | string[]>;
}): Promise<ITriageResponse> => {
    try {
        const response = await axios.post<ITriageResponse>(API.PATIENT_INTAKE_TRIAGE_ROUTE, payload, {
            headers: { "Content-Type": "application/json" },
        });
        return response.data;
    } catch (error) {
        throw parseRouteError(error, "Unable to generate triage result.");
    }
};

export const getCurrentQueueStatus = async (visitId: number): Promise<ITriageResponse> => {
    try {
        const response = await axios.get<ITriageResponse>(API.PATIENT_INTAKE_QUEUE_STATUS_ROUTE, {
            params: { visitId },
        });
        return response.data;
    } catch (error) {
        throw parseRouteError(error, "Unable to load current queue status.");
    }
};

export const getMissingUrgentQuestion = (questionSet: IIntakeQuestion[], answers: Record<string, string | number | boolean | string[]>): IIntakeQuestion | undefined => {
    return questionSet.find((question) => question.isRequired && (answers[question.questionKey] === undefined || answers[question.questionKey] === null || answers[question.questionKey] === ""));
};

export const getMissingFollowUpQuestion = (
    questionSet: IIntakeQuestion[],
    answers: Record<string, string | number | boolean | string[]>,
    extractedPrimarySymptoms: string[]
): IIntakeQuestion | undefined => {
    const visibleQuestions = getVisibleQuestions(questionSet, answers, extractedPrimarySymptoms);
    return visibleQuestions.find((question) => {
        if (!question.isRequired) {
            return false;
        }

        const answer = answers[question.questionKey];
        if (question.inputType === "MultiSelect") {
            return !Array.isArray(answer) || answer.length === 0;
        }

        if (question.inputType === "Text") {
            return !String(answer ?? "").trim();
        }

        if (question.inputType === "Number") {
            return answer === undefined || answer === null || String(answer).trim() === "";
        }

        return answer === undefined || answer === null || String(answer).trim() === "";
    });
};
