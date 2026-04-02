"use client";

import { Button, Card, Progress, Spin, message, Typography } from "antd";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { PATIENT_INTAKE_STEPS } from "@/constants/patientIntake";
import { PatientBottomNav } from "@/components/patient/patientBottomNav";
import { usePatientIntakeActions, usePatientIntakeState } from "@/providers/patient-intake";
import { getVisibleQuestions } from "@/services/patient-intake/questionEngine";
import { CheckInStep, FollowUpStep, IntakeJourneyPanel, StatusStep, SymptomsStep, UrgentCheckStep } from "./patientIntakeSteps";
import type { ISpeechRecognition } from "./patientIntakeUtils";
import { resolveSpeechRecognitionApi, stepDescription } from "./patientIntakeUtils";
import { usePatientIntakeStyles } from "./style";

export const PatientIntakePage = (): React.JSX.Element => {
    const { styles } = usePatientIntakeStyles();
    const state = usePatientIntakeState();
    const actions = usePatientIntakeActions();
    const [isListening, setIsListening] = useState(false);
    const [messageApi, messageContextHolder] = message.useMessage();
    const hasInitializedRef = useRef(false);
    const recognitionRef = useRef<ISpeechRecognition | null>(null);
    const initializeFlowEvent = useEffectEvent(async () => {
        await actions.initializeFlow();
    });

    useEffect(() => {
        if (hasInitializedRef.current) {
            return;
        }

        hasInitializedRef.current = true;
        void initializeFlowEvent();
    }, []);

    const speechSupported = useMemo(() => Boolean(resolveSpeechRecognitionApi()), []);
    const visibleQuestions = useMemo(() => getVisibleQuestions(state.questionSet, state.answers, state.extractedPrimarySymptoms), [state.questionSet, state.answers, state.extractedPrimarySymptoms]);
    const progressPercent = Math.round(((state.currentStep + 1) / PATIENT_INTAKE_STEPS.length) * 100);
    const currentStepDetails = PATIENT_INTAKE_STEPS[state.currentStep];
    const currentFollowUpPlan = state.followUpPlans[state.currentFollowUpPlanIndex] ?? null;
    const hasQueueStatus = Boolean(state.visitId && state.queue);
    const activeTab = state.currentStep === 4 && hasQueueStatus ? "my-queue" : "new-visit";
    const isContinueDisabled = (state.currentStep === 2 && !state.freeText.trim() && state.selectedSymptoms.length === 0) || state.isProcessing;

    useEffect(() => {
        if (!state.errorMessage) {
            return;
        }

        void messageApi.error(state.errorMessage);
        actions.clearError();
    }, [actions, messageApi, state.errorMessage]);

    const startSpeechCapture = (): void => {
        const Recognition = resolveSpeechRecognitionApi();
        if (!Recognition) {
            return;
        }

        const recognition = new Recognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-ZA";
        recognition.onresult = (event) => {
            const transcript = Array.from({ length: event.results.length })
                .map((_, index) => event.results[index][0].transcript)
                .join(" ")
                .trim();

            if (transcript.length > 0) {
                const mergedText = [state.freeText.trim(), transcript].filter(Boolean).join(" ").trim();
                actions.setFreeText(mergedText);
            }
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognition.start();
        recognitionRef.current = recognition;
        setIsListening(true);
    };

    const stopSpeechCapture = (): void => {
        recognitionRef.current?.stop();
        recognitionRef.current = null;
        setIsListening(false);
    };

    return (
        <Card className={styles.stepCard}>
            {messageContextHolder}
            <PatientBottomNav
                activeKey={activeTab}
                hasQueueStatus={hasQueueStatus}
                onSelectMyQueue={() => {
                    if (hasQueueStatus) {
                        actions.goToStep(4);
                        return;
                    }

                    void actions.initializeFlow();
                }}
                onSelectNewVisit={() => {
                    if (state.currentStep === 4) {
                        actions.startNewVisitDraft();
                    }
                }}
            />

            <div className={styles.stepHeader}>
                <div className={styles.progressRow}>
                    <Typography.Text>{currentStepDetails.subtitle}</Typography.Text>
                    <Typography.Text>{progressPercent}%</Typography.Text>
                </div>
                <Progress percent={progressPercent} showInfo={false} strokeColor="#E07B2A" railColor="#E8EDF7" />
                <Typography.Title level={2} className={styles.stepTitle}>
                    {currentStepDetails.label}
                </Typography.Title>
                <Typography.Text className={styles.subtitleText}>{stepDescription(state.currentStep)}</Typography.Text>
            </div>

            <div className={styles.intakeBodyGrid}>
                <div className={styles.intakeMainColumn}>
                    {state.currentStep === 0 ? (
                        <CheckInStep
                            facilityName={state.facilityName}
                            selectedFacilityId={state.selectedFacilityId}
                            facilities={state.availableFacilities}
                            styles={styles}
                            onSelectFacility={actions.setSelectedFacilityId}
                        />
                    ) : null}
                    {state.currentStep === 1 ? (
                        <UrgentCheckStep
                            questions={state.urgentQuestionSet}
                            answers={state.answers}
                            onSetAnswer={actions.setAnswer}
                            urgentMessage={state.urgentMessage}
                            urgentTriggered={state.urgentTriggered}
                            styles={styles}
                        />
                    ) : null}
                    {state.currentStep === 2 ? (
                        <SymptomsStep
                            freeText={state.freeText}
                            selectedSymptoms={state.selectedSymptoms}
                            styles={styles}
                            isListening={isListening}
                            speechSupported={speechSupported}
                            onChangeFreeText={actions.setFreeText}
                            onToggleSymptom={actions.toggleSymptom}
                            onStartSpeech={startSpeechCapture}
                            onStopSpeech={stopSpeechCapture}
                        />
                    ) : null}
                    {state.currentStep === 3 ? (
                        <FollowUpStep
                            title={currentFollowUpPlan?.title ?? "Follow-up questions"}
                            currentPlanIndex={state.currentFollowUpPlanIndex}
                            totalPlans={Math.max(state.followUpPlans.length, 1)}
                            extractedPrimarySymptoms={state.extractedPrimarySymptoms}
                            questions={visibleQuestions}
                            answers={state.answers}
                            onSetAnswer={actions.setAnswer}
                            styles={styles}
                        />
                    ) : null}
                    {state.currentStep === 4 ? <StatusStep triage={state.triage} queue={state.queue} styles={styles} /> : null}

                    {state.currentStep === 2 && state.isProcessing ? (
                        <div className={styles.processingOverlay} role="status" aria-live="polite">
                            <Spin size="large" />
                            <Typography.Title level={4} className={styles.processingTitle}>
                                Preparing your follow-up questions
                            </Typography.Title>
                            <Typography.Text className={styles.processingText}>We are reviewing your symptom details now. This can take a few moments.</Typography.Text>
                        </div>
                    ) : null}
                </div>

                <div className={styles.intakeSideColumn}>
                    <IntakeJourneyPanel currentStep={state.currentStep} styles={styles} />
                </div>
            </div>

            <div className={styles.stickyActions}>
                {state.currentStep < 4 ? (
                    <div className={styles.actionsRow}>
                        <Button className={styles.secondaryButton} onClick={actions.backStep} disabled={state.currentStep === 0 || state.isProcessing}>
                            Back
                        </Button>
                        <Button type="primary" className={styles.primaryButton} loading={state.isProcessing} onClick={() => void actions.continueStep()} disabled={isContinueDisabled}>
                            {state.currentStep === 2 && state.isProcessing
                                ? "Preparing questions..."
                                : state.currentStep === 3
                                  ? state.currentFollowUpPlanIndex < state.followUpPlans.length - 1
                                      ? "Continue"
                                      : "Generate Status"
                                  : "Continue"}
                        </Button>
                    </div>
                ) : (
                    <div className={styles.actionsRow}>
                        <Button type="primary" className={styles.primaryButton} onClick={() => void actions.resetFlow()}>
                            Start New Visit
                        </Button>
                    </div>
                )}
            </div>
        </Card>
    );
};
