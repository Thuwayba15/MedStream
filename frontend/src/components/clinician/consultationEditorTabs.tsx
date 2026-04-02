"use client";

import { AudioOutlined, HeartOutlined, RobotOutlined, StopOutlined } from "@ant-design/icons";
import { Button, Input, Space, Tag, Tooltip, Typography } from "antd";
import type { TabsProps } from "antd";
import type { INoteDraftState, IVitalsDraftState } from "./consultationHelpers";
import { sanitizeClinicalCopy } from "./consultationHelpers";

const { TextArea } = Input;

interface IConsultationEditorTabsProps {
    styles: Record<string, string>;
    isFinalized: boolean;
    noteDraft: INoteDraftState;
    vitalsDraft: IVitalsDraftState;
    missingTimelineSummaries: string[];
    subjectiveDraft?: { subjective?: string | null; summary?: string | null } | null;
    assessmentPlanDraft?: { assessment?: string | null; plan?: string | null; summary?: string | null } | null;
    isGeneratingSubjective: boolean;
    isRecording: boolean;
    isSavingVitals: boolean;
    isGeneratingAssessmentPlan: boolean;
    onGenerateSubjective: () => void;
    onToggleRecording: () => void;
    onApplyGeneratedSubjective: () => void;
    onSaveVitals: () => void;
    onGenerateAssessmentPlan: () => void;
    onApplyGeneratedAssessmentPlan: () => void;
    onUpdateNoteDraft: (updater: INoteDraftState | ((current: INoteDraftState) => INoteDraftState)) => void;
    onUpdateVitalsDraft: (updater: IVitalsDraftState | ((current: IVitalsDraftState) => IVitalsDraftState)) => void;
}

const buildObjectiveVitalCards = (vitalsDraft: IVitalsDraftState, isFinalized: boolean, styles: Record<string, string>, onUpdateVitalsDraft: IConsultationEditorTabsProps["onUpdateVitalsDraft"]) => [
    {
        key: "bloodPressure",
        label: "Blood pressure",
        unit: "mmHg",
        content: (
            <div className={styles.bpGrid}>
                <Input
                    value={vitalsDraft.bloodPressureSystolic}
                    onChange={(event) => onUpdateVitalsDraft((current) => ({ ...current, bloodPressureSystolic: event.target.value }))}
                    placeholder="Systolic"
                    disabled={isFinalized}
                />
                <Input
                    value={vitalsDraft.bloodPressureDiastolic}
                    onChange={(event) => onUpdateVitalsDraft((current) => ({ ...current, bloodPressureDiastolic: event.target.value }))}
                    placeholder="Diastolic"
                    disabled={isFinalized}
                />
            </div>
        ),
    },
    {
        key: "heartRate",
        label: "Heart rate",
        unit: "bpm",
        content: (
            <Input
                value={vitalsDraft.heartRate}
                onChange={(event) => onUpdateVitalsDraft((current) => ({ ...current, heartRate: event.target.value }))}
                placeholder="Heart rate"
                disabled={isFinalized}
            />
        ),
    },
    {
        key: "respiratoryRate",
        label: "Respiratory rate",
        unit: "breaths/min",
        content: (
            <Input
                value={vitalsDraft.respiratoryRate}
                onChange={(event) => onUpdateVitalsDraft((current) => ({ ...current, respiratoryRate: event.target.value }))}
                placeholder="Respiratory rate"
                disabled={isFinalized}
            />
        ),
    },
    {
        key: "temperature",
        label: "Temperature",
        unit: "deg C",
        content: (
            <Input
                value={vitalsDraft.temperatureCelsius}
                onChange={(event) => onUpdateVitalsDraft((current) => ({ ...current, temperatureCelsius: event.target.value }))}
                placeholder="Temperature"
                disabled={isFinalized}
            />
        ),
    },
    {
        key: "spo2",
        label: "Oxygen saturation",
        unit: "%",
        content: (
            <Input
                value={vitalsDraft.oxygenSaturation}
                onChange={(event) => onUpdateVitalsDraft((current) => ({ ...current, oxygenSaturation: event.target.value }))}
                placeholder="SpO2"
                disabled={isFinalized}
            />
        ),
    },
    {
        key: "glucose",
        label: "Blood glucose",
        unit: "mmol/L",
        content: (
            <Input
                value={vitalsDraft.bloodGlucose}
                onChange={(event) => onUpdateVitalsDraft((current) => ({ ...current, bloodGlucose: event.target.value }))}
                placeholder="Blood glucose"
                disabled={isFinalized}
            />
        ),
    },
    {
        key: "weight",
        label: "Weight",
        unit: "kg",
        content: (
            <Input value={vitalsDraft.weightKg} onChange={(event) => onUpdateVitalsDraft((current) => ({ ...current, weightKg: event.target.value }))} placeholder="Weight" disabled={isFinalized} />
        ),
    },
];

