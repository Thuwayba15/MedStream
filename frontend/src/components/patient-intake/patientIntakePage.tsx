"use client";

import { AudioOutlined, ClockCircleOutlined, EnvironmentOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Input, InputNumber, Progress, Radio, Select, Segmented, Space, Tag, Typography } from "antd";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { COMMON_SYMPTOMS, PATIENT_INTAKE_STEPS } from "@/constants/patientIntake";
import { usePatientIntakeActions, usePatientIntakeState } from "@/providers/patient-intake";
import { getVisibleQuestions } from "@/services/patient-intake/questionEngine";
import type { IIntakeQuestion } from "@/services/patient-intake/types";
import { usePatientIntakeStyles } from "./style";

type SpeechRecognitionConstructor = new () => ISpeechRecognition;

interface ISpeechRecognitionResultAlternative {
    transcript: string;
}

interface ISpeechRecognitionResult {
    isFinal: boolean;
    0: ISpeechRecognitionResultAlternative;
}

interface ISpeechRecognitionEvent {
    results: {
        length: number;
        [index: number]: ISpeechRecognitionResult;
    };
}

interface ISpeechRecognition {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    onresult: ((event: ISpeechRecognitionEvent) => void) | null;
    onerror: (() => void) | null;
    onend: (() => void) | null;
}

interface IExtendedWindow extends Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

