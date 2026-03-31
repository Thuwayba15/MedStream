"use client";

import {
    ArrowLeftOutlined,
    AudioOutlined,
    CheckCircleOutlined,
    FileDoneOutlined,
    FormOutlined,
    HeartOutlined,
    LoadingOutlined,
    RobotOutlined,
    SaveOutlined,
} from "@ant-design/icons";
import { Alert, Button, Card, Empty, Input, Skeleton, Space, Tabs, Tag, Typography } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useClinicianConsultationActions, useClinicianConsultationState } from "@/providers/clinician-consultation";
import type { TQueueStatus, TUrgencyLevel } from "@/services/queue-operations/types";
import { useClinicianConsultationStyles } from "./consultationStyle";

const { TextArea } = Input;

interface IClinicianConsultationPageProps {
    visitId?: number;
    queueTicketId?: number;
}

interface INoteDraftState {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
}

interface IVitalsDraftState {
    bloodPressureSystolic: string;
    bloodPressureDiastolic: string;
    heartRate: string;
    respiratoryRate: string;
    temperatureCelsius: string;
    oxygenSaturation: string;
    bloodGlucose: string;
    weightKg: string;
}

const createNoteDraft = (): INoteDraftState => ({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
});

const createVitalsDraft = (): IVitalsDraftState => ({
    bloodPressureSystolic: "",
    bloodPressureDiastolic: "",
    heartRate: "",
    respiratoryRate: "",
    temperatureCelsius: "",
    oxygenSaturation: "",
    bloodGlucose: "",
    weightKg: "",
});

