"use client";

import { AudioOutlined, ClockCircleOutlined, EnvironmentOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Input, InputNumber, Radio, Select, Space, Tag, Typography } from "antd";
import { COMMON_SYMPTOMS } from "@/constants/patientIntake";
import type { IIntakeQuestion } from "@/services/patient-intake/types";
import type { ICheckInStepProps, IFollowUpStepProps, IStatusStepProps, ISymptomsStepProps, IUrgentCheckStepProps } from "./patientIntakeUtils";

export const CheckInStep = ({ facilityName, selectedFacilityId, facilities, styles, onSelectFacility }: ICheckInStepProps): React.JSX.Element => {
    return (
        <div className={styles.checkInSection}>
            <div className={styles.checkInBanner}>
                <div className={styles.checkInBannerIcon}>
                    <SafetyCertificateOutlined />
                </div>
                <Typography.Text className={styles.checkInBannerText}>
                    Your answers help us understand how urgent your visit is and guide you to the next step. You can review everything before you finish.
                </Typography.Text>
            </div>

            <div className={styles.checkInGrid}>
                <div className={styles.checkInInfoCard}>
                    <div className={styles.sectionEyebrow}>Visit Check-In</div>
                    <Typography.Title level={4} className={styles.checkInCardTitle}>
                        Choose where you are being seen today
                    </Typography.Title>

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

                    <div className={styles.selectedFacilitySummary}>
                        <div className={styles.selectedFacilityIcon}>
                            <EnvironmentOutlined />
                        </div>
                        <div>
                            <Typography.Text className={styles.selectedFacilityLabel}>Selected hospital</Typography.Text>
                            <Typography.Text className={styles.selectedFacilityValue}>{facilityName || "Choose a hospital to continue"}</Typography.Text>
                        </div>
                    </div>
                </div>

                <div className={styles.nextStepsCard}>
                    <div className={styles.sectionEyebrow}>What Happens Next</div>
                    <div className={styles.nextStepsList}>
                        {[
                            { step: 1, title: "Check-in", description: "Choose your hospital and start your intake.", active: true },
                            { step: 2, title: "Quick safety questions", description: "We ask a few important questions to spot urgent warning signs early." },
                            { step: 3, title: "Tell us your symptoms", description: "You can type or speak about what brought you in today." },
                            { step: 4, title: "A few follow-up questions", description: "We may ask for a little more detail to understand your symptoms better." },
                            { step: 5, title: "See your queue status", description: "We show your triage result and where you are in the visit flow." },
                        ].map((item) => (
                            <div key={item.step} className={`${styles.nextStepItem} ${item.active ? styles.nextStepItemActive : ""}`}>
                                <div className={`${styles.nextStepBadge} ${item.active ? styles.nextStepBadgeActive : ""}`}>{item.step}</div>
                                <div className={styles.nextStepContent}>
                                    <Typography.Text className={styles.nextStepTitle}>
                                        {item.title}
                                        {item.active ? <span className={styles.nextStepCurrent}>You are here</span> : null}
                                    </Typography.Text>
                                    <Typography.Text className={styles.nextStepDescription}>{item.description}</Typography.Text>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const SymptomsStep = ({ freeText, selectedSymptoms, styles, isListening, speechSupported, onChangeFreeText, onToggleSymptom, onStartSpeech, onStopSpeech }: ISymptomsStepProps): React.JSX.Element => {
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

export const FollowUpStep = ({ extractedPrimarySymptoms, questions, answers, onSetAnswer, styles }: IFollowUpStepProps): React.JSX.Element => {
    return (
        <Space orientation="vertical" size={14} className={styles.centeredBlock}>
            <Space wrap className={styles.centeredWrap}>
                <Typography.Text strong>Captured main symptoms:</Typography.Text>
                {extractedPrimarySymptoms.length > 0 ? extractedPrimarySymptoms.map((symptom) => <Tag key={symptom} className={styles.extractedTag}>{symptom}</Tag>) : <Tag>No primary symptom found</Tag>}
            </Space>

            <div className={styles.questionList}>
                {questions.map((question) => (
                    <QuestionField key={question.questionKey} question={question} value={answers[question.questionKey]} onSetAnswer={onSetAnswer} />
                ))}
            </div>
        </Space>
    );
};

export const UrgentCheckStep = ({ questions, answers, onSetAnswer, urgentMessage, urgentTriggered, styles }: IUrgentCheckStepProps): React.JSX.Element => {
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
                <InputNumber aria-label={question.questionText} min={0} max={30} value={typeof value === "number" ? value : undefined} onChange={(nextValue) => onSetAnswer(question.questionKey, Number(nextValue ?? 0))} />
            ) : null}

            {question.inputType === "Text" ? (
                <Input.TextArea aria-label={question.questionText} value={typeof value === "string" ? value : ""} autoSize={{ minRows: 2, maxRows: 5 }} onChange={(event) => onSetAnswer(question.questionKey, event.target.value)} />
            ) : null}
        </Space>
    );
};

export const StatusStep = ({ triage, queue, styles }: IStatusStepProps): React.JSX.Element => {
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
