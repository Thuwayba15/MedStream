"use client";

import { createContext } from "react";
import type { IAssessTriageFollowUpQuestion, IExtractSymptomsResponse, IFollowUpPlan, IIntakeQuestion, ITriageResponse } from "@/services/patient-intake/types";

export interface IPatientIntakeStateContext {
    currentStep: number;
    visitId: number | null;
    facilityName: string;
    availableFacilities: Array<{ id: number; name: string }>;
    selectedFacilityId: number | null;
    startedAt: string | null;
    pathwayKey: string;
    freeText: string;
    selectedSymptoms: string[];
    extractedPrimarySymptoms: string[];
    extractionSource: IExtractSymptomsResponse["extractionSource"] | null;
    likelyPathwayIds: string[];
    intakeMode: "approved_json" | "apc_fallback";
    fallbackSummaryIds: string[];
    fallbackSectionIds: string[];
    urgentMessage: string | null;
    urgentQuestionSet: IIntakeQuestion[];
    urgentTriggered: boolean;
    followUpPlans: IFollowUpPlan[];
    currentFollowUpPlanIndex: number;
    askedFollowUpQuestions: IAssessTriageFollowUpQuestion[];
    questionSet: IIntakeQuestion[];
    answers: Record<string, string | number | boolean | string[]>;
    triage: ITriageResponse["triage"] | null;
    queue: ITriageResponse["queue"] | null;
    isInitializing: boolean;
    isProcessing: boolean;
    errorMessage?: string;
}

export interface IPatientIntakeActionContext {
    initializeFlow: () => Promise<void>;
    setFreeText: (value: string) => void;
    setSelectedFacilityId: (value: number) => void;
    toggleSymptom: (value: string) => void;
    setAnswer: (questionKey: string, value: string | number | boolean | string[]) => void;
    continueStep: () => Promise<void>;
    backStep: () => void;
    goToStep: (step: number) => void;
    clearError: () => void;
    startNewVisitDraft: () => void;
    resetFlow: () => Promise<void>;
}

export const INITIAL_STATE: IPatientIntakeStateContext = {
    currentStep: 0,
    visitId: null,
    facilityName: "",
    availableFacilities: [],
    selectedFacilityId: null,
    startedAt: null,
    pathwayKey: "",
    freeText: "",
    selectedSymptoms: [],
    extractedPrimarySymptoms: [],
    extractionSource: null,
    likelyPathwayIds: [],
    intakeMode: "approved_json",
    fallbackSummaryIds: [],
    fallbackSectionIds: [],
    urgentMessage: null,
    urgentQuestionSet: [],
    urgentTriggered: false,
    followUpPlans: [],
    currentFollowUpPlanIndex: 0,
    askedFollowUpQuestions: [],
    questionSet: [],
    answers: {},
    triage: null,
    queue: null,
    isInitializing: false,
    isProcessing: false,
    errorMessage: undefined,
};

export const INITIAL_ACTIONS: IPatientIntakeActionContext = {
    initializeFlow: async () => Promise.resolve(),
    setFreeText: () => undefined,
    setSelectedFacilityId: () => undefined,
    toggleSymptom: () => undefined,
    setAnswer: () => undefined,
    continueStep: async () => Promise.resolve(),
    backStep: () => undefined,
    goToStep: () => undefined,
    clearError: () => undefined,
    startNewVisitDraft: () => undefined,
    resetFlow: async () => Promise.resolve(),
};

export const PatientIntakeStateContext = createContext<IPatientIntakeStateContext>(INITIAL_STATE);
export const PatientIntakeActionContext = createContext<IPatientIntakeActionContext | undefined>(undefined);