const asNumber = (value: string): number | null => {
    if (!value.trim()) {
        return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const formatVisitStartedAt = (value?: string): string => {
    if (!value) {
        return "Consultation in progress";
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return "Consultation in progress";
    }

    return `Started ${parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
};

const getUrgencyClassName = (urgencyLevel: string, styles: Record<string, string>): string => {
    if (urgencyLevel === "Urgent") {
        return styles.urgencyUrgent;
    }

    if (urgencyLevel === "Priority") {
        return styles.urgencyPriority;
    }

    return styles.urgencyRoutine;
};

const getStatusLabel = (status?: TQueueStatus): string => {
    if (!status) {
        return "Queue active";
    }

    return status.replaceAll("_", " ");
};

const buildPatientSummary = (patientName: string, subjectiveSummary: string): string => {
    if (subjectiveSummary.trim()) {
        return subjectiveSummary;
    }

    return `${patientName}'s intake summary has not been drafted yet. Capture the consultation and complete the SOAP note manually.`;
};

export const ClinicianConsultationPage = ({ visitId, queueTicketId }: IClinicianConsultationPageProps): React.JSX.Element => {
    const { styles } = useClinicianConsultationStyles();
    const router = useRouter();
    const state = useClinicianConsultationState();
    const actions = useClinicianConsultationActions();
    const [activeTab, setActiveTab] = useState("subjective");
    const [noteDraft, setNoteDraft] = useState<INoteDraftState>(createNoteDraft);
    const [vitalsDraft, setVitalsDraft] = useState<IVitalsDraftState>(createVitalsDraft);
    const [transcriptText, setTranscriptText] = useState("");

    useEffect(() => {
        if (visitId) {
            void actions.loadWorkspace({ visitId, queueTicketId });
        }
    }, [actions, queueTicketId, visitId]);

    useEffect(() => {
        if (!state.workspace) {
            return;
        }

        setNoteDraft({
            subjective: state.workspace.encounterNote.subjective || state.workspace.encounterNote.intakeSubjective || "",
            objective: state.workspace.encounterNote.objective || "",
            assessment: state.workspace.encounterNote.assessment || "",
            plan: state.workspace.encounterNote.plan || "",
        });

        setVitalsDraft({
            bloodPressureSystolic: state.workspace.latestVitals?.bloodPressureSystolic?.toString() ?? "",
            bloodPressureDiastolic: state.workspace.latestVitals?.bloodPressureDiastolic?.toString() ?? "",
            heartRate: state.workspace.latestVitals?.heartRate?.toString() ?? "",
            respiratoryRate: state.workspace.latestVitals?.respiratoryRate?.toString() ?? "",
            temperatureCelsius: state.workspace.latestVitals?.temperatureCelsius?.toString() ?? "",
            oxygenSaturation: state.workspace.latestVitals?.oxygenSaturation?.toString() ?? "",
            bloodGlucose: state.workspace.latestVitals?.bloodGlucose?.toString() ?? "",
            weightKg: state.workspace.latestVitals?.weightKg?.toString() ?? "",
        });
    }, [state.workspace]);

    const workspace = state.workspace;
    const review = state.review;
    const patientName = review?.patientName ?? workspace?.patientContext.patientName ?? "Consultation";
    const queueStatus = review?.queueStatus ?? (workspace?.patientContext.queueStatus as TQueueStatus | undefined);
    const urgencyLevel = (review?.urgencyLevel ?? workspace?.patientContext.urgencyLevel ?? "Priority") as TUrgencyLevel;
    const aiSummary = review?.clinicianSummary ?? workspace?.patientContext.subjectiveSummary ?? "";
    const reasoning = review?.reasoning ?? [];
    const transcriptCount = workspace?.transcripts.length ?? 0;
    const latestTranscript = transcriptCount > 0 ? workspace?.transcripts[transcriptCount - 1] : null;
    const isFinalized = (workspace?.encounterNote.status ?? "draft") === "finalized";
    const canCompleteVisit = isFinalized && Boolean(review?.queueTicketId) && queueStatus === "in_consultation";

    const saveNoteDraft = async (): Promise<void> => {
        if (!workspace) {
            return;
        }

        await actions.saveEncounterNoteDraft({
            visitId: workspace.visitId,
            subjective: noteDraft.subjective,
            objective: noteDraft.objective,
            assessment: noteDraft.assessment,
            plan: noteDraft.plan,
        });
    };

    const finalizeNote = async (): Promise<void> => {
        if (!workspace) {
            return;
        }

        const saved = await actions.saveEncounterNoteDraft({
            visitId: workspace.visitId,
            subjective: noteDraft.subjective,
            objective: noteDraft.objective,
            assessment: noteDraft.assessment,
            plan: noteDraft.plan,
        });

        if (!saved) {
            return;
        }

        await actions.finalizeEncounterNote(workspace.visitId);
    };

    const saveVitals = async (): Promise<void> => {
        if (!workspace) {
            return;
        }

        await actions.saveVitals({
            visitId: workspace.visitId,
            phase: "consultation",
            bloodPressureSystolic: asNumber(vitalsDraft.bloodPressureSystolic),
            bloodPressureDiastolic: asNumber(vitalsDraft.bloodPressureDiastolic),
            heartRate: asNumber(vitalsDraft.heartRate),
            respiratoryRate: asNumber(vitalsDraft.respiratoryRate),
            temperatureCelsius: asNumber(vitalsDraft.temperatureCelsius),
            oxygenSaturation: asNumber(vitalsDraft.oxygenSaturation),
            bloodGlucose: asNumber(vitalsDraft.bloodGlucose),
            weightKg: asNumber(vitalsDraft.weightKg),
        });
    };

    const attachTranscript = async (): Promise<void> => {
        if (!workspace || !transcriptText.trim()) {
            return;
        }

        const attached = await actions.attachTranscript({
            visitId: workspace.visitId,
            inputMode: "typed",
            rawTranscriptText: transcriptText.trim(),
        });

        if (attached) {
            setTranscriptText("");
        }
    };

    const applyGeneratedSubjective = (): void => {
        if (!state.subjectiveDraft?.subjective) {
            return;
        }

        setNoteDraft((current) => ({
            ...current,
            subjective: state.subjectiveDraft?.subjective ?? current.subjective,
        }));
        setActiveTab("subjective");
    };

    const applyGeneratedAssessmentPlan = (): void => {
        setNoteDraft((current) => ({
            ...current,
            assessment: state.assessmentPlanDraft?.assessment ?? current.assessment,
            plan: state.assessmentPlanDraft?.plan ?? current.plan,
        }));
        setActiveTab("assessment");
    };

    const completeVisit = async (): Promise<void> => {
        if (!review?.queueTicketId) {
            return;
        }

        const result = await actions.completeVisit(review.queueTicketId);
        if (result) {
            router.push(`/clinician/review/${review.queueTicketId}`);
        }
    };

    const aiBannerAction = useMemo(() => {
        if (!workspace) {
            return {
                label: "Preparing Workspace",
                loading: true,
                onClick: () => undefined,
            };
        }

        if (activeTab === "subjective") {
            return {
                label: "Refresh Subjective",
                loading: state.isGeneratingSubjective,
                onClick: () => void actions.generateSubjectiveDraft(workspace.visitId),
            };
        }

        if (activeTab === "assessment" || activeTab === "plan") {
            return {
                label: "Generate Draft",
                loading: state.isGeneratingAssessmentPlan,
                onClick: () => void actions.generateAssessmentPlanDraft(workspace.visitId),
            };
        }

        return {
            label: "Save Objective",
            loading: state.isSavingVitals,
            onClick: () => void saveVitals(),
        };
    }, [
        actions,
        activeTab,
        state.isGeneratingAssessmentPlan,
        state.isGeneratingSubjective,
        state.isSavingVitals,
        workspace,
    ]);

    const noteTabs = [
        {
            key: "subjective",
            label: "subjective",
            children: (
                <div className={styles.editorPanel}>
                    <div className={styles.editorHeader}>
                        <div>
                            <Typography.Title level={3} className={styles.editorTitle}>
                                Subjective
                            </Typography.Title>
                            <Typography.Text className={styles.editorHint}>Starts from intake, then gets refined with consultation context.</Typography.Text>
                        </div>
                        <Button
                            icon={<RobotOutlined />}
                            className={styles.secondaryAction}
                            loading={state.isGeneratingSubjective}
                            onClick={() => workspace && void actions.generateSubjectiveDraft(workspace.visitId)}
                        >
                            Refresh With AI
                        </Button>
                    </div>

                    {state.subjectiveDraft?.subjective ? (
                        <div className={styles.draftPreview}>
                            <Space orientation="vertical" size={10}>
                                <Typography.Text strong>Suggested merged subjective</Typography.Text>
                                <Typography.Paragraph className={styles.bodyText}>{state.subjectiveDraft.summary}</Typography.Paragraph>
                                <Typography.Paragraph className={styles.bodyText}>{state.subjectiveDraft.subjective}</Typography.Paragraph>
                                <Space wrap>
                                    <Button type="primary" className={styles.primaryAction} onClick={applyGeneratedSubjective}>
                                        Apply Suggested Subjective
                                    </Button>
                                </Space>
                            </Space>
                        </div>
                    ) : null}

                    <TextArea
                        value={noteDraft.subjective}
                        onChange={(event) => setNoteDraft((current) => ({ ...current, subjective: event.target.value }))}
                        className={styles.editorArea}
                        placeholder="Capture the patient's history, symptoms, and reported timeline."
                    />
                </div>
            ),
        },
        {
            key: "objective",
            label: "objective",
            children: (
                <div className={styles.editorPanel}>
                    <div className={styles.editorHeader}>
                        <div>
                            <Typography.Title level={3} className={styles.editorTitle}>
                                Objective
                            </Typography.Title>
                            <Typography.Text className={styles.editorHint}>Structured vitals first, then free-text findings from the examination.</Typography.Text>
                        </div>
                        <Button icon={<HeartOutlined />} className={styles.secondaryAction} loading={state.isSavingVitals} onClick={() => void saveVitals()}>
                            Save Vitals
                        </Button>
                    </div>

                    <div className={styles.objectiveGrid}>
                        <VitalCard
                            label="Blood pressure"
                            unit="mmHg"
                            styles={styles}
                            body={
                                <div className={styles.bpGrid}>
                                    <Input
                                        value={vitalsDraft.bloodPressureSystolic}
                                        onChange={(event) => setVitalsDraft((current) => ({ ...current, bloodPressureSystolic: event.target.value }))}
                                        placeholder="Systolic"
                                        inputMode="numeric"
                                    />
                                    <Input
                                        value={vitalsDraft.bloodPressureDiastolic}
                                        onChange={(event) => setVitalsDraft((current) => ({ ...current, bloodPressureDiastolic: event.target.value }))}
                                        placeholder="Diastolic"
                                        inputMode="numeric"
                                    />
                                </div>
                            }
                        />
                        <VitalCard
                            label="Heart rate"
                            unit="bpm"
                            styles={styles}
                            body={<Input value={vitalsDraft.heartRate} onChange={(event) => setVitalsDraft((current) => ({ ...current, heartRate: event.target.value }))} placeholder="110" inputMode="numeric" />}
                        />
                        <VitalCard
                            label="Temperature"
                            unit="deg C"
                            styles={styles}
                            body={<Input value={vitalsDraft.temperatureCelsius} onChange={(event) => setVitalsDraft((current) => ({ ...current, temperatureCelsius: event.target.value }))} placeholder="37.2" inputMode="decimal" />}
                        />
                        <VitalCard
                            label="SpO2"
                            unit="%"
                            styles={styles}
                            body={<Input value={vitalsDraft.oxygenSaturation} onChange={(event) => setVitalsDraft((current) => ({ ...current, oxygenSaturation: event.target.value }))} placeholder="94" inputMode="numeric" />}
                        />
                        <VitalCard
                            label="Respiratory rate"
                            unit="breaths/min"
                            styles={styles}
                            body={<Input value={vitalsDraft.respiratoryRate} onChange={(event) => setVitalsDraft((current) => ({ ...current, respiratoryRate: event.target.value }))} placeholder="22" inputMode="numeric" />}
                        />
                        <VitalCard
                            label="Blood glucose"
                            unit="mmol/L"
                            styles={styles}
                            body={<Input value={vitalsDraft.bloodGlucose} onChange={(event) => setVitalsDraft((current) => ({ ...current, bloodGlucose: event.target.value }))} placeholder="Optional" inputMode="decimal" />}
                        />
                        <VitalCard
                            label="Weight"
                            unit="kg"
                            styles={styles}
                            body={<Input value={vitalsDraft.weightKg} onChange={(event) => setVitalsDraft((current) => ({ ...current, weightKg: event.target.value }))} placeholder="Optional" inputMode="decimal" />}
                        />
                    </div>

                    <TextArea
                        value={noteDraft.objective}
                        onChange={(event) => setNoteDraft((current) => ({ ...current, objective: event.target.value }))}
                        className={styles.editorArea}
                        placeholder="Document examination findings, bedside tests, and other objective observations."
                    />
                </div>
            ),
        },
        {
            key: "assessment",
            label: "assessment",
            children: (
                <div className={styles.editorPanel}>
                    <div className={styles.editorHeader}>
                        <div>
                            <Typography.Title level={3} className={styles.editorTitle}>
                                Assessment
                            </Typography.Title>
                            <Typography.Text className={styles.editorHint}>AI can suggest a draft once the consultation notes and objective findings are in place.</Typography.Text>
                        </div>
                        <Button
                            icon={<RobotOutlined />}
                            className={styles.secondaryAction}
                            loading={state.isGeneratingAssessmentPlan}
                            onClick={() => workspace && void actions.generateAssessmentPlanDraft(workspace.visitId)}
                        >
                            Generate A/P Draft
                        </Button>
                    </div>

                    {state.assessmentPlanDraft?.assessment || state.assessmentPlanDraft?.plan ? (
                        <div className={styles.draftPreview}>
                            <Space orientation="vertical" size={10}>
                                <Typography.Text strong>AI suggestion ready</Typography.Text>
                                <Typography.Paragraph className={styles.bodyText}>{state.assessmentPlanDraft.summary}</Typography.Paragraph>
                                <Space wrap>
                                    <Button type="primary" className={styles.primaryAction} onClick={applyGeneratedAssessmentPlan}>
                                        Apply Assessment & Plan
                                    </Button>
                                </Space>
                            </Space>
                        </div>
                    ) : null}

                    <TextArea
                        value={noteDraft.assessment}
                        onChange={(event) => setNoteDraft((current) => ({ ...current, assessment: event.target.value }))}
                        className={styles.editorArea}
                        placeholder="Describe your clinical impression and working diagnosis."
                    />
                </div>
            ),
        },
        {
            key: "plan",
            label: "plan",
            children: (
                <div className={styles.editorPanel}>
                    <div className={styles.editorHeader}>
                        <div>
                            <Typography.Title level={3} className={styles.editorTitle}>
                                Plan
                            </Typography.Title>
                            <Typography.Text className={styles.editorHint}>Orders, medications, referrals, monitoring, and next steps.</Typography.Text>
                        </div>
                    </div>
                    <TextArea
                        value={noteDraft.plan}
                        onChange={(event) => setNoteDraft((current) => ({ ...current, plan: event.target.value }))}
                        className={styles.editorArea}
                        placeholder="Capture treatment, investigations, safety-netting, and follow-up."
                    />
                </div>
            ),
        },
    ];

    return (
        <section className={styles.page}>
            <header className={styles.topBar}>
                <div className={styles.topBarLeft}>
                    <Link href={queueTicketId ? `/clinician/review/${queueTicketId}` : "/clinician"}>
                        <Button icon={<ArrowLeftOutlined />} className={styles.backButton}>
                            Back
                        </Button>
                    </Link>
                    <div>
                        <Typography.Title level={2} className={styles.pageTitle}>
                            Consultation: {patientName}
                        </Typography.Title>
                        <Typography.Text className={styles.pageMeta}>{formatVisitStartedAt(workspace?.patientContext.visitDate)}</Typography.Text>
                    </div>
                </div>

                <div className={styles.topActions}>
                    <Button icon={<SaveOutlined />} className={styles.secondaryAction} loading={state.isSavingDraft} onClick={() => void saveNoteDraft()}>
                        Save Draft
                    </Button>
                    <Button type="primary" icon={<FileDoneOutlined />} className={styles.primaryAction} loading={state.isFinalizing} onClick={() => void finalizeNote()}>
                        Finalize Note
                    </Button>
                    {canCompleteVisit ? (
                        <Button icon={<CheckCircleOutlined />} className={styles.secondaryAction} loading={state.isCompletingVisit} onClick={() => void completeVisit()}>
                            Complete Visit
                        </Button>
                    ) : null}
                </div>
            </header>

            {state.errorMessage ? (
                <Alert
                    type="error"
                    showIcon
                    message={state.errorMessage}
                    action={
                        <Button size="small" onClick={actions.clearMessages}>
                            Dismiss
                        </Button>
                    }
                />
            ) : null}

            {state.successMessage ? (
                <Alert
                    type="success"
                    showIcon
                    message={state.successMessage}
                    action={
                        <Button size="small" onClick={actions.clearMessages}>
                            Close
                        </Button>
                    }
                />
            ) : null}

            {!visitId ? (
                <Card className={styles.emptyStateCard}>
                    <Empty description="Open consultation from a queue review so the active visit context is carried into this workspace." />
                </Card>
            ) : state.isLoadingWorkspace && !workspace ? (
                <Card className={styles.panelCard}>
                    <Skeleton active paragraph={{ rows: 12 }} />
                </Card>
            ) : !workspace ? (
                <Card className={styles.emptyStateCard}>
                    <Empty description="Consultation workspace could not be loaded for this visit." />
                </Card>
            ) : (
                <div className={styles.shellGrid}>
                    <aside className={styles.sideRail}>
                        <Card className={styles.panelCard}>
                            <div className={styles.patientCard}>
                                <Typography.Title level={5} className={styles.sectionHeading}>
                                    Patient Context
                                </Typography.Title>
                                <div className={styles.patientSummaryBox}>
                                    <Typography.Paragraph className={styles.patientSummaryLead}>
                                        {workspace.patientContext.patientName}
                                    </Typography.Paragraph>
                                    <Typography.Paragraph className={styles.patientSummaryText}>
                                        {buildPatientSummary(workspace.patientContext.patientName, workspace.patientContext.subjectiveSummary)}
                                    </Typography.Paragraph>
                                </div>
                                <div className={styles.tagRow}>
                                    <Tag className={styles.queueTag}>{getStatusLabel(queueStatus)}</Tag>
                                    <Tag className={getUrgencyClassName(urgencyLevel, styles)}>Triage: {urgencyLevel}</Tag>
                                </div>
                                <div className={styles.summaryGlow}>
                                    <Typography.Text strong>AI handoff summary</Typography.Text>
                                    <Typography.Paragraph className={styles.bodyText} style={{ marginTop: 8 }}>
                                        {aiSummary || "A clinician-facing summary is not available yet. Continue with the note manually."}
                                    </Typography.Paragraph>
                                </div>
                            </div>
                        </Card>

                        <Card className={styles.panelCard}>
                            <Typography.Title level={5} className={styles.sectionHeading}>
                                Triage Signals
                            </Typography.Title>
                            {reasoning.length > 0 ? (
                                <div className={styles.reasoningList}>
                                    {reasoning.map((item) => (
                                        <div key={item} className={styles.reasoningItem}>
                                            <span className={styles.dot} />
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <Typography.Paragraph className={styles.bodyText}>
                                    No explicit triage reasoning was attached to this handoff.
                                </Typography.Paragraph>
                            )}
                        </Card>

                        <Card className={styles.panelCard}>
                            <Space orientation="vertical" size={12} style={{ width: "100%" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                                    <Typography.Title level={5} className={styles.sectionHeading} style={{ marginBottom: 0 }}>
                                        Latest Vitals
                                    </Typography.Title>
                                    <Button size="small" className={styles.secondaryAction} onClick={() => setActiveTab("objective")}>
                                        Update
                                    </Button>
                                </div>
                                <div className={styles.metricStack}>
                                    <div className={styles.metricRow}>
                                        <span className={styles.metricLabel}>BP</span>
                                        <span className={styles.metricValue}>
                                            {workspace.latestVitals?.bloodPressureSystolic && workspace.latestVitals?.bloodPressureDiastolic
                                                ? `${workspace.latestVitals.bloodPressureSystolic}/${workspace.latestVitals.bloodPressureDiastolic}`
                                                : "Not recorded"}
                                        </span>
                                    </div>
                                    <div className={`${styles.metricRow} ${workspace.latestVitals?.heartRate && workspace.latestVitals.heartRate > 100 ? styles.metricRowAlert : ""}`}>
                                        <span className={styles.metricLabel}>HR</span>
                                        <span className={styles.metricValue}>
                                            {workspace.latestVitals?.heartRate ? `${workspace.latestVitals.heartRate} bpm` : "Not recorded"}
                                        </span>
                                    </div>
                                    <div className={styles.metricRow}>
                                        <span className={styles.metricLabel}>Temp</span>
                                        <span className={styles.metricValue}>
                                            {workspace.latestVitals?.temperatureCelsius ? `${workspace.latestVitals.temperatureCelsius} deg C` : "Not recorded"}
                                        </span>
                                    </div>
                                    <div className={styles.metricRow}>
                                        <span className={styles.metricLabel}>SpO2</span>
                                        <span className={styles.metricValue}>
                                            {workspace.latestVitals?.oxygenSaturation ? `${workspace.latestVitals.oxygenSaturation}%` : "Not recorded"}
                                        </span>
                                    </div>
                                </div>
                            </Space>
                        </Card>

                        <Card className={styles.panelCard}>
                            <Space orientation="vertical" size={12} style={{ width: "100%" }}>
                                <Typography.Title level={5} className={styles.sectionHeading}>
                                    Consultation Capture
                                </Typography.Title>
                                <Typography.Paragraph className={styles.bodyText}>
                                    Add typed transcript notes now. Audio upload comes next, but this already gives the AI enough source material to assist.
                                </Typography.Paragraph>
                                <TextArea
                                    value={transcriptText}
                                    onChange={(event) => setTranscriptText(event.target.value)}
                                    className={styles.transcriptArea}
                                    placeholder="Paste or type the consultation transcript, translated notes, or dictated summary here."
                                />
                                <Space wrap>
                                    <Button
                                        icon={state.isAttachingTranscript ? <LoadingOutlined /> : <AudioOutlined />}
                                        className={styles.secondaryAction}
                                        loading={state.isAttachingTranscript}
                                        onClick={() => void attachTranscript()}
                                    >
                                        Attach Transcript
                                    </Button>
                                    <span className={styles.transcriptMeta}>
                                        {transcriptCount > 0
                                            ? `${transcriptCount} transcript ${transcriptCount === 1 ? "entry" : "entries"} attached`
                                            : "No transcript attached yet"}
                                    </span>
                                </Space>
                                {latestTranscript ? (
                                    <Typography.Text className={styles.helperText}>
                                        Latest capture: {new Date(latestTranscript.capturedAt).toLocaleString()}
                                    </Typography.Text>
                                ) : null}
                            </Space>
                        </Card>
                    </aside>

                    <div className={styles.mainColumn}>
                        <Card className={styles.aiBanner}>
                            <div className={styles.aiBannerInner}>
                                <div className={styles.aiBannerLead}>
                                    <div className={styles.aiIconWrap}>
                                        <RobotOutlined />
                                    </div>
                                    <div>
                                        <Typography.Title level={4} className={styles.aiBannerTitle}>
                                            AI Clinical Assistant
                                        </Typography.Title>
                                        <Typography.Paragraph className={styles.aiBannerText}>
                                            {activeTab === "subjective"
                                                ? "Merge intake context with the consultation transcript before you lock in the final narrative."
                                                : activeTab === "objective"
                                                  ? "Objective findings stay clinician-led. Save structured vitals, then continue with exam notes."
                                                  : "Draft Assessment and Plan from the consultation note, then edit as needed."}
                                        </Typography.Paragraph>
                                    </div>
                                </div>
                                <Button type="primary" className={styles.bannerButton} loading={aiBannerAction.loading} onClick={aiBannerAction.onClick}>
                                    {aiBannerAction.label}
                                </Button>
                            </div>
                        </Card>

                        <Card className={styles.workspaceCard}>
                            <div className={styles.statusStrip}>
                                <span className={styles.successPill}>{isFinalized ? "Finalized" : "Draft in progress"}</span>
                                {workspace.encounterNote.finalizedAt ? (
                                    <Typography.Text className={styles.helperText}>
                                        Finalized {new Date(workspace.encounterNote.finalizedAt).toLocaleString()}
                                    </Typography.Text>
                                ) : null}
                                <Typography.Text className={styles.helperText}>
                                    {review?.chiefComplaint || workspace.patientContext.chiefComplaint || workspace.visitStatus}
                                </Typography.Text>
                            </div>
                            <Tabs activeKey={activeTab} onChange={setActiveTab} items={noteTabs} />
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                                <Typography.Text className={styles.helperText}>
                                    Clinician retains control over all final SOAP content.
                                </Typography.Text>
                                <Space wrap>
                                    <Button icon={<SaveOutlined />} className={styles.secondaryAction} loading={state.isSavingDraft} onClick={() => void saveNoteDraft()}>
                                        Save Draft
                                    </Button>
                                    <Button type="primary" icon={<FormOutlined />} className={styles.primaryAction} loading={state.isFinalizing} onClick={() => void finalizeNote()}>
                                        Finalize Note
                                    </Button>
                                </Space>
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </section>
    );
};

interface IVitalCardProps {
    label: string;
    unit: string;
    styles: Record<string, string>;
    body: React.ReactNode;
}

const VitalCard = ({ label, unit, styles, body }: IVitalCardProps): React.JSX.Element => {
    return (
        <div className={styles.vitalCard}>
            <div className={styles.vitalHeader}>
                <span className={styles.vitalName}>{label}</span>
                <span className={styles.vitalUnit}>{unit}</span>
            </div>
            {body}
        </div>
    );
};
