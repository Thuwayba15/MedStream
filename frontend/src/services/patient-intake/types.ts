export type TExtractionSource = "ai" | "deterministic_fallback";

export type TUrgencyLevel = "Routine" | "Priority" | "Urgent";

export interface ICheckInResponse {
    visitId: number;
    facilityId: number;
    facilityName: string;
    startedAt: string;
    pathwayKey: string;
}

export interface ICheckInRequest {
    selectedFacilityId: number;
}

export interface ISymptomCaptureRequest {
    visitId: number;
    freeText: string;
    selectedSymptoms: string[];
}

export interface ISymptomCaptureResponse {
    capturedAt: string;
}

export interface IExtractSymptomsResponse {
    extractedPrimarySymptoms: string[];
    extractionSource: TExtractionSource;
    likelyPathwayIds: string[];
    selectedPathwayKey: string;
    intakeMode: "approved_json" | "apc_fallback";
    mappedInputValues: Record<string, string | number | boolean | string[]>;
    followUpPlans?: IFollowUpPlan[];
    candidates?: IPathwayClassificationCandidate[];
    confidenceBand?: "Low" | "Medium" | "High";
    shouldAskDisambiguation?: boolean;
    disambiguationPrompt?: string | null;
    fallbackSectionIds?: string[];
    fallbackSummaryIds?: string[];
}

export interface IFollowUpPlan {
    planKey: string;
    title: string;
    pathwayKey: string;
    primarySymptom: string;
    intakeMode: "approved_json" | "apc_fallback";
    fallbackSummaryIds: string[];
}

export interface IPathwayClassificationCandidateSignal {
    signalType: string;
    matchedTerm: string;
    weight: number;
}

export interface IPathwayClassificationCandidate {
    pathwayId: string;
    totalScore: number;
    confidenceBand: "Low" | "Medium" | "High";
    matchedSignals: IPathwayClassificationCandidateSignal[];
}

export interface IIntakeQuestionOption {
    value: string;
    label: string;
}

export type TIntakeQuestionInputType = "Boolean" | "SingleSelect" | "MultiSelect" | "Number" | "Text";

export interface IIntakeQuestion {
    questionKey: string;
    questionText: string;
    inputType: TIntakeQuestionInputType;
    displayOrder: number;
    isRequired: boolean;
    answerOptions: IIntakeQuestionOption[];
    showWhenExpression: string | null;
}

export interface IQuestionsResponse {
    questionSet: IIntakeQuestion[];
}

export interface IGetQuestionsRequest {
    visitId: number;
    pathwayKey: string;
    primarySymptom: string | null;
    freeText: string;
    selectedSymptoms: string[];
    extractedPrimarySymptoms: string[];
    fallbackSummaryIds: string[];
    useApcFallback: boolean;
    answers: Record<string, string | number | boolean | string[]>;
}

export interface IUrgentCheckRequest {
    visitId: number;
    pathwayKey: string;
    intakeMode: "approved_json" | "apc_fallback";
    freeText: string;
    selectedSymptoms: string[];
    extractedPrimarySymptoms: string[];
    fallbackSummaryIds: string[];
    answers: Record<string, string | number | boolean | string[]>;
}

export interface IUrgentCheckResponse {
    questionSet: IIntakeQuestion[];
    isUrgent: boolean;
    shouldFastTrack: boolean;
    triggerReasons: string[];
    intakeMode: "approved_json" | "apc_fallback";
    fallbackSummaryIds: string[];
    message: string;
}

export interface ITriageAssessRequest {
    visitId: number;
    freeText: string;
    selectedSymptoms: string[];
    extractedPrimarySymptoms: string[];
    answers: Record<string, string | number | boolean | string[]>;
}

export interface ITriageResponse {
    triage: {
        urgencyLevel: TUrgencyLevel;
        explanation: string;
        redFlags: string[];
    };
    queue: {
        positionPending: boolean;
        message: string;
        lastUpdatedAt: string;
        queueNumber?: number;
        queueStatus?: "waiting" | "called" | "in_consultation" | "completed" | "cancelled";
    };
}

export interface ICurrentQueueStatusRequest {
    visitId: number;
}
