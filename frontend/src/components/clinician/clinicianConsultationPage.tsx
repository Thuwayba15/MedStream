"use client";

import { ArrowLeftOutlined, AudioOutlined, CheckCircleOutlined, FileDoneOutlined, HeartOutlined, LoadingOutlined, RobotOutlined, SaveOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Empty, Input, Skeleton, Space, Steps, Tabs, Tag, Typography } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useClinicianConsultationActions, useClinicianConsultationState } from "@/providers/clinician-consultation";
import type { IConsultationInboxItem, IConsultationWorkspace } from "@/services/consultation/types";
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

const createNoteDraft = (): INoteDraftState => ({ subjective: "", objective: "", assessment: "", plan: "" });
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
    const parsed = Number(value);
    return value.trim() && Number.isFinite(parsed) ? parsed : null;
};

const humanizeClinicalLabel = (label: string): string => {
    const normalized = label.trim().toLowerCase();
    if (!normalized) {
        return "";
    }

    if (normalized === "selected symptoms" || normalized === "extracted primary symptoms") {
        return "Symptoms reported";
    }

    if (normalized === "follow-up answers") {
        return "Key details";
    }

    if (normalized === "primary concern") {
        return "Primary concern";
    }

    if (normalized === "chief complaint") {
        return "Chief complaint";
    }

    if (normalized === "triage category") {
        return "Triage category";
    }

    if (normalized === "please describe your main concern in one sentence.") {
        return "Main concern";
    }

    if (normalized === "select any danger signs now.") {
        return "Danger signs reported";
    }

    return label.trim();
};

const humanizeStructuredSegment = (segment: string): string => {
    const trimmedSegment = segment.trim().replace(/\.$/, "");
    if (!trimmedSegment) {
        return "";
    }

    const parts = trimmedSegment.split(":");
    if (parts.length < 2) {
        return trimmedSegment.endsWith(".") ? trimmedSegment : `${trimmedSegment}.`;
    }

    const rawLabel = parts.shift()?.trim() ?? "";
    const value = parts.join(":").trim();
    if (!rawLabel || !value) {
        return "";
    }

    if (value === "[]") {
        return "";
    }

    if (/^(false|no)$/i.test(value)) {
        return "";
    }

    const friendlyLabel = humanizeClinicalLabel(rawLabel);
    if (/^(true|yes)$/i.test(value)) {
        return `${friendlyLabel}.`;
    }

    if (friendlyLabel === "Symptoms reported") {
        return `${friendlyLabel}: ${value}.`;
    }

    return `${friendlyLabel}: ${value}.`;
};

const sanitizeClinicalCopy = (value?: string | null): string => {
    if (!value?.trim()) {
        return "";
    }

    let cleaned = value
        .replace(/Follow-up answers:/gi, "Key details:")
        .replace(/urgentSevereBreathing:\s*True/gi, "Severe difficulty breathing reported")
        .replace(/urgentSevereChestPain:\s*True/gi, "Severe chest pain reported")
        .replace(/urgentUncontrolledBleeding:\s*True/gi, "Uncontrolled bleeding reported")
        .replace(/urgentCollapse:\s*True/gi, "Collapse or blackout reported")
        .replace(/urgentConfusion:\s*True/gi, "Confusion or reduced responsiveness reported")
        .replace(/urgent[A-Za-z]+:\s*False;?/g, "")
        .trim();

    const rawSections = cleaned
        .split(/\r?\n|(?=Chief complaint:|Selected symptoms:|Extracted primary symptoms:|Key details:|Primary concern:|Symptoms reported:|Triage category:)/gi)
        .map((segment) => segment.replace(/\s+/g, " ").trim())
        .filter(Boolean);

    const seen = new Set<string>();
    const rendered = rawSections.map((section) => {
        const parts = section.split(":");
        if (parts.length < 2) {
            const plain = section.endsWith(".") ? section : `${section}.`;
            if (seen.has(plain.toLowerCase())) {
                return "";
            }

            seen.add(plain.toLowerCase());
            return plain;
        }

        const rawLabel = parts.shift()?.trim() ?? "";
        const valuePart = parts.join(":").trim();
        const label = humanizeClinicalLabel(rawLabel);

        if (!valuePart) {
            return "";
        }

        if (label === "Key details") {
            const detailText = valuePart
                .split(";")
                .map((segment) => humanizeStructuredSegment(segment))
                .filter(Boolean)
                .join("\n");
            const summary = detailText ? `${label}:\n${detailText}` : "";
            if (!summary || seen.has(summary.toLowerCase())) {
                return "";
            }

            seen.add(summary.toLowerCase());
            return summary;
        }

        const summary = `${label}: ${valuePart.replace(/\s+/g, " ").trim()}`.trim();
        if (summary.endsWith(": []")) {
            return "";
        }

        if (seen.has(summary.toLowerCase())) {
            return "";
        }

        seen.add(summary.toLowerCase());
        return summary;
    }).filter(Boolean);

    cleaned = rendered.length > 0 ? rendered.join("\n\n") : cleaned;
    cleaned = cleaned
        .replace(/Symptoms reported:\s*([^\n.]*)\s*Symptoms reported:/gi, "Symptoms reported: $1 ")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/\s+\./g, ".")
        .trim();

    return cleaned;
};

