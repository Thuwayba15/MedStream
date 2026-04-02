"use client";

import { AudioOutlined, ClockCircleOutlined, EnvironmentOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { Button, Card, Input, InputNumber, Radio, Select, Space, Tag, Typography } from "antd";
import { formatMedstreamTime } from "@/lib/time/medstreamTime";
import type { IIntakeQuestion } from "@/services/patient-intake/types";
import {
    getIntakeJourneyItems,
    getPatientQuestionLabel,
    type ICheckInStepProps,
    type IFollowUpStepProps,
    type IStatusStepProps,
    type ISymptomsStepProps,
    type IUrgentCheckStepProps,
} from "./patientIntakeUtils";

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

            <div className={styles.checkInInfoCard}>
                <div className={styles.sectionEyebrow}>Visit Check-In</div>
                <Typography.Title level={4} className={styles.checkInCardTitle}>
                    Choose where you are being seen today
                </Typography.Title>

                <Select<number>
                    aria-label="Hospital"
                    data-testid="patient-hospital-select"
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
        </div>
    );
};

export const IntakeJourneyPanel = ({ currentStep, styles }: { currentStep: number; styles: Record<string, string> }): React.JSX.Element => {
    return (
        <div className={styles.nextStepsCard}>
            <div className={styles.sectionEyebrow}>What Happens Next</div>
            <div className={styles.nextStepsList}>
                {getIntakeJourneyItems(currentStep).map((item) => (
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
    );
};

export const SymptomsStep = ({ freeText, selectedSymptoms, styles, isListening, speechSupported, onChangeFreeText, onStartSpeech, onStopSpeech }: ISymptomsStepProps): React.JSX.Element => {
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

            {selectedSymptoms.length > 0 ? (
                <div>
                    <Typography.Text strong className={styles.symptomChipTitle}>
                        Selected symptoms
                    </Typography.Text>
                    <div className={`${styles.chipsWrap} ${styles.centeredWrap}`}>
                        {selectedSymptoms.map((symptom) => (
                            <Tag key={symptom} className={styles.extractedTag}>
                                {symptom}
                            </Tag>
                        ))}
                    </div>
                </div>
            ) : null}
        </Space>
    );
};

export const FollowUpStep = ({ title, currentPlanIndex, totalPlans, extractedPrimarySymptoms, questions, answers, onSetAnswer, styles }: IFollowUpStepProps): React.JSX.Element => {
    return (
        <Space orientation="vertical" size={14} className={styles.centeredBlock}>
            <Space orientation="vertical" size={4} className={styles.centeredBlock}>
                <Typography.Title level={4}>{title}</Typography.Title>
                <Typography.Text type="secondary">
                    Follow-up page {currentPlanIndex + 1} of {totalPlans}
                </Typography.Text>
            </Space>
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
                    <QuestionField key={question.questionKey} question={question} value={answers[question.questionKey]} onSetAnswer={onSetAnswer} styles={styles} />
                ))}
            </div>
        </Space>
    );
};

export const UrgentCheckStep = ({ questions, answers, onSetAnswer, urgentTriggered, styles }: IUrgentCheckStepProps): React.JSX.Element => {
    return (
        <Space orientation="vertical" size={14} className={styles.centeredBlock}>
            <div className={`${styles.urgentMessageCard} ${urgentTriggered ? styles.urgentMessageCardCritical : ""}`}>
                <div className={styles.urgentMessageIcon}>
                    <SafetyCertificateOutlined />
                </div>
                <div className={styles.urgentMessageContent}>
                    <Typography.Text className={styles.urgentMessageTitle}>{urgentTriggered ? "Urgent signs detected" : "Complete urgent safety check"}</Typography.Text>
                    <Typography.Text className={styles.urgentMessageDescription}>{"Answer these urgent safety questions before continuing."}</Typography.Text>
                </div>
            </div>

            <div className={styles.questionList}>
                {questions.map((question) => (
                    <QuestionField key={question.questionKey} question={question} value={answers[question.questionKey]} onSetAnswer={onSetAnswer} styles={styles} />
                ))}
            </div>
        </Space>
    );
};

