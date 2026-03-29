import { createAction } from "redux-actions";
import type { ICheckInResponse, IExtractSymptomsResponse, IIntakeQuestion, ITriageResponse, IUrgentCheckResponse } from "@/services/patient-intake/types";
import type { IPatientIntakeStateContext } from "./context";

export enum PatientIntakeActionEnums {
    initializeStarted = "PATIENT_INTAKE_INITIALIZE_STARTED",
    initializeSucceeded = "PATIENT_INTAKE_INITIALIZE_SUCCEEDED",
    processingStarted = "PATIENT_INTAKE_PROCESSING_STARTED",
    setStep = "PATIENT_INTAKE_SET_STEP",
    setFreeText = "PATIENT_INTAKE_SET_FREE_TEXT",
    setSelectedFacilityId = "PATIENT_INTAKE_SET_SELECTED_FACILITY_ID",
    toggleSymptom = "PATIENT_INTAKE_TOGGLE_SYMPTOM",
    setAnswer = "PATIENT_INTAKE_SET_ANSWER",
    symptomProcessingSucceeded = "PATIENT_INTAKE_SYMPTOM_PROCESSING_SUCCEEDED",
    urgentCheckSucceeded = "PATIENT_INTAKE_URGENT_CHECK_SUCCEEDED",
    followUpQuestionsLoaded = "PATIENT_INTAKE_FOLLOW_UP_QUESTIONS_LOADED",
    triageSucceeded = "PATIENT_INTAKE_TRIAGE_SUCCEEDED",
    actionFailed = "PATIENT_INTAKE_ACTION_FAILED",
    clearError = "PATIENT_INTAKE_CLEAR_ERROR",
}

export interface IPatientIntakeStateAction {
    type: PatientIntakeActionEnums;
    payload: IPatientIntakeStatePayload;
}

export type IPatientIntakeStatePayload = Partial<IPatientIntakeStateContext>;

export const initializeStarted = createAction<IPatientIntakeStatePayload>(PatientIntakeActionEnums.initializeStarted, () => ({
    freeText: "",
    selectedFacilityId: null,
    availableFacilities: [],
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
    questionSet: [],
    answers: {},
    triage: null,
    queue: null,
    isInitializing: true,
    errorMessage: undefined,
}));

export const initializeSucceeded = createAction<
    IPatientIntakeStatePayload,
    ICheckInResponse,
    Array<{ id: number; name: string }>
>(PatientIntakeActionEnums.initializeSucceeded, (payload: ICheckInResponse, facilities: Array<{ id: number; name: string }>) => ({
    isInitializing: false,
    visitId: payload.visitId,
    facilityName: payload.facilityName,
    availableFacilities: facilities,
    selectedFacilityId: facilities.find((facility) => facility.name === payload.facilityName)?.id ?? null,
    startedAt: payload.startedAt,
    pathwayKey: payload.pathwayKey,
    errorMessage: undefined,
}));

export const processingStarted = createAction<IPatientIntakeStatePayload>(PatientIntakeActionEnums.processingStarted, () => ({
    isProcessing: true,
    errorMessage: undefined,
}));

export const setStep = createAction<IPatientIntakeStatePayload, number>(PatientIntakeActionEnums.setStep, (value: number) => ({
    currentStep: value,
}));

export const setFreeText = createAction<IPatientIntakeStatePayload, string>(PatientIntakeActionEnums.setFreeText, (value: string) => ({
    freeText: value,
}));

export const setSelectedFacilityId = createAction<IPatientIntakeStatePayload, number, Array<{ id: number; name: string }>>(
    PatientIntakeActionEnums.setSelectedFacilityId,
    (selectedFacilityId: number, facilities: Array<{ id: number; name: string }>) => ({
        selectedFacilityId,
        facilityName: facilities.find((facility) => facility.id === selectedFacilityId)?.name ?? "",
    })
);

export const toggleSymptom = createAction<IPatientIntakeStatePayload, string, string[]>(
    PatientIntakeActionEnums.toggleSymptom,
    (symptom: string, selectedSymptoms: string[]) => ({
        selectedSymptoms: selectedSymptoms.includes(symptom) ? selectedSymptoms.filter((item) => item !== symptom) : [...selectedSymptoms, symptom],
    })
);

export const setAnswer = createAction<IPatientIntakeStatePayload, string, string | number | boolean | string[], Record<string, string | number | boolean | string[]>>(
    PatientIntakeActionEnums.setAnswer,
    (questionKey: string, value: string | number | boolean | string[], answers: Record<string, string | number | boolean | string[]>) => ({
        answers: {
            ...answers,
            [questionKey]: value,
        },
    })
);

export const symptomProcessingSucceeded = createAction<IPatientIntakeStatePayload, IExtractSymptomsResponse, IIntakeQuestion[]>(
    PatientIntakeActionEnums.symptomProcessingSucceeded,
    (extractResult: IExtractSymptomsResponse, urgentQuestionSet: IIntakeQuestion[]) => ({
        isProcessing: false,
        extractedPrimarySymptoms: extractResult.extractedPrimarySymptoms,
        extractionSource: extractResult.extractionSource,
        likelyPathwayIds: extractResult.likelyPathwayIds ?? [],
        pathwayKey: extractResult.selectedPathwayKey,
        intakeMode: extractResult.intakeMode ?? "approved_json",
        fallbackSummaryIds: extractResult.fallbackSummaryIds ?? [],
        fallbackSectionIds: extractResult.fallbackSectionIds ?? [],
        urgentQuestionSet,
        questionSet: [],
        answers: extractResult.mappedInputValues ?? {},
        currentStep: 2,
        errorMessage: undefined,
    })
);

export const urgentCheckSucceeded = createAction<IPatientIntakeStatePayload, IUrgentCheckResponse>(PatientIntakeActionEnums.urgentCheckSucceeded, (result: IUrgentCheckResponse) => ({
    isProcessing: false,
    urgentTriggered: result.isUrgent,
    urgentMessage: result.message,
    urgentQuestionSet: result.questionSet ?? [],
    intakeMode: result.intakeMode ?? "approved_json",
    fallbackSummaryIds: result.fallbackSummaryIds ?? [],
    errorMessage: undefined,
}));

export const followUpQuestionsLoaded = createAction<IPatientIntakeStatePayload, IIntakeQuestion[]>(PatientIntakeActionEnums.followUpQuestionsLoaded, (questionSet: IIntakeQuestion[]) => ({
    isProcessing: false,
    questionSet,
    currentStep: 3,
    errorMessage: undefined,
}));

export const triageSucceeded = createAction<IPatientIntakeStatePayload, ITriageResponse>(PatientIntakeActionEnums.triageSucceeded, (result: ITriageResponse) => ({
    isProcessing: false,
    triage: result.triage,
    queue: result.queue,
    currentStep: 4,
    errorMessage: undefined,
}));

export const actionFailed = createAction<IPatientIntakeStatePayload, string>(PatientIntakeActionEnums.actionFailed, (message: string) => ({
    isInitializing: false,
    isProcessing: false,
    errorMessage: message,
}));

export const clearError = createAction<IPatientIntakeStatePayload>(PatientIntakeActionEnums.clearError, () => ({
    errorMessage: undefined,
}));