export const buildConsultationEditorTabs = ({
    styles,
    isFinalized,
    noteDraft,
    vitalsDraft,
    missingTimelineSummaries,
    subjectiveDraft,
    assessmentPlanDraft,
    isGeneratingSubjective,
    isRecording,
    isSavingVitals,
    isGeneratingAssessmentPlan,
    onGenerateSubjective,
    onToggleRecording,
    onApplyGeneratedSubjective,
    onSaveVitals,
    onGenerateAssessmentPlan,
    onApplyGeneratedAssessmentPlan,
    onUpdateNoteDraft,
    onUpdateVitalsDraft,
}: IConsultationEditorTabsProps): TabsProps["items"] => {
    const objectiveVitalCards = buildObjectiveVitalCards(vitalsDraft, isFinalized, styles, onUpdateVitalsDraft);

    return [
        {
            key: "subjective",
            label: "Subjective",
            children: (
                <div className={styles.editorPanel}>
                    <div className={styles.editorHeader}>
                        <div>
                            <Typography.Title level={3} className={styles.editorTitle}>
                                Subjective
                            </Typography.Title>
                            <Typography.Text className={styles.editorHint}>Starts from intake, then gets refined with consultation context.</Typography.Text>
                        </div>
                        <Space size={8}>
                            <Button icon={<RobotOutlined />} className={styles.signalAction} loading={isGeneratingSubjective} disabled={isFinalized} onClick={onGenerateSubjective}>
                                Refresh With AI
                            </Button>
                            <Tooltip title={isRecording ? "Stop consultation recording" : "Record consultation notes"}>
                                <Button
                                    aria-label={isRecording ? "Stop consultation recording" : "Start consultation recording"}
                                    data-testid={isRecording ? "consultation-stop-recording" : "consultation-start-recording"}
                                    icon={isRecording ? <StopOutlined /> : <AudioOutlined />}
                                    className={styles.micAction}
                                    danger={isRecording}
                                    disabled={isFinalized}
                                    onClick={onToggleRecording}
                                />
                            </Tooltip>
                        </Space>
                    </div>
                    {subjectiveDraft?.subjective ? (
                        <div className={styles.draftPreview}>
                            <Typography.Paragraph className={styles.bodyText}>{sanitizeClinicalCopy(subjectiveDraft.summary || subjectiveDraft.subjective)}</Typography.Paragraph>
                            <Button type="primary" className={styles.primaryAction} disabled={isFinalized} onClick={onApplyGeneratedSubjective}>
                                Apply Suggested Subjective
                            </Button>
                        </div>
                    ) : null}
                    <TextArea
                        value={noteDraft.subjective}
                        onChange={(event) => onUpdateNoteDraft((current) => ({ ...current, subjective: event.target.value }))}
                        className={styles.editorArea}
                        disabled={isFinalized}
                    />
                </div>
            ),
        },
        {
            key: "objective",
            label: "Objective",
            children: (
                <div className={styles.editorPanel}>
                    <div className={styles.editorHeader}>
                        <div>
                            <Typography.Title level={3} className={styles.editorTitle}>
                                Objective
                            </Typography.Title>
                            <Typography.Text className={styles.editorHint}>Structured vitals first, then free-text findings.</Typography.Text>
                        </div>
                        <Button icon={<HeartOutlined />} className={styles.signalAction} loading={isSavingVitals} disabled={isFinalized} onClick={onSaveVitals}>
                            Save Vitals
                        </Button>
                    </div>
                    <div className={styles.objectiveGrid}>
                        {objectiveVitalCards.map((card) => (
                            <div key={card.key} className={styles.vitalCard}>
                                <div className={styles.vitalHeader}>
                                    <span className={styles.vitalName}>{card.label}</span>
                                    <span className={styles.vitalUnit}>{card.unit}</span>
                                </div>
                                {card.content}
                            </div>
                        ))}
                    </div>
                    <TextArea
                        value={noteDraft.objective}
                        onChange={(event) => onUpdateNoteDraft((current) => ({ ...current, objective: event.target.value }))}
                        className={styles.editorArea}
                        disabled={isFinalized}
                        placeholder="Document examination findings, focused observations, and any additional objective notes."
                    />
                </div>
            ),
        },
        {
            key: "assessment",
            label: "Assessment",
            children: (
                <div className={styles.editorPanel}>
                    <div className={styles.editorHeader}>
                        <div>
                            <Typography.Title level={3} className={styles.editorTitle}>
                                Assessment
                            </Typography.Title>
                            <Typography.Text className={styles.editorHint}>Draft from consultation notes, vitals, and pathway context, then refine clinically.</Typography.Text>
                        </div>
                        <Button icon={<RobotOutlined />} className={styles.signalAction} loading={isGeneratingAssessmentPlan} disabled={isFinalized} onClick={onGenerateAssessmentPlan}>
                            Generate A/P Draft
                        </Button>
                    </div>
                    {assessmentPlanDraft?.assessment || assessmentPlanDraft?.plan ? (
                        <div className={styles.draftPreview}>
                            <Typography.Paragraph className={styles.bodyText}>
                                {sanitizeClinicalCopy(assessmentPlanDraft.summary || "Assessment and plan draft ready for review.")}
                            </Typography.Paragraph>
                            <Button type="primary" className={styles.primaryAction} disabled={isFinalized} onClick={onApplyGeneratedAssessmentPlan}>
                                Apply Assessment & Plan
                            </Button>
                        </div>
                    ) : null}
                    <TextArea
                        value={noteDraft.assessment}
                        onChange={(event) => onUpdateNoteDraft((current) => ({ ...current, assessment: event.target.value }))}
                        className={styles.editorArea}
                        disabled={isFinalized}
                    />
                </div>
            ),
        },
        {
            key: "plan",
            label: "Plan",
            children: (
                <div className={styles.editorPanel}>
                    <Typography.Title level={3} className={styles.editorTitle}>
                        Plan
                    </Typography.Title>
                    <TextArea
                        value={noteDraft.plan}
                        onChange={(event) => onUpdateNoteDraft((current) => ({ ...current, plan: event.target.value }))}
                        className={styles.editorArea}
                        disabled={isFinalized}
                    />
                </div>
            ),
        },
        {
            key: "timeline",
            label: "Timeline Summary",
            children: (
                <div className={styles.editorPanel}>
                    <div className={styles.editorHeader}>
                        <div>
                            <Typography.Title level={3} className={styles.editorTitle}>
                                Timeline Summaries
                            </Typography.Title>
                            <Typography.Text className={styles.editorHint}>
                                Finalize with one concise internal summary and one patient-friendly summary for the cross-facility timeline.
                            </Typography.Text>
                        </div>
                        <Tag className={missingTimelineSummaries.length === 0 ? styles.timelineReadyTag : styles.timelinePendingTag}>
                            {missingTimelineSummaries.length === 0 ? "Ready to finalize" : "Required before finalizing"}
                        </Tag>
                    </div>
                    <div className={styles.timelineSummaryGrid}>
                        <div className={styles.timelineSummaryCard}>
                            <div className={styles.timelineSummaryHeader}>
                                <div>
                                    <Typography.Title level={5} className={styles.timelineSummaryTitle}>
                                        Clinician-facing summary
                                    </Typography.Title>
                                    <Typography.Text className={styles.helperText}>Internal clinical recap for history review across facilities.</Typography.Text>
                                </div>
                                <span className={styles.summaryCounter}>{noteDraft.clinicianTimelineSummary.trim().length}/2000</span>
                            </div>
                            <TextArea
                                value={noteDraft.clinicianTimelineSummary}
                                onChange={(event) => onUpdateNoteDraft((current) => ({ ...current, clinicianTimelineSummary: event.target.value }))}
                                className={styles.timelineSummaryArea}
                                disabled={isFinalized}
                                maxLength={2000}
                                placeholder="Example: Presented with severe chest pain and tachycardia. ECG review initiated, acute coronary syndrome ruled out, and same-day follow-up arranged."
                                data-testid="consultation-clinician-timeline-summary"
                            />
                        </div>
                        <div className={styles.timelineSummaryCard}>
                            <div className={styles.timelineSummaryHeader}>
                                <div>
                                    <Typography.Title level={5} className={styles.timelineSummaryTitle}>
                                        Patient-friendly summary
                                    </Typography.Title>
                                    <Typography.Text className={styles.helperText}>Plain-language summary that the patient will see in their own history.</Typography.Text>
                                </div>
                                <span className={styles.summaryCounter}>{noteDraft.patientTimelineSummary.trim().length}/2000</span>
                            </div>
                            <TextArea
                                value={noteDraft.patientTimelineSummary}
                                onChange={(event) => onUpdateNoteDraft((current) => ({ ...current, patientTimelineSummary: event.target.value }))}
                                className={styles.timelineSummaryArea}
                                disabled={isFinalized}
                                maxLength={2000}
                                placeholder="Example: Seen for chest pain and shortness of breath. Your heart tests were reassuring today, and you were advised on warning signs and follow-up care."
                                data-testid="consultation-patient-timeline-summary"
                            />
                        </div>
                    </div>
                </div>
            ),
        },
    ];
};