const QuestionField = ({
    question,
    value,
    onSetAnswer,
    styles,
}: {
    question: IIntakeQuestion;
    value: string | number | boolean | string[] | undefined;
    onSetAnswer: (questionKey: string, value: string | number | boolean | string[]) => void;
    styles: Record<string, string>;
}): React.JSX.Element => {
    const questionLabel = getPatientQuestionLabel(question);

    return (
        <Space orientation="vertical" size={8} className={styles.questionField}>
            <Typography.Text strong className={styles.questionLabel}>
                {question.isRequired ? "* " : ""}
                {questionLabel}
            </Typography.Text>

            {question.inputType === "Boolean" ? (
                <Radio.Group aria-label={questionLabel} value={value} onChange={(event) => onSetAnswer(question.questionKey, event.target.value)}>
                    <Radio value={true}>Yes</Radio>
                    <Radio value={false}>No</Radio>
                </Radio.Group>
            ) : null}

            {question.inputType === "SingleSelect" ? (
                <Select
                    aria-label={questionLabel}
                    className={styles.questionSelect}
                    value={typeof value === "string" ? value : undefined}
                    placeholder="Select one option"
                    popupMatchSelectWidth={false}
                    dropdownStyle={{ minWidth: 320 }}
                    options={question.answerOptions.map((option) => ({ label: option.label, value: option.value }))}
                    onChange={(selectedValue) => onSetAnswer(question.questionKey, selectedValue)}
                />
            ) : null}

            {question.inputType === "MultiSelect" ? (
                <Select
                    aria-label={questionLabel}
                    className={styles.questionSelect}
                    mode="multiple"
                    value={Array.isArray(value) ? value.map((item) => String(item)) : []}
                    placeholder="Select all that apply"
                    popupMatchSelectWidth={false}
                    dropdownStyle={{ minWidth: 320 }}
                    options={question.answerOptions.map((option) => ({ label: option.label, value: option.value }))}
                    onChange={(selectedValue) => onSetAnswer(question.questionKey, selectedValue)}
                />
            ) : null}

            {question.inputType === "Number" ? (
                <InputNumber
                    aria-label={questionLabel}
                    className={styles.questionNumberInput}
                    min={0}
                    max={30}
                    addonAfter={/how long have you had/i.test(question.questionText) ? "days" : undefined}
                    value={typeof value === "number" ? value : undefined}
                    onChange={(nextValue) => onSetAnswer(question.questionKey, Number(nextValue ?? 0))}
                />
            ) : null}

            {question.inputType === "Text" ? (
                <Input.TextArea
                    aria-label={questionLabel}
                    className={styles.questionTextArea}
                    value={typeof value === "string" ? value : ""}
                    autoSize={{ minRows: 2, maxRows: 5 }}
                    onChange={(event) => onSetAnswer(question.questionKey, event.target.value)}
                />
            ) : null}
        </Space>
    );
};

export const StatusStep = ({ triage, queue, styles }: IStatusStepProps): React.JSX.Element => {
    const statusColor = triage?.urgencyLevel === "Urgent" ? "red" : triage?.urgencyLevel === "Priority" ? "orange" : "blue";

    return (
        <div className={styles.statusSection}>
            <div className={styles.statusGrid}>
                <Card className={styles.statusCard}>
                    <div className={styles.statusCardIcon}>
                        <SafetyCertificateOutlined />
                    </div>
                    <Typography.Text className={styles.statusCardEyebrow}>Triage</Typography.Text>
                    <Typography.Title level={3} className={styles.statusCardTitle}>
                        {triage?.urgencyLevel ?? "Pending"}
                    </Typography.Title>
                    <Tag color={statusColor} className={styles.statusTag}>
                        {triage?.urgencyLevel ?? "Pending"}
                    </Tag>
                    <Typography.Text className={styles.statusCardBody}>{triage?.explanation ?? "We are still preparing your assessment."}</Typography.Text>
                </Card>

                <Card className={styles.queueCard}>
                    <div className={styles.queueCardIcon}>
                        <ClockCircleOutlined />
                    </div>
                    <Typography.Text className={styles.statusCardEyebrow}>Queue</Typography.Text>
                    <Typography.Title level={3} className={styles.statusCardTitle}>
                        {queue?.positionPending ? "Position pending" : "In queue"}
                    </Typography.Title>
                    <Typography.Text className={styles.statusCardBody}>{queue?.message ?? "We are preparing your queue placement now."}</Typography.Text>
                    <Typography.Text className={styles.queueTimestamp}>Last updated: {formatMedstreamTime(queue?.lastUpdatedAt)}</Typography.Text>
                </Card>
            </div>
        </div>
    );
};