export const PatientIntakePage = () => {
    const { styles } = usePatientIntakeStyles();
    const state = usePatientIntakeState();
    const actions = usePatientIntakeActions();
    const [isListening, setIsListening] = useState(false);
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

    const progressPercent = Math.round(((state.currentStep + 1) / PATIENT_INTAKE_STEPS.length) * 100);
    const currentStepDetails = PATIENT_INTAKE_STEPS[state.currentStep];
    const visibleQuestions = useMemo(() => getVisibleQuestions(state.questionSet, state.answers, state.extractedPrimarySymptoms), [state.questionSet, state.answers, state.extractedPrimarySymptoms]);
    const hasQueueStatus = Boolean(state.visitId && state.queue);
    const activeBottomNav = state.currentStep === 4 && hasQueueStatus ? "my-queue" : "new-visit";

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

        recognition.onerror = () => {
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
        recognitionRef.current = recognition;
        setIsListening(true);
    };

    const stopSpeechCapture = (): void => {
        recognitionRef.current?.stop();
        recognitionRef.current = null;
        setIsListening(false);
    };

    const isContinueDisabled = (state.currentStep === 2 && !state.freeText.trim() && state.selectedSymptoms.length === 0) || state.isProcessing;

    return (
        <Card className={styles.stepCard}>
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

            {state.errorMessage ? (
                <Alert
                    type="error"
                    showIcon
                    title={state.errorMessage}
                    action={
                        <Button size="small" onClick={actions.clearError}>
                            Dismiss
                        </Button>
                    }
                />
            ) : null}

            {state.currentStep === 0 ? (
                <CheckInStep
                    facilityName={state.facilityName}
                    selectedFacilityId={state.selectedFacilityId}
                    facilities={state.availableFacilities}
                    startedAt={state.startedAt}
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
                    extractedPrimarySymptoms={state.extractedPrimarySymptoms}
                    extractionSource={state.extractionSource}
                    questions={visibleQuestions}
                    answers={state.answers}
                    onSetAnswer={actions.setAnswer}
                    styles={styles}
                />
            ) : null}

            {state.currentStep === 4 ? <StatusStep triage={state.triage} queue={state.queue} styles={styles} /> : null}

            <div className={styles.stickyActions}>
                <div className={styles.bottomNavWrap}>
                    <Segmented
                        block
                        options={[
                            { label: "New Visit", value: "new-visit" },
                            { label: "My Queue", value: "my-queue", disabled: !hasQueueStatus },
                            { label: "History", value: "history", disabled: true },
                        ]}
                        value={activeBottomNav}
                        onChange={(value) => {
                            if (value === "my-queue" && hasQueueStatus) {
                                actions.goToStep(4);
                                return;
                            }

                            if (value === "new-visit" && state.currentStep === 4) {
                                void actions.resetFlow();
                            }
                        }}
                    />
                </div>
                {state.currentStep < 4 ? (
                    <div className={styles.actionsRow}>
                        <Button className={styles.secondaryButton} onClick={actions.backStep} disabled={state.currentStep === 0 || state.isProcessing}>
                            Back
                        </Button>
                        <Button type="primary" className={styles.primaryButton} loading={state.isProcessing} onClick={() => void actions.continueStep()} disabled={isContinueDisabled}>
                            {state.currentStep === 3 ? "Generate Status" : "Continue"}
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

const CheckInStep = ({
    facilityName,
    selectedFacilityId,
    facilities,
    startedAt,
    styles,
    onSelectFacility,
}: {
    facilityName: string;
    selectedFacilityId: number | null;
    facilities: Array<{ id: number; name: string }>;
    startedAt: string | null;
    styles: Record<string, string>;
    onSelectFacility: (value: number) => void;
}): React.JSX.Element => {
    return (
        <Space orientation="vertical" size={14} className={`${styles.panel} ${styles.centeredBlock}`}>
            <Typography.Text className={styles.centeredText}>We will use your responses to prioritize your visit safely and quickly. You can review answers before final submission.</Typography.Text>
            <Select<number>
                aria-label="Hospital"
                className={styles.facilitySelect}
                value={selectedFacilityId ?? undefined}
                placeholder="Select your hospital"
                showSearch
                optionFilterProp="label"
                options={facilities.map((facility) => ({ value: facility.id, label: facility.name }))}
                suffixIcon={<EnvironmentOutlined />}
                onChange={onSelectFacility}
            />
            <Typography.Text className={styles.centeredText}>
                <strong>Selected:</strong> {facilityName || "Not selected"}
            </Typography.Text>
            <Typography.Text className={styles.centeredText}>
                <strong>Session started:</strong> {startedAt ? new Date(startedAt).toLocaleString() : "Now"}
            </Typography.Text>
        </Space>
    );
};

interface ISymptomsStepProps {
    freeText: string;
    selectedSymptoms: string[];
    styles: Record<string, string>;
    isListening: boolean;
    speechSupported: boolean;
    onChangeFreeText: (value: string) => void;
    onToggleSymptom: (value: string) => void;
    onStartSpeech: () => void;
    onStopSpeech: () => void;
}

const SymptomsStep = ({ freeText, selectedSymptoms, styles, isListening, speechSupported, onChangeFreeText, onToggleSymptom, onStartSpeech, onStopSpeech }: ISymptomsStepProps): React.JSX.Element => {
    return (
        <Space orientation="vertical" size={18} className={styles.centeredBlock}>
            <Space orientation="vertical" size={8} className={`${styles.panel} ${styles.centeredBlock}`}>
                <Button
                    aria-label="Tap to speak your symptoms"
                    className={`${styles.disabledMicButton} ${isListening ? styles.listeningMicButton : ""}`}
                    type={isListening ? "primary" : "default"}
                    shape="round"
                    onClick={isListening ? onStopSpeech : onStartSpeech}
                    disabled={!speechSupported}
                >
                    <span className={styles.micButtonContent}>
                        <span className={styles.micOrb}>
                            {isListening ? <span className={styles.micPulse} /> : null}
                            <AudioOutlined />
                        </span>
                        <span>{isListening ? "Listening... tap to stop" : speechSupported ? "Tap to speak your symptoms" : "Speech input not supported on this browser"}</span>
                    </span>
                </Button>
                <Typography.Text className={styles.orDivider}>or describe in writing</Typography.Text>
                <Input.TextArea
                    value={freeText}
                    onChange={(event) => onChangeFreeText(event.target.value)}
                    placeholder="Describe your symptoms in your own words..."
                    className={styles.symptomTextArea}
                    autoSize={{ minRows: 5, maxRows: 8 }}
                />
            </Space>

            <div>
                <Typography.Text strong className={styles.symptomChipTitle}>
                    Common Symptoms
                </Typography.Text>
                <div className={`${styles.chipsWrap} ${styles.centeredWrap}`}>
                    {COMMON_SYMPTOMS.map((symptom) => (
                        <Button key={symptom} size="small" className={styles.chipButton} type={selectedSymptoms.includes(symptom) ? "primary" : "default"} onClick={() => onToggleSymptom(symptom)}>
                            {symptom}
                        </Button>
                    ))}
                </div>
            </div>
        </Space>
    );
};

interface IFollowUpStepProps {
    extractedPrimarySymptoms: string[];
    extractionSource: "ai" | "deterministic_fallback" | null;
    questions: IIntakeQuestion[];
    answers: Record<string, string | number | boolean | string[]>;
    onSetAnswer: (questionKey: string, value: string | number | boolean | string[]) => void;
    styles: Record<string, string>;
}

const FollowUpStep = ({ extractedPrimarySymptoms, questions, answers, onSetAnswer, styles }: IFollowUpStepProps): React.JSX.Element => {
    return (
        <Space orientation="vertical" size={14} className={styles.centeredBlock}>
            <Space wrap className={styles.centeredWrap}>
                <Typography.Text strong>Captured main symptoms:</Typography.Text>
                {extractedPrimarySymptoms.length > 0 ? (
                    extractedPrimarySymptoms.map((symptom) => (
                        <Tag key={symptom} className={styles.extractedTag}>
                            {symptom}
                        </Tag>
                    ))
                ) : (
                    <Tag>No primary symptom found</Tag>
                )}
            </Space>

            <div className={styles.questionList}>
                {questions.map((question) => (
                    <QuestionField key={question.questionKey} question={question} value={answers[question.questionKey]} onSetAnswer={onSetAnswer} />
                ))}
            </div>
        </Space>
    );
};

const UrgentCheckStep = ({
    questions,
    answers,
    onSetAnswer,
    urgentMessage,
    urgentTriggered,
    styles,
}: {
    questions: IIntakeQuestion[];
    answers: Record<string, string | number | boolean | string[]>;
    onSetAnswer: (questionKey: string, value: string | number | boolean | string[]) => void;
    urgentMessage: string | null;
    urgentTriggered: boolean;
    styles: Record<string, string>;
}): React.JSX.Element => {
    return (
        <Space orientation="vertical" size={14} className={styles.centeredBlock}>
            <Alert
                type={urgentTriggered ? "error" : "warning"}
                showIcon
                title={urgentTriggered ? "Urgent signs detected" : "Complete urgent safety check"}
                description={urgentMessage ?? "Answer these urgent safety questions before continuing."}
            />

            <div className={styles.questionList}>
                {questions.map((question) => (
                    <QuestionField key={question.questionKey} question={question} value={answers[question.questionKey]} onSetAnswer={onSetAnswer} />
                ))}
            </div>
        </Space>
    );
};

const QuestionField = ({
    question,
    value,
    onSetAnswer,
}: {
    question: IIntakeQuestion;
    value: string | number | boolean | string[] | undefined;
    onSetAnswer: (questionKey: string, value: string | number | boolean | string[]) => void;
}): React.JSX.Element => {
    return (
        <Space orientation="vertical" size={6}>
            <Typography.Text strong>
                {question.isRequired ? "* " : ""}
                {question.questionText}
            </Typography.Text>

            {question.inputType === "Boolean" ? (
                <Radio.Group aria-label={question.questionText} value={value} onChange={(event) => onSetAnswer(question.questionKey, event.target.value)}>
                    <Radio value={true}>Yes</Radio>
                    <Radio value={false}>No</Radio>
                </Radio.Group>
            ) : null}

            {question.inputType === "SingleSelect" ? (
                <Select
                    aria-label={question.questionText}
                    value={typeof value === "string" ? value : undefined}
                    placeholder="Select one option"
                    options={question.answerOptions.map((option) => ({ label: option.label, value: option.value }))}
                    onChange={(selectedValue) => onSetAnswer(question.questionKey, selectedValue)}
                />
            ) : null}

            {question.inputType === "MultiSelect" ? (
                <Select
                    aria-label={question.questionText}
                    mode="multiple"
                    value={Array.isArray(value) ? value.map((item) => String(item)) : []}
                    placeholder="Select all that apply"
                    options={question.answerOptions.map((option) => ({ label: option.label, value: option.value }))}
                    onChange={(selectedValue) => onSetAnswer(question.questionKey, selectedValue)}
                />
            ) : null}

            {question.inputType === "Number" ? (
                <InputNumber
                    aria-label={question.questionText}
                    min={0}
                    max={30}
                    value={typeof value === "number" ? value : undefined}
                    onChange={(nextValue) => onSetAnswer(question.questionKey, Number(nextValue ?? 0))}
                />
            ) : null}

            {question.inputType === "Text" ? (
                <Input.TextArea
                    aria-label={question.questionText}
                    value={typeof value === "string" ? value : ""}
                    autoSize={{ minRows: 2, maxRows: 5 }}
                    onChange={(event) => onSetAnswer(question.questionKey, event.target.value)}
                />
            ) : null}
        </Space>
    );
};

const StatusStep = ({
    triage,
    queue,
    styles,
}: {
    triage: {
        urgencyLevel: "Routine" | "Priority" | "Urgent";
        explanation: string;
        redFlags: string[];
    } | null;
    queue: {
        positionPending: boolean;
        message: string;
        lastUpdatedAt: string;
    } | null;
    styles: Record<string, string>;
}): React.JSX.Element => {
    const statusColor = triage?.urgencyLevel === "Urgent" ? "red" : triage?.urgencyLevel === "Priority" ? "orange" : "blue";

    return (
        <Space orientation="vertical" size={14} className={styles.centeredBlock}>
            <Card className={styles.statusCard}>
                <Space orientation="vertical" size={8}>
                    <Space size={10}>
                        <SafetyCertificateOutlined />
                        <Typography.Text strong>Triage Status</Typography.Text>
                        <Tag color={statusColor}>{triage?.urgencyLevel ?? "Pending"}</Tag>
                    </Space>
                    <Typography.Text>{triage?.explanation ?? "Assessment is still pending."}</Typography.Text>
                </Space>
            </Card>

            <div className={styles.queueCard}>
                <Space>
                    <ClockCircleOutlined />
                    <Typography.Text strong>Queue Status</Typography.Text>
                </Space>
                <Typography.Text>{queue?.message ?? "Queue assignment pending."}</Typography.Text>
                <Typography.Text type="secondary">Last updated: {queue?.lastUpdatedAt ? new Date(queue.lastUpdatedAt).toLocaleTimeString() : "-"}</Typography.Text>
            </div>
        </Space>
    );
};

const stepDescription = (step: number): string => {
    if (step === 0) {
        return "Confirm your visit context and begin intake.";
    }

    if (step === 1) {
        return "We quickly check urgent danger signs before deeper follow-up.";
    }

    if (step === 2) {
        return "Tell us what you are feeling using text, chips, or speech.";
    }

    if (step === 3) {
        return "Answer follow-up questions generated from your symptoms.";
    }

    return "Review your triage urgency and current queue status.";
};

const resolveSpeechRecognitionApi = (): SpeechRecognitionConstructor | null => {
    if (typeof window === "undefined") {
        return null;
    }

    const browserWindow = window as IExtendedWindow;
    return browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition ?? null;
};
