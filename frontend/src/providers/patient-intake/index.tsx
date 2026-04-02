"use client";

import { useCallback, useContext, useEffect, useMemo, useReducer } from "react";
import {
    assessTriage,
    checkIn,
    clearPersistedQueuedVisit,
    extractSymptoms,
    getActiveFacilities,
    getCurrentQueueStatus,
    getMissingFollowUpQuestion,
    getMissingUrgentQuestion,
    loadQuestions,
    logIntakeDebug,
    persistQueuedVisit,
    readPersistedQueuedVisit,
    runUrgentCheck,
    submitSymptoms,
} from "@/lib/patient-intake/providerHelpers";
import { subscribeToQueueRealtime } from "@/services/realtime/queueRealtimeClient";
import {
    actionFailed,
    clearError,
    followUpQuestionsLoaded,
    followUpPlanAdvanced,
    initializeStarted,
    initializeSucceeded,
    processingStarted,
    queuedVisitRestored,
    setAnswer,
    setFreeText,
    setSelectedFacilityId,
    setStep,
    startNewVisitDraft,
    symptomProcessingSucceeded,
    toggleSymptom,
    triageSucceeded,
    urgentCheckSucceeded,
} from "./actions";
import type { IAssessTriageFollowUpQuestion, IFollowUpPlan, IIntakeQuestion } from "@/services/patient-intake/types";
import { INITIAL_STATE, IPatientIntakeActionContext, IPatientIntakeStateContext, PatientIntakeActionContext, PatientIntakeStateContext } from "./context";
import { patientIntakeReducer } from "./reducer";

