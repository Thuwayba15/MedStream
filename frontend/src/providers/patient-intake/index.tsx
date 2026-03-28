"use client";

import { useCallback, useContext, useMemo, useReducer } from "react";
import { API } from "@/constants/api";
import { actionFailed, clearError, followUpQuestionsLoaded, initializeStarted, initializeSucceeded, processingStarted, setAnswer, setFreeText, setStep, symptomProcessingSucceeded, toggleSymptom, triageSucceeded, urgentCheckSucceeded } from "./actions";
import { INITIAL_STATE, IPatientIntakeActionContext, IPatientIntakeStateContext, PatientIntakeActionContext, PatientIntakeStateContext } from "./context";
import { patientIntakeReducer } from "./reducer";
import { getVisibleQuestions } from "@/services/patient-intake/questionEngine";
import type { ICheckInResponse, IExtractSymptomsResponse, IIntakeQuestion, ISymptomCaptureRequest, ITriageResponse, IUrgentCheckResponse } from "@/services/patient-intake/types";

const logIntakeDebug = (message: string, payload?: unknown): void => {
    if (process.env.NODE_ENV === "production") {
        return;
    }

    if (payload === undefined) {
        console.info(`[PatientIntake] ${message}`);
        return;
    }

    console.info(`[PatientIntake] ${message}`, payload);
};

