"use client";

import { AudioOutlined, CheckCircleOutlined, FileDoneOutlined, HeartOutlined, LoadingOutlined, RobotOutlined, SaveOutlined, StopOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Empty, Input, Skeleton, Space, Steps, Tabs, Tag, Typography } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { getSupportedRecordingMimeType } from "@/lib/client/audioRecording";
import { useClinicianConsultationActions, useClinicianConsultationState } from "@/providers/clinician-consultation";
import type { IConsultationInboxItem, IConsultationWorkspace } from "@/services/consultation/types";
import type { TQueueStatus, TUrgencyLevel } from "@/services/queue-operations/types";
import { useClinicianConsultationStyles } from "./consultationStyle";

const { TextArea } = Input;

interface IClinicianConsultationPageProps {
    visitId?: number;
    queueTicketId?: number;
    patientUserId?: number;
}

interface INoteDraftState {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    clinicianTimelineSummary: string;
    patientTimelineSummary: string;
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
    clinicianTimelineSummary: "",
    patientTimelineSummary: "",
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
    const rendered = rawSections
        .map((section) => {
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
        })
        .filter(Boolean);

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
    return parsed && !Number.isNaN(parsed.getTime()) ? `Started ${parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Consultation in progress";
};

const normalizeSentence = (value?: string | null): string => {
    if (!value?.trim()) {
        return "";
    }

    const collapsed = value.replace(/\s+/g, " ").trim();
    if (!collapsed) {
        return "";
    }

    return /[.!?]$/.test(collapsed) ? collapsed : `${collapsed}.`;
};

const toSummarySentence = (value?: string | null): string => {
    const cleaned = sanitizeClinicalCopy(value);
    if (!cleaned) {
        return "";
    }

    const flattened = cleaned
        .split(/\r?\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .join(" ");

    return normalizeSentence(flattened);
};

const buildClinicianTimelineSummary = (workspace: IConsultationWorkspace, clinicianSummary?: string | null): string => {
    const encounterSummary = normalizeSentence(workspace.encounterNote.clinicianTimelineSummary);
    if (encounterSummary) {
        return encounterSummary;
    }

    return (
        toSummarySentence(clinicianSummary) ||
        toSummarySentence(workspace.patientContext.subjectiveSummary) ||
        normalizeSentence(workspace.patientContext.chiefComplaint) ||
        "Consultation completed. Add a clinician-facing summary before finalizing."
    );
};

const buildPatientTimelineSummary = (workspace: IConsultationWorkspace): string => {
    const encounterSummary = normalizeSentence(workspace.encounterNote.patientTimelineSummary);
    if (encounterSummary) {
        return encounterSummary;
    }

    const chiefComplaint = workspace.patientContext.chiefComplaint.trim();
    const planSummary = normalizeSentence(workspace.encounterNote.plan);
    const assessmentSummary = normalizeSentence(workspace.encounterNote.assessment);

    if (chiefComplaint && planSummary) {
        return `Seen for ${chiefComplaint.toLowerCase()}. ${planSummary}`;
    }

    if (chiefComplaint && assessmentSummary) {
        return `Seen for ${chiefComplaint.toLowerCase()}. ${assessmentSummary}`;
    }

    return normalizeSentence(chiefComplaint) || "Add a plain-language patient summary before finalizing.";
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
            return Boolean(
                (vitals?.bloodPressureSystolic ?? 0) >= 140 ||
                (vitals?.bloodPressureSystolic ?? 999) < 90 ||
                (vitals?.bloodPressureDiastolic ?? 0) >= 90 ||
                (vitals?.bloodPressureDiastolic ?? 999) < 60
            );
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
    const [noteDraftState, setNoteDraftState] = useState<{ signature: string; values: INoteDraftState }>({
        signature: "",
        values: createNoteDraft(),
    });
    const [vitalsDraftState, setVitalsDraftState] = useState<{ signature: string; values: IVitalsDraftState }>({
        signature: "",
        values: createVitalsDraft(),
    });
    const [transcriptText, setTranscriptText] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const [recordingError, setRecordingError] = useState<string | null>(null);
    const [timelineValidationMessage, setTimelineValidationMessage] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingTimerRef = useRef<number | null>(null);
    const workspace = state.workspace;
    const review = state.review;
    const inbox = state.inbox?.items ?? [];
    const activeVisitId = visitId ?? workspace?.visitId;
    const activeQueueTicketId = queueTicketId ?? review?.queueTicketId ?? workspace?.queueTicketId ?? undefined;

    useEffect(() => {
        if (activeVisitId) {
            void actions.loadWorkspace({ visitId: activeVisitId, queueTicketId: activeQueueTicketId });
            return;
        }

        void actions.loadInbox();
    }, [actions, activeQueueTicketId, activeVisitId]);

    useEffect(() => {
        return () => {
            if (recordingTimerRef.current !== null) {
                window.clearInterval(recordingTimerRef.current);
            }

            mediaRecorderRef.current?.stream?.getTracks().forEach((track) => track.stop());
            mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        };
    }, []);

    const hydratedNote = useMemo<INoteDraftState>(() => {
        if (!workspace) {
            return createNoteDraft();
        }

        const shouldPreferHandoffSummary = Boolean(review?.clinicianSummary && workspace.encounterNote.subjective.trim() === workspace.encounterNote.intakeSubjective.trim());

        return {
            subjective: sanitizeClinicalCopy(shouldPreferHandoffSummary ? review?.clinicianSummary : workspace.encounterNote.subjective || workspace.encounterNote.intakeSubjective),
            objective: workspace.encounterNote.objective || "",
            assessment: workspace.encounterNote.assessment || "",
            plan: workspace.encounterNote.plan || "",
            clinicianTimelineSummary: buildClinicianTimelineSummary(workspace, review?.clinicianSummary),
            patientTimelineSummary: buildPatientTimelineSummary(workspace),
        };
    }, [review?.clinicianSummary, workspace]);

    const noteSignature = useMemo(
        () =>
            JSON.stringify({
                id: workspace?.encounterNote.id ?? 0,
                intakeSubjective: workspace?.encounterNote.intakeSubjective ?? "",
                subjective: workspace?.encounterNote.subjective ?? "",
                objective: workspace?.encounterNote.objective ?? "",
                assessment: workspace?.encounterNote.assessment ?? "",
                plan: workspace?.encounterNote.plan ?? "",
                clinicianTimelineSummary: workspace?.encounterNote.clinicianTimelineSummary ?? "",
                patientTimelineSummary: workspace?.encounterNote.patientTimelineSummary ?? "",
                reviewSummary: review?.clinicianSummary ?? "",
                chiefComplaint: workspace?.patientContext.chiefComplaint ?? "",
                patientContextSummary: workspace?.patientContext.subjectiveSummary ?? "",
            }),
        [review?.clinicianSummary, workspace?.encounterNote, workspace?.patientContext]
    );

    const hydratedVitals = useMemo<IVitalsDraftState>(
        () => ({
            bloodPressureSystolic: workspace?.latestVitals?.bloodPressureSystolic?.toString() ?? "",
            bloodPressureDiastolic: workspace?.latestVitals?.bloodPressureDiastolic?.toString() ?? "",
            heartRate: workspace?.latestVitals?.heartRate?.toString() ?? "",
            respiratoryRate: workspace?.latestVitals?.respiratoryRate?.toString() ?? "",
            temperatureCelsius: workspace?.latestVitals?.temperatureCelsius?.toString() ?? "",
            oxygenSaturation: workspace?.latestVitals?.oxygenSaturation?.toString() ?? "",
            bloodGlucose: workspace?.latestVitals?.bloodGlucose?.toString() ?? "",
            weightKg: workspace?.latestVitals?.weightKg?.toString() ?? "",
        }),
        [workspace?.latestVitals]
    );

    const vitalsSignature = useMemo(
        () =>
            JSON.stringify({
                id: workspace?.latestVitals?.id ?? 0,
                bloodPressureSystolic: workspace?.latestVitals?.bloodPressureSystolic ?? null,
                bloodPressureDiastolic: workspace?.latestVitals?.bloodPressureDiastolic ?? null,
                heartRate: workspace?.latestVitals?.heartRate ?? null,
                respiratoryRate: workspace?.latestVitals?.respiratoryRate ?? null,
                temperatureCelsius: workspace?.latestVitals?.temperatureCelsius ?? null,
                oxygenSaturation: workspace?.latestVitals?.oxygenSaturation ?? null,
                bloodGlucose: workspace?.latestVitals?.bloodGlucose ?? null,
                weightKg: workspace?.latestVitals?.weightKg ?? null,
            }),
        [workspace?.latestVitals]
    );

    const noteDraft = noteDraftState.signature === noteSignature ? noteDraftState.values : hydratedNote;
    const vitalsDraft = vitalsDraftState.signature === vitalsSignature ? vitalsDraftState.values : hydratedVitals;
    const missingTimelineSummaries = useMemo<string[]>(() => {
        const missing: string[] = [];
        if (!noteDraft.clinicianTimelineSummary.trim()) {
            missing.push("clinician-facing summary");
        }

        if (!noteDraft.patientTimelineSummary.trim()) {
            missing.push("patient-friendly summary");
        }

        return missing;
    }, [noteDraft.clinicianTimelineSummary, noteDraft.patientTimelineSummary]);
    const visibleTimelineValidationMessage = missingTimelineSummaries.length > 0 ? timelineValidationMessage : null;

    const updateNoteDraft = (updater: INoteDraftState | ((current: INoteDraftState) => INoteDraftState)): void => {
        setNoteDraftState((current) => {
            const base = current.signature === noteSignature ? current.values : hydratedNote;
            const nextValues = typeof updater === "function" ? updater(base) : updater;

            return {
                signature: noteSignature,
                values: nextValues,
            };
        });
    };

    const updateVitalsDraft = (updater: IVitalsDraftState | ((current: IVitalsDraftState) => IVitalsDraftState)): void => {
        setVitalsDraftState((current) => {
            const base = current.signature === vitalsSignature ? current.values : hydratedVitals;
            const nextValues = typeof updater === "function" ? updater(base) : updater;

            return {
                signature: vitalsSignature,
                values: nextValues,
            };
        });
    };
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
                content: isFinalized ? "Note locked" : missingTimelineSummaries.length === 0 ? "Finalize when SOAP is complete" : "Add both timeline summaries before finalizing",
                done: isFinalized,
            },
        ];

        const currentIndex = steps.findIndex((item) => !item.done);
        return steps.map((item, index) => ({
            title: item.title,
            content: item.content,
            status: item.done ? "finish" : currentIndex === -1 ? "wait" : currentIndex === index ? "process" : "wait",
        }));
    }, [isFinalized, missingTimelineSummaries.length, noteDraft.assessment, noteDraft.objective, noteDraft.plan, workspace?.latestVitals, workspace?.transcripts.length]);

    const objectiveVitalCards = [
        {
            key: "bloodPressure",
            label: "Blood pressure",
            unit: "mmHg",
            content: (
                <div className={styles.bpGrid}>
                    <Input
                        value={vitalsDraft.bloodPressureSystolic}
                        onChange={(event) => updateVitalsDraft((current) => ({ ...current, bloodPressureSystolic: event.target.value }))}
                        placeholder="Systolic"
                        disabled={isFinalized}
                    />
                    <Input
                        value={vitalsDraft.bloodPressureDiastolic}
                        onChange={(event) => updateVitalsDraft((current) => ({ ...current, bloodPressureDiastolic: event.target.value }))}
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
                    onChange={(event) => updateVitalsDraft((current) => ({ ...current, heartRate: event.target.value }))}
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
                    onChange={(event) => updateVitalsDraft((current) => ({ ...current, respiratoryRate: event.target.value }))}
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
                    onChange={(event) => updateVitalsDraft((current) => ({ ...current, temperatureCelsius: event.target.value }))}
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
                    onChange={(event) => updateVitalsDraft((current) => ({ ...current, oxygenSaturation: event.target.value }))}
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
                    onChange={(event) => updateVitalsDraft((current) => ({ ...current, bloodGlucose: event.target.value }))}
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
                <Input value={vitalsDraft.weightKg} onChange={(event) => updateVitalsDraft((current) => ({ ...current, weightKg: event.target.value }))} placeholder="Weight" disabled={isFinalized} />
            ),
        },
    ];

    const saveNoteDraft = async (): Promise<void> => {
        if (!workspace) {
            return;
        }

        setTimelineValidationMessage(null);
        await actions.saveEncounterNoteDraft({ visitId: workspace.visitId, ...noteDraft });
    };

    const finalizeNote = async (): Promise<void> => {
        if (!workspace) {
            return;
        }

        if (missingTimelineSummaries.length > 0) {
            setTimelineValidationMessage(`Add the ${missingTimelineSummaries.join(" and ")} before finalizing this encounter note.`);
            setActiveTab("timeline");
            return;
        }

        const saved = await actions.saveEncounterNoteDraft({ visitId: workspace.visitId, ...noteDraft });
        if (saved) {
            setTimelineValidationMessage(null);
            await actions.finalizeEncounterNote({
                visitId: workspace.visitId,
                clinicianTimelineSummary: noteDraft.clinicianTimelineSummary.trim(),
                patientTimelineSummary: noteDraft.patientTimelineSummary.trim(),
            });
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

    const startRecording = async (): Promise<void> => {
        if (!workspace) {
            return;
        }

        if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
            setRecordingError("Live transcription is not supported in this browser. You can still paste consultation notes manually.");
            return;
        }

        try {
            setRecordingError(null);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mimeType = getSupportedRecordingMimeType();
            const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

            mediaStreamRef.current = stream;
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];
            setRecordingSeconds(0);
            setIsRecording(true);
            recordingTimerRef.current = window.setInterval(() => {
                setRecordingSeconds((current) => current + 1);
            }, 1000);

            recorder.ondataavailable = (event: BlobEvent) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            recorder.onerror = () => {
                setRecordingError("The browser could not continue recording consultation audio.");
            };

            recorder.onstop = async () => {
                if (recordingTimerRef.current !== null) {
                    window.clearInterval(recordingTimerRef.current);
                    recordingTimerRef.current = null;
                }

                setIsRecording(false);
                const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || mimeType || "audio/webm" });
                audioChunksRef.current = [];
                stream.getTracks().forEach((track) => track.stop());
                mediaRecorderRef.current = null;
                mediaStreamRef.current = null;

                if (audioBlob.size === 0) {
                    setRecordingError("No consultation audio was captured. Please try again.");
                    return;
                }

                const transcript = await actions.transcribeAudio({
                    visitId: workspace.visitId,
                    audioBlob,
                    mimeType: audioBlob.type,
                });
                if (transcript?.rawTranscriptText) {
                    setTranscriptText(transcript.rawTranscriptText);
                }
            };

            recorder.start();
        } catch (error) {
            setIsRecording(false);
            setRecordingError(error instanceof Error ? error.message : "Microphone access was denied.");
        }
    };

    const stopRecording = (): void => {
        if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
        }
    };

    const applyGeneratedSubjective = (): void => {
        if (!state.subjectiveDraft?.subjective) {
            return;
        }

        updateNoteDraft((current) => ({
            ...current,
            subjective: sanitizeClinicalCopy(state.subjectiveDraft?.subjective ?? current.subjective),
        }));
    };

    const applyGeneratedAssessmentPlan = (): void => {
        if (!state.assessmentPlanDraft) {
            return;
        }

        updateNoteDraft((current) => ({
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
                            <Typography.Title level={3} className={styles.editorTitle}>
                                Subjective
                            </Typography.Title>
                            <Typography.Text className={styles.editorHint}>Starts from intake, then gets refined with consultation context.</Typography.Text>
                        </div>
                        <Button
                            icon={<RobotOutlined />}
                            className={styles.signalAction}
                            loading={state.isGeneratingSubjective}
                            disabled={isFinalized}
                            onClick={() => workspace && void actions.generateSubjectiveDraft(workspace.visitId)}
                        >
                            Refresh With AI
                        </Button>
                    </div>
                    {state.subjectiveDraft?.subjective ? (
                        <div className={styles.draftPreview}>
                            <Typography.Paragraph className={styles.bodyText}>{sanitizeClinicalCopy(state.subjectiveDraft.summary || state.subjectiveDraft.subjective)}</Typography.Paragraph>
                            <Button type="primary" className={styles.primaryAction} disabled={isFinalized} onClick={applyGeneratedSubjective}>
                                Apply Suggested Subjective
                            </Button>
                        </div>
                    ) : null}
                    <TextArea
                        value={noteDraft.subjective}
                        onChange={(event) => updateNoteDraft((current) => ({ ...current, subjective: event.target.value }))}
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
                        <Button icon={<HeartOutlined />} className={styles.signalAction} loading={state.isSavingVitals} disabled={isFinalized} onClick={() => void saveVitals()}>
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
                        onChange={(event) => updateNoteDraft((current) => ({ ...current, objective: event.target.value }))}
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
                        <Button
                            icon={<RobotOutlined />}
                            className={styles.signalAction}
                            loading={state.isGeneratingAssessmentPlan}
                            disabled={isFinalized}
                            onClick={() => workspace && void actions.generateAssessmentPlanDraft(workspace.visitId)}
                        >
                            Generate A/P Draft
                        </Button>
                    </div>
                    {state.assessmentPlanDraft?.assessment || state.assessmentPlanDraft?.plan ? (
                        <div className={styles.draftPreview}>
                            <Typography.Paragraph className={styles.bodyText}>
                                {sanitizeClinicalCopy(state.assessmentPlanDraft.summary || "Assessment and plan draft ready for review.")}
                            </Typography.Paragraph>
                            <Button type="primary" className={styles.primaryAction} disabled={isFinalized} onClick={applyGeneratedAssessmentPlan}>
                                Apply Assessment & Plan
                            </Button>
                        </div>
                    ) : null}
                    <TextArea
                        value={noteDraft.assessment}
                        onChange={(event) => updateNoteDraft((current) => ({ ...current, assessment: event.target.value }))}
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
                        onChange={(event) => updateNoteDraft((current) => ({ ...current, plan: event.target.value }))}
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
                    {visibleTimelineValidationMessage ? (
                        <Alert
                            type="warning"
                            showIcon
                            title={visibleTimelineValidationMessage}
                            action={
                                <Button size="small" onClick={() => setTimelineValidationMessage(null)}>
                                    Dismiss
                                </Button>
                            }
                        />
                    ) : null}
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
                                onChange={(event) => updateNoteDraft((current) => ({ ...current, clinicianTimelineSummary: event.target.value }))}
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
                                onChange={(event) => updateNoteDraft((current) => ({ ...current, patientTimelineSummary: event.target.value }))}
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

    const recordingDurationLabel = new Date(recordingSeconds * 1000).toISOString().slice(14, 19);

    return (
        <section className={styles.page}>
            {state.errorMessage ? (
                <Alert
                    type="error"
                    showIcon
                    title={state.errorMessage}
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
                    title={state.successMessage}
                    action={
                        <Button size="small" onClick={actions.clearMessages}>
                            Close
                        </Button>
                    }
                />
            ) : null}
            {recordingError ? (
                <Alert
                    type="warning"
                    showIcon
                    title={recordingError}
                    action={
                        <Button size="small" onClick={() => setRecordingError(null)}>
                            Dismiss
                        </Button>
                    }
                />
            ) : null}

            {!activeVisitId ? (
                state.isLoadingWorkspace && !state.inbox ? (
                    <Card className={styles.panelCard}>
                        <Skeleton active paragraph={{ rows: 8 }} />
                    </Card>
                ) : inbox.length === 0 ? (
                    <Card className={styles.emptyStateCard}>
                        <Empty description="No consultations assigned to you yet today. Start from triage review to open a visit here." />
                    </Card>
                ) : (
                    <section className={styles.inboxSection}>
                        <Typography.Title level={3} className={styles.pageSectionTitle}>
                            Today&apos;s consultations
                        </Typography.Title>
                        <div className={styles.inboxGrid}>
                            {inbox.map((item) => (
                                <InboxCard key={item.consultationPath} item={item} styles={styles} />
                            ))}
                        </div>
                    </section>
                )
            ) : state.isLoadingWorkspace && !workspace ? (
                <Card className={styles.panelCard}>
                    <Skeleton active paragraph={{ rows: 12 }} />
                </Card>
            ) : !workspace ? (
                <Card className={styles.emptyStateCard}>
                    <Empty description="Consultation workspace could not be loaded for this visit." />
                </Card>
            ) : (
                <>
                    <header className={styles.topBar}>
                        <div className={styles.topBarLeft}>
                            <div>
                                <Typography.Title level={2} className={styles.pageTitle}>
                                    Consultation: {patientName}
                                </Typography.Title>
                                <Typography.Text className={styles.pageMeta}>{formatVisitStartedAt(workspace.patientContext.visitDate)}</Typography.Text>
                            </div>
                        </div>
                        <div className={styles.topActions}>
                            <Button
                                icon={<SaveOutlined />}
                                className={styles.secondaryAction}
                                loading={state.isSavingDraft}
                                disabled={isFinalized}
                                onClick={() => void saveNoteDraft()}
                                data-testid="consultation-save-draft"
                            >
                                Save Draft
                            </Button>
                            <Button
                                type="primary"
                                icon={<FileDoneOutlined />}
                                className={styles.primaryAction}
                                loading={state.isFinalizing}
                                disabled={isFinalized}
                                onClick={() => void finalizeNote()}
                                data-testid="consultation-finalize-note"
                            >
                                {isFinalized ? "Note Finalized" : "Finalize Note"}
                            </Button>
                            {canCompleteVisit ? (
                                <Button
                                    icon={<CheckCircleOutlined />}
                                    className={styles.secondaryAction}
                                    loading={state.isCompletingVisit}
                                    onClick={() =>
                                        void actions.completeVisit(review!.queueTicketId).then((result) => {
                                            if (result) {
                                                actions.clearActiveConsultation();
                                                router.push("/clinician/consultation");
                                            }
                                        })
                                    }
                                >
                                    Complete Visit
                                </Button>
                            ) : null}
                        </div>
                    </header>

                    <div className={styles.shellGrid}>
                        <aside className={styles.sideRail}>
                            <Card className={styles.panelCard}>
                                <Typography.Title level={5} className={styles.sectionHeading}>
                                    Patient Context
                                </Typography.Title>
                                <div className={styles.patientSummaryBox}>
                                    <Typography.Paragraph className={styles.patientSummaryLead}>{workspace.patientContext.patientName}</Typography.Paragraph>
                                    <Typography.Paragraph className={styles.patientSummaryText}>
                                        {sanitizeClinicalCopy(workspace.patientContext.subjectiveSummary) || "Intake handoff is not available yet for this visit."}
                                    </Typography.Paragraph>
                                </div>
                                <div className={styles.tagRow}>
                                    <Tag className={styles.queueTag}>{getStatusLabel(queueStatus)}</Tag>
                                    <Tag className={getUrgencyClassName(urgencyLevel, styles)}>Triage: {urgencyLevel}</Tag>
                                </div>
                                <div className={styles.summaryGlow}>
                                    <Typography.Text strong>AI handoff summary</Typography.Text>
                                    <Typography.Paragraph className={styles.bodyText} style={{ marginTop: 8 }}>
                                        {sanitizeClinicalCopy(review?.clinicianSummary ?? workspace.patientContext.subjectiveSummary) || "A clinician-facing summary is not available yet."}
                                    </Typography.Paragraph>
                                </div>
                            </Card>

                            <Card className={styles.panelCard}>
                                <div className={styles.cardTitleRow}>
                                    <Typography.Title level={5} className={styles.sectionHeading} style={{ marginBottom: 0 }}>
                                        Latest Vitals
                                    </Typography.Title>
                                    <Button size="small" className={styles.secondaryAction} onClick={() => setActiveTab("objective")}>
                                        Update
                                    </Button>
                                </div>
                                <div className={styles.metricStack}>
                                    <div className={`${styles.metricRow} ${isConcerning("BP", workspace.latestVitals) ? styles.metricRowAlert : ""}`}>
                                        <span className={styles.metricLabel}>BP</span>
                                        <span className={styles.metricValue}>
                                            {workspace.latestVitals?.bloodPressureSystolic && workspace.latestVitals?.bloodPressureDiastolic
                                                ? `${workspace.latestVitals.bloodPressureSystolic}/${workspace.latestVitals.bloodPressureDiastolic}`
                                                : "Not recorded"}
                                        </span>
                                    </div>
                                    <div className={`${styles.metricRow} ${isConcerning("HR", workspace.latestVitals) ? styles.metricRowAlert : ""}`}>
                                        <span className={styles.metricLabel}>HR</span>
                                        <span className={styles.metricValue}>{workspace.latestVitals?.heartRate ? `${workspace.latestVitals.heartRate} bpm` : "Not recorded"}</span>
                                    </div>
                                    <div className={`${styles.metricRow} ${isConcerning("Temp", workspace.latestVitals) ? styles.metricRowAlert : ""}`}>
                                        <span className={styles.metricLabel}>Temp</span>
                                        <span className={styles.metricValue}>{workspace.latestVitals?.temperatureCelsius ? `${workspace.latestVitals.temperatureCelsius} deg C` : "Not recorded"}</span>
                                    </div>
                                    <div className={`${styles.metricRow} ${isConcerning("SpO2", workspace.latestVitals) ? styles.metricRowAlert : ""}`}>
                                        <span className={styles.metricLabel}>SpO2</span>
                                        <span className={styles.metricValue}>{workspace.latestVitals?.oxygenSaturation ? `${workspace.latestVitals.oxygenSaturation}%` : "Not recorded"}</span>
                                    </div>
                                    <div className={`${styles.metricRow} ${isConcerning("RR", workspace.latestVitals) ? styles.metricRowAlert : ""}`}>
                                        <span className={styles.metricLabel}>RR</span>
                                        <span className={styles.metricValue}>{workspace.latestVitals?.respiratoryRate ? `${workspace.latestVitals.respiratoryRate}/min` : "Not recorded"}</span>
                                    </div>
                                </div>
                            </Card>

                            <Card className={styles.panelCard}>
                                <Typography.Title level={5} className={styles.sectionHeading}>
                                    Consultation Capture
                                </Typography.Title>
                                <div className={styles.capturePanel}>
                                    <div className={styles.captureHeader}>
                                        <div>
                                            <Typography.Text strong>Live transcription</Typography.Text>
                                            <Typography.Paragraph className={styles.helperText}>
                                                Start recording during the consultation, then stop to transcribe and attach the captured notes.
                                            </Typography.Paragraph>
                                        </div>
                                        {isRecording ? <Tag className={styles.recordingTag}>Recording {recordingDurationLabel}</Tag> : null}
                                    </div>
                                    <Space wrap>
                                        <Button
                                            icon={<AudioOutlined />}
                                            className={styles.signalAction}
                                            disabled={isFinalized || isRecording || state.isAttachingTranscript}
                                            loading={state.isAttachingTranscript && !isRecording}
                                            onClick={() => void startRecording()}
                                            data-testid="consultation-start-recording"
                                        >
                                            Start Live Transcript
                                        </Button>
                                        <Button
                                            icon={<StopOutlined />}
                                            className={styles.secondaryAction}
                                            disabled={isFinalized || !isRecording}
                                            onClick={stopRecording}
                                            data-testid="consultation-stop-recording"
                                        >
                                            Stop Recording
                                        </Button>
                                    </Space>
                                </div>
                                <TextArea
                                    value={transcriptText}
                                    onChange={(event) => setTranscriptText(event.target.value)}
                                    className={styles.transcriptArea}
                                    disabled={isFinalized}
                                    placeholder="Paste or type the consultation transcript here."
                                />
                                <Space wrap style={{ marginTop: 12 }}>
                                    <Button
                                        icon={state.isAttachingTranscript ? <LoadingOutlined /> : <AudioOutlined />}
                                        className={styles.signalAction}
                                        loading={state.isAttachingTranscript}
                                        disabled={isFinalized}
                                        onClick={() => void attachTranscript()}
                                    >
                                        Attach Transcript
                                    </Button>
                                    <span className={styles.transcriptMeta}>
                                        {workspace.transcripts.length > 0 ? `${workspace.transcripts.length} transcript entries attached` : "No transcript attached yet"}
                                    </span>
                                </Space>
                            </Card>
                        </aside>

                        <div className={styles.mainColumn}>
                            <Card className={styles.panelCard}>
                                <Typography.Title level={5} className={styles.sectionHeading}>
                                    Visit Workflow
                                </Typography.Title>
                                <Steps size="small" responsive items={workflowSteps} className={styles.workflowSteps} />
                            </Card>
                            <Card className={styles.workspaceCard}>
                                <div className={styles.statusStrip}>
                                    <span className={styles.successPill}>{isFinalized ? "Finalized" : "Draft in progress"}</span>
                                    <Typography.Text className={styles.helperText}>{review?.chiefComplaint || workspace.patientContext.chiefComplaint || workspace.visitStatus}</Typography.Text>
                                </div>
                                <Tabs activeKey={activeTab} onChange={setActiveTab} items={noteTabs} />
                                <Typography.Text className={styles.helperText}>
                                    {isFinalized ? "Finalized notes are locked for this visit." : "Draft saves persist and can be reopened from the consultation workspace."}
                                </Typography.Text>
                            </Card>
                        </div>
                    </div>
                </>
            )}
        </section>
    );
};