export const PatientIntakeProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, dispatch] = useReducer(patientIntakeReducer, INITIAL_STATE);

    const buildFollowUpQuestionCatalog = useCallback((followUpPlan: IFollowUpPlan, questionSet: IIntakeQuestion[]): IAssessTriageFollowUpQuestion[] => {
        return questionSet.map((question) => ({
            planKey: followUpPlan.planKey,
            pathwayKey: followUpPlan.pathwayKey,
            intakeMode: followUpPlan.intakeMode,
            questionKey: question.questionKey,
            questionText: question.questionText,
            inputType: question.inputType,
        }));
    }, []);

    const loadFollowUpQuestionsForPlan = useCallback(
        async (
            visitId: number,
            followUpPlan: {
                pathwayKey: string;
                primarySymptom: string;
                intakeMode: "approved_json" | "apc_fallback";
                fallbackSummaryIds: string[];
            },
            answers: Record<string, string | number | boolean | string[]>
        ): Promise<IIntakeQuestion[]> => {
            return loadQuestions({
                visitId,
                pathwayKey: followUpPlan.pathwayKey,
                primarySymptom: followUpPlan.primarySymptom || null,
                freeText: state.freeText,
                selectedSymptoms: state.selectedSymptoms,
                extractedPrimarySymptoms: state.extractedPrimarySymptoms,
                fallbackSummaryIds: followUpPlan.fallbackSummaryIds ?? [],
                useApcFallback: followUpPlan.intakeMode === "apc_fallback",
                answers,
            });
        },
        [state.extractedPrimarySymptoms, state.freeText, state.selectedSymptoms]
    );

    // Initialize Patient Intake
    // GET /api/auth/facilities/active
    const initializeFlow = useCallback(async (): Promise<void> => {
        dispatch(initializeStarted());
        try {
            const facilities = await getActiveFacilities();
            const persistedQueuedVisit = readPersistedQueuedVisit();

            if (persistedQueuedVisit?.visitId) {
                try {
                    const currentQueueStatus = await getCurrentQueueStatus(persistedQueuedVisit.visitId);
                    if (currentQueueStatus.queue) {
                        dispatch(
                            queuedVisitRestored(
                                {
                                    visitId: persistedQueuedVisit.visitId,
                                    facilityName: persistedQueuedVisit.facilityName,
                                    selectedFacilityId: persistedQueuedVisit.selectedFacilityId,
                                    startedAt: persistedQueuedVisit.startedAt,
                                    pathwayKey: persistedQueuedVisit.pathwayKey,
                                    triage: currentQueueStatus.triage,
                                    queue: currentQueueStatus.queue,
                                },
                                facilities
                            )
                        );
                        return;
                    }
                } catch {
                    clearPersistedQueuedVisit();
                }
            }

            dispatch(startNewVisitDraft(facilities));
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to initialize patient intake.";
            dispatch(actionFailed(message));
        }
    }, []);

    // Process Symptoms And Load Follow-Up Questions
    // POST /api/patient-intake/symptoms + POST /api/patient-intake/extract + POST /api/patient-intake/questions
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
                if (!state.selectedFacilityId) {
                    throw new Error("Select your hospital before continuing.");
                }

                const [initialized, facilities] = await Promise.all([
                    checkIn({ selectedFacilityId: state.selectedFacilityId }),
                    getActiveFacilities(),
                ]);
                dispatch(initializeSucceeded(initialized, facilities));
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
            const initialAnswers = { ...state.answers, ...(extractResult.mappedInputValues ?? {}) };
            const followUpPlans =
                extractResult.followUpPlans && extractResult.followUpPlans.length > 0
                    ? extractResult.followUpPlans
                    : [
                          {
                              planKey: extractResult.selectedPathwayKey || pathwayKey,
                              title: "Follow-up questions",
                              pathwayKey: extractResult.selectedPathwayKey || pathwayKey,
                              primarySymptom: extractResult.extractedPrimarySymptoms[0] ?? "",
                              intakeMode: extractResult.intakeMode ?? "approved_json",
                              fallbackSummaryIds: extractResult.fallbackSummaryIds ?? [],
                          },
                      ];
            const questionSet = await loadFollowUpQuestionsForPlan(visitId, followUpPlans[0], initialAnswers);
            const askedFollowUpQuestions = buildFollowUpQuestionCatalog(followUpPlans[0], questionSet);
            logIntakeDebug("follow-up question set loaded", {
                useApcFallback: followUpPlans[0].intakeMode === "apc_fallback",
                planKey: followUpPlans[0].planKey,
                questionCount: questionSet.length,
            });
            dispatch(followUpQuestionsLoaded(questionSet, askedFollowUpQuestions));
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to process symptom input.";
            dispatch(actionFailed(message));
        }
    }, [buildFollowUpQuestionCatalog, loadFollowUpQuestionsForPlan, state.answers, state.freeText, state.pathwayKey, state.selectedFacilityId, state.selectedSymptoms, state.urgentQuestionSet, state.visitId]);

    // Run Urgent Safety Check
    // POST /api/patient-intake/urgent-check + POST /api/patient-intake/triage
    const continueFromUrgentCheck = useCallback(async (): Promise<void> => {
        if (!state.visitId) {
            dispatch(actionFailed("Visit session is missing. Please restart check-in."));
            return;
        }

        const missingUrgentAnswer = getMissingUrgentQuestion(state.urgentQuestionSet, state.answers);
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
                    followUpPlans: [],
                    followUpQuestions: [],
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
    }, [state.answers, state.extractedPrimarySymptoms, state.fallbackSummaryIds, state.freeText, state.intakeMode, state.pathwayKey, state.selectedSymptoms, state.urgentQuestionSet, state.visitId]);

    // Complete Follow-Up Assessment
    // POST /api/patient-intake/triage
    const continueFromFollowUp = useCallback(async (): Promise<void> => {
        if (!state.visitId) {
            dispatch(actionFailed("Visit session is missing. Please restart check-in."));
            return;
        }

        const missingQuestion = getMissingFollowUpQuestion(state.questionSet, state.answers, state.extractedPrimarySymptoms);

        if (missingQuestion) {
            dispatch(actionFailed(`Please answer "${missingQuestion.questionText}" before continuing.`));
            return;
        }

        dispatch(processingStarted());
        try {
            const nextPlanIndex = state.currentFollowUpPlanIndex + 1;
            if (nextPlanIndex < state.followUpPlans.length) {
                const nextPlan = state.followUpPlans[nextPlanIndex];
                const questionSet = await loadFollowUpQuestionsForPlan(state.visitId, nextPlan, state.answers);
                const askedFollowUpQuestions = [
                    ...state.askedFollowUpQuestions,
                    ...buildFollowUpQuestionCatalog(nextPlan, questionSet),
                ];
                logIntakeDebug("follow-up question set loaded", {
                    useApcFallback: nextPlan.intakeMode === "apc_fallback",
                    planKey: nextPlan.planKey,
                    questionCount: questionSet.length,
                });
                dispatch(followUpPlanAdvanced(nextPlanIndex, questionSet, askedFollowUpQuestions));
                return;
            }

            const triageResult = await assessTriage({
                visitId: state.visitId,
                freeText: state.freeText,
                selectedSymptoms: state.selectedSymptoms,
                extractedPrimarySymptoms: state.extractedPrimarySymptoms,
                answers: state.answers,
                followUpPlans: state.followUpPlans.map((plan) => ({
                    pathwayKey: plan.pathwayKey,
                    primarySymptom: plan.primarySymptom,
                    intakeMode: plan.intakeMode,
                    fallbackSummaryIds: plan.fallbackSummaryIds ?? [],
                })),
                followUpQuestions: state.askedFollowUpQuestions,
            });
            logIntakeDebug("triage completed after follow-up", triageResult.triage);

            dispatch(triageSucceeded(triageResult));
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to complete triage assessment.";
            dispatch(actionFailed(message));
        }
    }, [
        loadFollowUpQuestionsForPlan,
        buildFollowUpQuestionCatalog,
        state.askedFollowUpQuestions,
        state.answers,
        state.currentFollowUpPlanIndex,
        state.extractedPrimarySymptoms,
        state.followUpPlans,
        state.freeText,
        state.questionSet,
        state.selectedSymptoms,
        state.visitId,
    ]);

    // Start Check-In Safety Screen
    // POST /api/patient-intake/check-in + POST /api/patient-intake/urgent-check
    const continueFromCheckIn = useCallback(async (): Promise<void> => {
        if (!state.selectedFacilityId) {
            dispatch(actionFailed("Select your hospital before continuing."));
            return;
        }

        dispatch(processingStarted());
        try {
            let visitId = state.visitId;
            let pathwayKey = state.pathwayKey;
            if (!visitId) {
                const [initialized, facilities] = await Promise.all([
                    checkIn({ selectedFacilityId: state.selectedFacilityId }),
                    getActiveFacilities(),
                ]);
                dispatch(initializeSucceeded(initialized, facilities));
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
    }, [state.extractedPrimarySymptoms, state.fallbackSummaryIds, state.freeText, state.intakeMode, state.pathwayKey, state.selectedFacilityId, state.selectedSymptoms, state.visitId]);

    const actions: IPatientIntakeActionContext = useMemo(
        () => ({
            initializeFlow,
            setFreeText: (value: string) => dispatch(setFreeText(value)),
            setSelectedFacilityId: (value: number) => dispatch(setSelectedFacilityId(value, state.availableFacilities)),
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
            goToStep: (step: number) => dispatch(setStep(step)),
            startNewVisitDraft: () => dispatch(startNewVisitDraft(state.availableFacilities)),
            resetFlow: async () => {
                clearPersistedQueuedVisit();
                dispatch(setStep(0));
                await initializeFlow();
            },
        }),
        [continueFromCheckIn, continueFromFollowUp, continueFromSymptoms, continueFromUrgentCheck, initializeFlow, state.answers, state.availableFacilities, state.currentStep, state.selectedSymptoms]
    );

    useEffect(() => {
        if (state.currentStep !== 4 || !state.visitId) {
            return;
        }

        const unsubscribe = subscribeToQueueRealtime((event) => {
            if (event.scope !== "patient" || event.visitId !== state.visitId) {
                return;
            }

            void getCurrentQueueStatus(state.visitId)
                .then((result) => dispatch(triageSucceeded(result)))
                .catch(() => undefined);
        });

        return unsubscribe;
    }, [state.currentStep, state.visitId]);

    useEffect(() => {
        if (state.currentStep !== 4 || !state.visitId || !state.queue) {
            return;
        }

        if (state.queue.queueStatus === "completed" || state.queue.queueStatus === "cancelled") {
            clearPersistedQueuedVisit();
            return;
        }

        persistQueuedVisit({
            visitId: state.visitId,
            facilityName: state.facilityName,
            selectedFacilityId: state.selectedFacilityId,
            startedAt: state.startedAt,
            pathwayKey: state.pathwayKey,
        });
    }, [state.currentStep, state.facilityName, state.pathwayKey, state.queue, state.selectedFacilityId, state.startedAt, state.visitId]);

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