export const PatientIntakeProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, dispatch] = useReducer(patientIntakeReducer, INITIAL_STATE);

    const parseResponse = async <T,>(response: Response, fallbackMessage: string): Promise<T> => {
        const body = (await response.json()) as T & { message?: string };
        if (!response.ok) {
            throw new Error(body.message ?? fallbackMessage);
        }

        return body;
    };

    const checkIn = useCallback(async (): Promise<ICheckInResponse> => {
        const response = await fetch(API.PATIENT_INTAKE_CHECKIN_ROUTE, { method: "POST" });
        return parseResponse<ICheckInResponse>(response, "Unable to start patient check-in.");
    }, []);

    const submitSymptoms = useCallback(async (payload: ISymptomCaptureRequest): Promise<void> => {
        const response = await fetch(API.PATIENT_INTAKE_SYMPTOMS_ROUTE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        await parseResponse<Record<string, unknown>>(response, "Unable to save symptoms.");
    }, []);

    const extractSymptoms = useCallback(async (payload: ISymptomCaptureRequest): Promise<IExtractSymptomsResponse> => {
        const response = await fetch(API.PATIENT_INTAKE_EXTRACT_ROUTE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        return parseResponse<IExtractSymptomsResponse>(response, "Unable to extract symptoms.");
    }, []);

    const runUrgentCheck = useCallback(
        async (payload: {
            visitId: number;
            pathwayKey: string;
            intakeMode: "approved_json" | "apc_fallback";
            freeText: string;
            selectedSymptoms: string[];
            extractedPrimarySymptoms: string[];
            fallbackSummaryIds: string[];
            answers: Record<string, string | number | boolean | string[]>;
        }): Promise<IUrgentCheckResponse> => {
            const response = await fetch(API.PATIENT_INTAKE_URGENT_CHECK_ROUTE, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            return parseResponse<IUrgentCheckResponse>(response, "Unable to run urgent check.");
        },
        []
    );

    const loadQuestions = useCallback(
        async (payload: {
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
            const response = await fetch(API.PATIENT_INTAKE_QUESTIONS_ROUTE, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const body = await parseResponse<{ questionSet: IIntakeQuestion[] }>(response, "Unable to load follow-up questions.");
            return body.questionSet ?? [];
        },
        []
    );

    const assessTriage = useCallback(
        async (payload: {
            visitId: number;
            freeText: string;
            selectedSymptoms: string[];
            extractedPrimarySymptoms: string[];
            answers: Record<string, string | number | boolean | string[]>;
        }): Promise<ITriageResponse> => {
            const response = await fetch(API.PATIENT_INTAKE_TRIAGE_ROUTE, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            return parseResponse<ITriageResponse>(response, "Unable to generate triage result.");
        },
        []
    );

    const initializeFlow = useCallback(async (): Promise<void> => {
        dispatch(initializeStarted());
        try {
            const payload = await checkIn();
            dispatch(initializeSucceeded(payload));
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to initialize patient intake.";
            dispatch(actionFailed(message));
        }
    }, [checkIn]);

    const continueFromSymptoms = useCallback(async (): Promise<void> => {
        if (!state.freeText.trim() && state.selectedSymptoms.length === 0) {
            dispatch(actionFailed("Describe at least one symptom before continuing."));
            return;
        }

        dispatch(processingStarted());
        try {
            let visitId = state.visitId;
            let pathwayKey = state.pathwayKey;

            if (!visitId) {
                const initialized = await checkIn();
                dispatch(initializeSucceeded(initialized));
                visitId = initialized.visitId;
                pathwayKey = initialized.pathwayKey;
            }

            const payload = {
                visitId,
                freeText: state.freeText,
                selectedSymptoms: state.selectedSymptoms,
            };
            await submitSymptoms(payload);
            const extractResult = await extractSymptoms(payload);
            logIntakeDebug("extractSymptoms result", {
                extractionSource: extractResult.extractionSource,
                intakeMode: extractResult.intakeMode,
                selectedPathwayKey: extractResult.selectedPathwayKey,
                likelyPathwayIds: extractResult.likelyPathwayIds,
                fallbackSummaryIds: extractResult.fallbackSummaryIds ?? [],
            });

            dispatch(symptomProcessingSucceeded(extractResult, state.urgentQuestionSet));
            const selectedPathwayKey = extractResult.selectedPathwayKey || pathwayKey;
            const questionSet = await loadQuestions({
                visitId,
                pathwayKey: selectedPathwayKey,
                primarySymptom: extractResult.extractedPrimarySymptoms[0] ?? null,
                freeText: state.freeText,
                selectedSymptoms: state.selectedSymptoms,
                extractedPrimarySymptoms: extractResult.extractedPrimarySymptoms,
                fallbackSummaryIds: extractResult.fallbackSummaryIds ?? [],
                useApcFallback: (extractResult.intakeMode ?? "approved_json") === "apc_fallback",
                answers: { ...state.answers, ...(extractResult.mappedInputValues ?? {}) },
            });
            logIntakeDebug("follow-up question set loaded", {
                useApcFallback: (extractResult.intakeMode ?? "approved_json") === "apc_fallback",
                questionCount: questionSet.length,
            });
            dispatch(followUpQuestionsLoaded(questionSet));
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to process symptom input.";
            dispatch(actionFailed(message));
        }
    }, [checkIn, extractSymptoms, loadQuestions, state.answers, state.freeText, state.pathwayKey, state.selectedSymptoms, state.urgentQuestionSet, state.visitId, submitSymptoms]);

    const continueFromUrgentCheck = useCallback(async (): Promise<void> => {
        if (!state.visitId) {
            dispatch(actionFailed("Visit session is missing. Please restart check-in."));
            return;
        }

        const missingUrgentAnswer = state.urgentQuestionSet.find((question) => question.isRequired && (state.answers[question.questionKey] === undefined || state.answers[question.questionKey] === null || state.answers[question.questionKey] === ""));
        if (missingUrgentAnswer) {
            dispatch(actionFailed(`Please answer "${missingUrgentAnswer.questionText}" before continuing.`));
            return;
        }

        dispatch(processingStarted());
        try {
            const urgentResult = await runUrgentCheck({
                visitId: state.visitId,
                pathwayKey: state.pathwayKey,
                intakeMode: state.intakeMode,
                freeText: state.freeText,
                selectedSymptoms: state.selectedSymptoms,
                extractedPrimarySymptoms: state.extractedPrimarySymptoms,
                fallbackSummaryIds: state.fallbackSummaryIds,
                answers: state.answers,
            });
            logIntakeDebug("urgentCheck result after patient answers", {
                intakeMode: urgentResult.intakeMode,
                isUrgent: urgentResult.isUrgent,
                shouldFastTrack: urgentResult.shouldFastTrack,
                triggerReasons: urgentResult.triggerReasons,
            });
            dispatch(urgentCheckSucceeded(urgentResult));

            if (urgentResult.shouldFastTrack) {
                const triageResult = await assessTriage({
                    visitId: state.visitId,
                    freeText: state.freeText,
                    selectedSymptoms: state.selectedSymptoms,
                    extractedPrimarySymptoms: state.extractedPrimarySymptoms,
                    answers: state.answers,
                });
                logIntakeDebug("triage completed in urgent fast-track mode", triageResult.triage);
                dispatch(triageSucceeded(triageResult));
                return;
            }

            dispatch(setStep(2));
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to continue urgent check.";
            dispatch(actionFailed(message));
        }
    }, [
        assessTriage,
        runUrgentCheck,
        state.answers,
        state.extractedPrimarySymptoms,
        state.fallbackSummaryIds,
        state.freeText,
        state.intakeMode,
        state.pathwayKey,
        state.selectedSymptoms,
        state.urgentQuestionSet,
        state.visitId,
    ]);

    const continueFromFollowUp = useCallback(async (): Promise<void> => {
        if (!state.visitId) {
            dispatch(actionFailed("Visit session is missing. Please restart check-in."));
            return;
        }

        const visibleQuestions = getVisibleQuestions(state.questionSet, state.answers, state.extractedPrimarySymptoms);
        const missingQuestion = visibleQuestions.find((question) => {
            if (!question.isRequired) {
                return false;
            }

            const answer = state.answers[question.questionKey];
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

        if (missingQuestion) {
            dispatch(actionFailed(`Please answer "${missingQuestion.questionText}" before continuing.`));
            return;
        }

        dispatch(processingStarted());
        try {
            const triageResult = await assessTriage({
                visitId: state.visitId,
                freeText: state.freeText,
                selectedSymptoms: state.selectedSymptoms,
                extractedPrimarySymptoms: state.extractedPrimarySymptoms,
                answers: state.answers,
            });
            logIntakeDebug("triage completed after follow-up", triageResult.triage);

            dispatch(triageSucceeded(triageResult));
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to complete triage assessment.";
            dispatch(actionFailed(message));
        }
    }, [assessTriage, state.answers, state.extractedPrimarySymptoms, state.freeText, state.questionSet, state.selectedSymptoms, state.visitId]);

    const continueFromCheckIn = useCallback(async (): Promise<void> => {
        dispatch(processingStarted());
        try {
            let visitId = state.visitId;
            let pathwayKey = state.pathwayKey;
            if (!visitId) {
                const initialized = await checkIn();
                dispatch(initializeSucceeded(initialized));
                visitId = initialized.visitId;
                pathwayKey = initialized.pathwayKey;
            }

            const urgentResult = await runUrgentCheck({
                visitId,
                pathwayKey,
                intakeMode: state.intakeMode,
                freeText: state.freeText,
                selectedSymptoms: state.selectedSymptoms,
                extractedPrimarySymptoms: state.extractedPrimarySymptoms,
                fallbackSummaryIds: state.fallbackSummaryIds,
                answers: {},
            });
            dispatch(urgentCheckSucceeded(urgentResult));
            dispatch(setStep(1));
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to start urgent safety check.";
            dispatch(actionFailed(message));
        }
    }, [checkIn, runUrgentCheck, state.extractedPrimarySymptoms, state.fallbackSummaryIds, state.freeText, state.intakeMode, state.pathwayKey, state.selectedSymptoms, state.visitId]);

    const actions: IPatientIntakeActionContext = useMemo(
        () => ({
            initializeFlow,
            setFreeText: (value: string) => dispatch(setFreeText(value)),
            toggleSymptom: (value: string) => dispatch(toggleSymptom(value, state.selectedSymptoms)),
            setAnswer: (questionKey, value) => dispatch(setAnswer(questionKey, value, state.answers)),
            continueStep: async () => {
                if (state.currentStep === 0) {
                    await continueFromCheckIn();
                    return;
                }

                if (state.currentStep === 1) {
                    await continueFromUrgentCheck();
                    return;
                }

                if (state.currentStep === 2) {
                    await continueFromSymptoms();
                    return;
                }

                if (state.currentStep === 3) {
                    await continueFromFollowUp();
                }
            },
            backStep: () => {
                if (state.currentStep === 0) {
                    return;
                }

                dispatch(setStep(state.currentStep - 1));
            },
            clearError: () => dispatch(clearError()),
            resetFlow: async () => {
                dispatch(setStep(0));
                await initializeFlow();
            },
        }),
        [continueFromCheckIn, continueFromFollowUp, continueFromSymptoms, continueFromUrgentCheck, initializeFlow, state.answers, state.currentStep, state.selectedSymptoms]
    );

    return (
        <PatientIntakeStateContext.Provider value={state}>
            <PatientIntakeActionContext.Provider value={actions}>{children}</PatientIntakeActionContext.Provider>
        </PatientIntakeStateContext.Provider>
    );
};

export const usePatientIntakeState = (): IPatientIntakeStateContext => {
    return useContext(PatientIntakeStateContext);
};

export const usePatientIntakeActions = (): IPatientIntakeActionContext => {
    const context = useContext(PatientIntakeActionContext);
    if (!context) {
        throw new Error("usePatientIntakeActions must be used within a PatientIntakeProvider.");
    }

    return context;
};