const formatVisitStartedAt = (value?: string): string => {
    const parsed = value ? new Date(value) : null;
    return parsed && !Number.isNaN(parsed.getTime())
        ? `Started ${parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
        : "Consultation in progress";
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

const getStatusLabel = (status?: TQueueStatus | string): string => {
    if (!status) {
        return "Queue active";
    }

    return status.replaceAll("_", " ");
};

const isConcerning = (label: string, vitals?: IConsultationWorkspace["latestVitals"]): boolean => {
    switch (label) {
        case "BP":
            return Boolean((vitals?.bloodPressureSystolic ?? 0) >= 140 || (vitals?.bloodPressureSystolic ?? 999) < 90 || (vitals?.bloodPressureDiastolic ?? 0) >= 90 || (vitals?.bloodPressureDiastolic ?? 999) < 60);
        case "HR":
            return Boolean((vitals?.heartRate ?? 0) > 100 || (vitals?.heartRate ?? 999) < 50);
        case "Temp":
            return Boolean((vitals?.temperatureCelsius ?? 0) >= 38 || (vitals?.temperatureCelsius ?? 999) < 35);
        case "SpO2":
            return Boolean((vitals?.oxygenSaturation ?? 100) < 95);
        case "RR":
            return Boolean((vitals?.respiratoryRate ?? 0) > 20 || (vitals?.respiratoryRate ?? 999) < 10);
        default:
            return false;
    }
};

const InboxCard = ({ item, styles }: { item: IConsultationInboxItem; styles: Record<string, string> }): React.JSX.Element => (
    <Card className={styles.inboxCard}>
        <div className={styles.inboxCardHeader}>
            <div>
                <Typography.Title level={4} className={styles.inboxPatientName}>
                    {item.patientName}
                </Typography.Title>
                <Typography.Text className={styles.helperText}>{formatVisitStartedAt(item.visitDate)}</Typography.Text>
            </div>
            <Space wrap size={8}>
                <Tag className={styles.queueTag}>{(item.queueStatus || "queue active").replaceAll("_", " ")}</Tag>
                <Tag className={getUrgencyClassName(item.urgencyLevel || "Routine", styles)}>Triage: {item.urgencyLevel || "Routine"}</Tag>
            </Space>
        </div>
        <Typography.Paragraph className={styles.inboxSummary}>{sanitizeClinicalCopy(item.subjectiveSummary) || item.chiefComplaint || "Resume this consultation note."}</Typography.Paragraph>
        <div className={styles.inboxMeta}>
            <span>Note: {item.encounterNoteStatus}</span>
            <span>{item.lastTranscriptAt || item.finalizedAt ? "Updated today" : "No recent update"}</span>
        </div>
        <Link href={item.consultationPath}>
            <Button type="primary" className={styles.primaryAction} block>
                {item.encounterNoteStatus === "draft" ? "Resume Draft" : "Open Note"}
            </Button>
        </Link>
    </Card>
);

export const ClinicianConsultationPage = ({ visitId, queueTicketId }: IClinicianConsultationPageProps): React.JSX.Element => {
    const { styles } = useClinicianConsultationStyles();
    const router = useRouter();
    const state = useClinicianConsultationState();
    const actions = useClinicianConsultationActions();
    const [activeTab, setActiveTab] = useState("subjective");
    const [noteDraft, setNoteDraft] = useState<INoteDraftState>(createNoteDraft);
    const [vitalsDraft, setVitalsDraft] = useState<IVitalsDraftState>(createVitalsDraft);
    const [transcriptText, setTranscriptText] = useState("");
    const hydratedNoteSignatureRef = useRef<string>("");
    const workspace = state.workspace;
    const review = state.review;
    const inbox = state.inbox?.items ?? [];

    useEffect(() => {
        if (visitId) {
            void actions.loadWorkspace({ visitId, queueTicketId });
            return;
        }

        void actions.loadInbox();
    }, [actions, queueTicketId, visitId]);

    useEffect(() => {
        if (!workspace) {
            return;
        }

        const shouldPreferHandoffSummary = Boolean(
            review?.clinicianSummary &&
            workspace.encounterNote.subjective.trim() === workspace.encounterNote.intakeSubjective.trim()
        );
        const nextSubjective = sanitizeClinicalCopy(
            shouldPreferHandoffSummary
                ? review?.clinicianSummary
                : workspace.encounterNote.subjective || workspace.encounterNote.intakeSubjective
        );
        const noteSignature = JSON.stringify({
            id: workspace.encounterNote.id,
            intakeSubjective: workspace.encounterNote.intakeSubjective,
            subjective: workspace.encounterNote.subjective,
            objective: workspace.encounterNote.objective,
            assessment: workspace.encounterNote.assessment,
            plan: workspace.encounterNote.plan,
            reviewSummary: shouldPreferHandoffSummary ? review?.clinicianSummary : "",
        });

        if (hydratedNoteSignatureRef.current !== noteSignature) {
            hydratedNoteSignatureRef.current = noteSignature;
            setNoteDraft({
                subjective: nextSubjective,
                objective: workspace.encounterNote.objective || "",
                assessment: workspace.encounterNote.assessment || "",
                plan: workspace.encounterNote.plan || "",
            });
        }
        setVitalsDraft({
            bloodPressureSystolic: workspace.latestVitals?.bloodPressureSystolic?.toString() ?? "",
            bloodPressureDiastolic: workspace.latestVitals?.bloodPressureDiastolic?.toString() ?? "",
            heartRate: workspace.latestVitals?.heartRate?.toString() ?? "",
            respiratoryRate: workspace.latestVitals?.respiratoryRate?.toString() ?? "",
            temperatureCelsius: workspace.latestVitals?.temperatureCelsius?.toString() ?? "",
            oxygenSaturation: workspace.latestVitals?.oxygenSaturation?.toString() ?? "",
            bloodGlucose: workspace.latestVitals?.bloodGlucose?.toString() ?? "",
            weightKg: workspace.latestVitals?.weightKg?.toString() ?? "",
        });
    }, [review?.clinicianSummary, workspace]);
    const patientName = review?.patientName ?? workspace?.patientContext.patientName ?? "Consultation";
    const queueStatus = review?.queueStatus ?? (workspace?.patientContext.queueStatus as TQueueStatus | undefined);
    const urgencyLevel = (review?.urgencyLevel ?? workspace?.patientContext.urgencyLevel ?? "Priority") as TUrgencyLevel;
    const isFinalized = (workspace?.encounterNote.status ?? "draft") === "finalized";
    const canCompleteVisit = isFinalized && Boolean(review?.queueTicketId) && review?.queueStatus === "in_consultation";
    const workflowSteps = useMemo<Array<{ title: string; content: string; status: "wait" | "process" | "finish" }>>(() => {
        const steps = [
            {
                title: "Capture Context",
                content: workspace?.transcripts.length ? "Transcript attached" : "Attach transcript or typed notes",
                done: Boolean(workspace?.transcripts.length),
            },
            {
                title: "Record Objective",
                content: workspace?.latestVitals || noteDraft.objective.trim() ? "Vitals or findings saved" : "Save vitals and exam findings",
                done: Boolean(workspace?.latestVitals || noteDraft.objective.trim()),
            },
            {
                title: "Draft A/P",
                content: noteDraft.assessment.trim() && noteDraft.plan.trim() ? "Review and refine" : "Generate A/P draft",
                done: Boolean(noteDraft.assessment.trim() && noteDraft.plan.trim()),
            },
            {
                title: "Finalize Note",
                content: isFinalized ? "Note locked" : "Finalize when SOAP is complete",
                done: isFinalized,
            },
        ];

        const currentIndex = steps.findIndex((item) => !item.done);
        return steps.map((item, index) => ({
            title: item.title,
            content: item.content,
            status: item.done ? "finish" : currentIndex === -1 ? "wait" : currentIndex === index ? "process" : "wait",
        }));
    }, [isFinalized, noteDraft.assessment, noteDraft.objective, noteDraft.plan, workspace?.latestVitals, workspace?.transcripts.length]);

    const objectiveVitalCards = [
        {
            key: "bloodPressure",
            label: "Blood pressure",
            unit: "mmHg",
            content: (
                <div className={styles.bpGrid}>
                    <Input value={vitalsDraft.bloodPressureSystolic} onChange={(event) => setVitalsDraft((current) => ({ ...current, bloodPressureSystolic: event.target.value }))} placeholder="Systolic" disabled={isFinalized} />
                    <Input value={vitalsDraft.bloodPressureDiastolic} onChange={(event) => setVitalsDraft((current) => ({ ...current, bloodPressureDiastolic: event.target.value }))} placeholder="Diastolic" disabled={isFinalized} />
                </div>
            ),
        },
        {
            key: "heartRate",
            label: "Heart rate",
            unit: "bpm",
            content: <Input value={vitalsDraft.heartRate} onChange={(event) => setVitalsDraft((current) => ({ ...current, heartRate: event.target.value }))} placeholder="Heart rate" disabled={isFinalized} />,
        },
        {
            key: "respiratoryRate",
            label: "Respiratory rate",
            unit: "breaths/min",
            content: <Input value={vitalsDraft.respiratoryRate} onChange={(event) => setVitalsDraft((current) => ({ ...current, respiratoryRate: event.target.value }))} placeholder="Respiratory rate" disabled={isFinalized} />,
        },
        {
            key: "temperature",
            label: "Temperature",
            unit: "deg C",
            content: <Input value={vitalsDraft.temperatureCelsius} onChange={(event) => setVitalsDraft((current) => ({ ...current, temperatureCelsius: event.target.value }))} placeholder="Temperature" disabled={isFinalized} />,
        },
        {
            key: "spo2",
            label: "Oxygen saturation",
            unit: "%",
            content: <Input value={vitalsDraft.oxygenSaturation} onChange={(event) => setVitalsDraft((current) => ({ ...current, oxygenSaturation: event.target.value }))} placeholder="SpO2" disabled={isFinalized} />,
        },
        {
            key: "glucose",
            label: "Blood glucose",
            unit: "mmol/L",
            content: <Input value={vitalsDraft.bloodGlucose} onChange={(event) => setVitalsDraft((current) => ({ ...current, bloodGlucose: event.target.value }))} placeholder="Blood glucose" disabled={isFinalized} />,
        },
        {
            key: "weight",
            label: "Weight",
            unit: "kg",
            content: <Input value={vitalsDraft.weightKg} onChange={(event) => setVitalsDraft((current) => ({ ...current, weightKg: event.target.value }))} placeholder="Weight" disabled={isFinalized} />,
        },
    ];

    const saveNoteDraft = async (): Promise<void> => {
        if (!workspace) {
            return;
        }

        await actions.saveEncounterNoteDraft({ visitId: workspace.visitId, ...noteDraft });
    };

    const finalizeNote = async (): Promise<void> => {
        if (!workspace) {
            return;
        }

        const saved = await actions.saveEncounterNoteDraft({ visitId: workspace.visitId, ...noteDraft });
        if (saved) {
            await actions.finalizeEncounterNote(workspace.visitId);
        }
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

        const attached = await actions.attachTranscript({ visitId: workspace.visitId, inputMode: "typed", rawTranscriptText: transcriptText.trim() });
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
            subjective: sanitizeClinicalCopy(state.subjectiveDraft?.subjective ?? current.subjective),
        }));
    };

    const applyGeneratedAssessmentPlan = (): void => {
        if (!state.assessmentPlanDraft) {
            return;
        }

        setNoteDraft((current) => ({
            ...current,
            assessment: sanitizeClinicalCopy(state.assessmentPlanDraft?.assessment ?? current.assessment),
            plan: sanitizeClinicalCopy(state.assessmentPlanDraft?.plan ?? current.plan),
        }));
        setActiveTab("assessment");
    };

    const noteTabs = [
        {
            key: "subjective",
            label: "Subjective",
            children: (
                <div className={styles.editorPanel}>
                    <div className={styles.editorHeader}>
                        <div>
                            <Typography.Title level={3} className={styles.editorTitle}>Subjective</Typography.Title>
                            <Typography.Text className={styles.editorHint}>Starts from intake, then gets refined with consultation context.</Typography.Text>
                        </div>
                        <Button icon={<RobotOutlined />} className={styles.signalAction} loading={state.isGeneratingSubjective} disabled={isFinalized} onClick={() => workspace && void actions.generateSubjectiveDraft(workspace.visitId)}>Refresh With AI</Button>
                    </div>
                    {state.subjectiveDraft?.subjective ? (
                        <div className={styles.draftPreview}>
                            <Typography.Paragraph className={styles.bodyText}>{sanitizeClinicalCopy(state.subjectiveDraft.summary || state.subjectiveDraft.subjective)}</Typography.Paragraph>
                            <Button type="primary" className={styles.primaryAction} disabled={isFinalized} onClick={applyGeneratedSubjective}>Apply Suggested Subjective</Button>
                        </div>
                    ) : null}
                    <TextArea value={noteDraft.subjective} onChange={(event) => setNoteDraft((current) => ({ ...current, subjective: event.target.value }))} className={styles.editorArea} disabled={isFinalized} />
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
                            <Typography.Title level={3} className={styles.editorTitle}>Objective</Typography.Title>
                            <Typography.Text className={styles.editorHint}>Structured vitals first, then free-text findings.</Typography.Text>
                        </div>
                        <Button icon={<HeartOutlined />} className={styles.signalAction} loading={state.isSavingVitals} disabled={isFinalized} onClick={() => void saveVitals()}>Save Vitals</Button>
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
                    <TextArea value={noteDraft.objective} onChange={(event) => setNoteDraft((current) => ({ ...current, objective: event.target.value }))} className={styles.editorArea} disabled={isFinalized} placeholder="Document examination findings, focused observations, and any additional objective notes." />
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
                            <Typography.Title level={3} className={styles.editorTitle}>Assessment</Typography.Title>
                            <Typography.Text className={styles.editorHint}>Draft from consultation notes, vitals, and pathway context, then refine clinically.</Typography.Text>
                        </div>
                        <Button icon={<RobotOutlined />} className={styles.signalAction} loading={state.isGeneratingAssessmentPlan} disabled={isFinalized} onClick={() => workspace && void actions.generateAssessmentPlanDraft(workspace.visitId)}>Generate A/P Draft</Button>
                    </div>
                    {state.assessmentPlanDraft?.assessment || state.assessmentPlanDraft?.plan ? (
                        <div className={styles.draftPreview}>
                            <Typography.Paragraph className={styles.bodyText}>{sanitizeClinicalCopy(state.assessmentPlanDraft.summary || "Assessment and plan draft ready for review.")}</Typography.Paragraph>
                            <Button type="primary" className={styles.primaryAction} disabled={isFinalized} onClick={applyGeneratedAssessmentPlan}>Apply Assessment & Plan</Button>
                        </div>
                    ) : null}
                    <TextArea value={noteDraft.assessment} onChange={(event) => setNoteDraft((current) => ({ ...current, assessment: event.target.value }))} className={styles.editorArea} disabled={isFinalized} />
                </div>
            ),
        },
        {
            key: "plan",
            label: "Plan",
            children: (
                <div className={styles.editorPanel}>
                    <Typography.Title level={3} className={styles.editorTitle}>Plan</Typography.Title>
                    <TextArea value={noteDraft.plan} onChange={(event) => setNoteDraft((current) => ({ ...current, plan: event.target.value }))} className={styles.editorArea} disabled={isFinalized} />
                </div>
            ),
        },
    ];

    return (
        <section className={styles.page}>
            {state.errorMessage ? <Alert type="error" showIcon message={state.errorMessage} action={<Button size="small" onClick={actions.clearMessages}>Dismiss</Button>} /> : null}
            {state.successMessage ? <Alert type="success" showIcon message={state.successMessage} action={<Button size="small" onClick={actions.clearMessages}>Close</Button>} /> : null}

            {!visitId ? (
                state.isLoadingWorkspace && !state.inbox ? (
                    <Card className={styles.panelCard}><Skeleton active paragraph={{ rows: 8 }} /></Card>
                ) : inbox.length === 0 ? (
                    <Card className={styles.emptyStateCard}><Empty description="No consultations assigned to you yet today. Start from triage review to open a visit here." /></Card>
                ) : (
                    <section className={styles.inboxSection}>
                        <Typography.Title level={3} className={styles.pageSectionTitle}>Today's consultations</Typography.Title>
                        <div className={styles.inboxGrid}>{inbox.map((item) => <InboxCard key={item.consultationPath} item={item} styles={styles} />)}</div>
                    </section>
                )
            ) : state.isLoadingWorkspace && !workspace ? (
                <Card className={styles.panelCard}><Skeleton active paragraph={{ rows: 12 }} /></Card>
            ) : !workspace ? (
                <Card className={styles.emptyStateCard}><Empty description="Consultation workspace could not be loaded for this visit." /></Card>
            ) : (
                <>
                    <header className={styles.topBar}>
                        <div className={styles.topBarLeft}>
                            <div>
                                <Typography.Title level={2} className={styles.pageTitle}>Consultation: {patientName}</Typography.Title>
                                <Typography.Text className={styles.pageMeta}>{formatVisitStartedAt(workspace.patientContext.visitDate)}</Typography.Text>
                            </div>
                        </div>
                        <div className={styles.topActions}>
                            <Button icon={<SaveOutlined />} className={styles.secondaryAction} loading={state.isSavingDraft} disabled={isFinalized} onClick={() => void saveNoteDraft()}>Save Draft</Button>
                            <Button type="primary" icon={<FileDoneOutlined />} className={styles.primaryAction} loading={state.isFinalizing} disabled={isFinalized} onClick={() => void finalizeNote()}>{isFinalized ? "Note Finalized" : "Finalize Note"}</Button>
                            {canCompleteVisit ? <Button icon={<CheckCircleOutlined />} className={styles.secondaryAction} loading={state.isCompletingVisit} onClick={() => void actions.completeVisit(review!.queueTicketId).then((result) => result && router.push("/clinician/consultation"))}>Complete Visit</Button> : null}
                        </div>
                    </header>

                    <div className={styles.shellGrid}>
                        <aside className={styles.sideRail}>
                            <Card className={styles.panelCard}>
                                <Typography.Title level={5} className={styles.sectionHeading}>Patient Context</Typography.Title>
                                <div className={styles.patientSummaryBox}>
                                    <Typography.Paragraph className={styles.patientSummaryLead}>{workspace.patientContext.patientName}</Typography.Paragraph>
                                    <Typography.Paragraph className={styles.patientSummaryText}>{sanitizeClinicalCopy(workspace.patientContext.subjectiveSummary) || "Intake handoff is not available yet for this visit."}</Typography.Paragraph>
                                </div>
                                <div className={styles.tagRow}>
                                    <Tag className={styles.queueTag}>{getStatusLabel(queueStatus)}</Tag>
                                    <Tag className={getUrgencyClassName(urgencyLevel, styles)}>Triage: {urgencyLevel}</Tag>
                                </div>
                                <div className={styles.summaryGlow}>
                                    <Typography.Text strong>AI handoff summary</Typography.Text>
                                    <Typography.Paragraph className={styles.bodyText} style={{ marginTop: 8 }}>{sanitizeClinicalCopy(review?.clinicianSummary ?? workspace.patientContext.subjectiveSummary) || "A clinician-facing summary is not available yet."}</Typography.Paragraph>
                                </div>
                            </Card>

                            <Card className={styles.panelCard}>
                                <div className={styles.cardTitleRow}>
                                    <Typography.Title level={5} className={styles.sectionHeading} style={{ marginBottom: 0 }}>Latest Vitals</Typography.Title>
                                    <Button size="small" className={styles.secondaryAction} onClick={() => setActiveTab("objective")}>Update</Button>
                                </div>
                                <div className={styles.metricStack}>
                                    <div className={`${styles.metricRow} ${isConcerning("BP", workspace.latestVitals) ? styles.metricRowAlert : ""}`}><span className={styles.metricLabel}>BP</span><span className={styles.metricValue}>{workspace.latestVitals?.bloodPressureSystolic && workspace.latestVitals?.bloodPressureDiastolic ? `${workspace.latestVitals.bloodPressureSystolic}/${workspace.latestVitals.bloodPressureDiastolic}` : "Not recorded"}</span></div>
                                    <div className={`${styles.metricRow} ${isConcerning("HR", workspace.latestVitals) ? styles.metricRowAlert : ""}`}><span className={styles.metricLabel}>HR</span><span className={styles.metricValue}>{workspace.latestVitals?.heartRate ? `${workspace.latestVitals.heartRate} bpm` : "Not recorded"}</span></div>
                                    <div className={`${styles.metricRow} ${isConcerning("Temp", workspace.latestVitals) ? styles.metricRowAlert : ""}`}><span className={styles.metricLabel}>Temp</span><span className={styles.metricValue}>{workspace.latestVitals?.temperatureCelsius ? `${workspace.latestVitals.temperatureCelsius} deg C` : "Not recorded"}</span></div>
                                    <div className={`${styles.metricRow} ${isConcerning("SpO2", workspace.latestVitals) ? styles.metricRowAlert : ""}`}><span className={styles.metricLabel}>SpO2</span><span className={styles.metricValue}>{workspace.latestVitals?.oxygenSaturation ? `${workspace.latestVitals.oxygenSaturation}%` : "Not recorded"}</span></div>
                                    <div className={`${styles.metricRow} ${isConcerning("RR", workspace.latestVitals) ? styles.metricRowAlert : ""}`}><span className={styles.metricLabel}>RR</span><span className={styles.metricValue}>{workspace.latestVitals?.respiratoryRate ? `${workspace.latestVitals.respiratoryRate}/min` : "Not recorded"}</span></div>
                                </div>
                            </Card>

                            <Card className={styles.panelCard}>
                                <Typography.Title level={5} className={styles.sectionHeading}>Consultation Capture</Typography.Title>
                                <TextArea value={transcriptText} onChange={(event) => setTranscriptText(event.target.value)} className={styles.transcriptArea} disabled={isFinalized} placeholder="Paste or type the consultation transcript here." />
                                <Space wrap style={{ marginTop: 12 }}>
                                    <Button icon={state.isAttachingTranscript ? <LoadingOutlined /> : <AudioOutlined />} className={styles.signalAction} loading={state.isAttachingTranscript} disabled={isFinalized} onClick={() => void attachTranscript()}>Attach Transcript</Button>
                                    <span className={styles.transcriptMeta}>{workspace.transcripts.length > 0 ? `${workspace.transcripts.length} transcript entries attached` : "No transcript attached yet"}</span>
                                </Space>
                            </Card>
                        </aside>

                        <div className={styles.mainColumn}>
                            <Card className={styles.panelCard}>
                                <Typography.Title level={5} className={styles.sectionHeading}>Visit Workflow</Typography.Title>
                                <Steps size="small" responsive items={workflowSteps} className={styles.workflowSteps} />
                            </Card>
                            <Card className={styles.workspaceCard}>
                                <div className={styles.statusStrip}>
                                    <span className={styles.successPill}>{isFinalized ? "Finalized" : "Draft in progress"}</span>
                                    <Typography.Text className={styles.helperText}>{review?.chiefComplaint || workspace.patientContext.chiefComplaint || workspace.visitStatus}</Typography.Text>
                                </div>
                                <Tabs activeKey={activeTab} onChange={setActiveTab} items={noteTabs} />
                                <Typography.Text className={styles.helperText}>{isFinalized ? "Finalized notes are locked for this visit." : "Draft saves persist and can be reopened from the consultation workspace."}</Typography.Text>
                            </Card>
                        </div>
                    </div>
                </>
            )}
        </section>
    );
};
