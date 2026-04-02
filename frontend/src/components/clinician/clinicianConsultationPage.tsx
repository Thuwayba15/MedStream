"use client";

import { Button, Card, Empty, Input, Skeleton, Typography } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { buildConsultationEditorTabs } from "@/components/clinician/consultationEditorTabs";
import { ConsultationInboxState } from "@/components/clinician/consultationInboxState";
import { ConsultationWorkspaceContent } from "@/components/clinician/consultationWorkspaceContent";
import { useClinicianToastMessages } from "@/hooks/clinician/useClinicianToastMessages";
import { useConsultationRecorder } from "@/hooks/clinician/useConsultationRecorder";
import { useClinicianConsultationActions, useClinicianConsultationState } from "@/providers/clinician-consultation";
import { useClinicianConsultationStyles } from "./consultationStyle";
import {
    asNumber,
    buildClinicianTimelineSummary,
    buildPatientTimelineSummary,
    createNoteDraft,
    createVitalsDraft,
    sanitizeClinicalCopy,
    type IClinicianConsultationPageProps,
    type INoteDraftState,
    type IVitalsDraftState,
} from "./consultationHelpers";

export const ClinicianConsultationPage = ({ visitId, queueTicketId }: IClinicianConsultationPageProps): React.JSX.Element => {
    const { styles } = useClinicianConsultationStyles();
    const router = useRouter();
    const state = useClinicianConsultationState();
    const actions = useClinicianConsultationActions();
    const [activeTab, setActiveTab] = useState("subjective");
    const [noteDraftState, setNoteDraftState] = useState<{ signature: string; values: INoteDraftState }>({ signature: "", values: createNoteDraft() });
    const [vitalsDraftState, setVitalsDraftState] = useState<{ signature: string; values: IVitalsDraftState }>({ signature: "", values: createVitalsDraft() });
    const [pendingTranscriptPreview, setPendingTranscriptPreview] = useState("");
    const [timelineToastMessage, setTimelineToastMessage] = useState<string | null>(null);

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
    const missingTimelineSummaries = useMemo(() => {
        const missing: string[] = [];
        if (!noteDraft.clinicianTimelineSummary.trim()) missing.push("clinician-facing summary");
        if (!noteDraft.patientTimelineSummary.trim()) missing.push("patient-friendly summary");
        return missing;
    }, [noteDraft.clinicianTimelineSummary, noteDraft.patientTimelineSummary]);
    const { isRecording, isTranscribing, recordingError, clearRecordingError, startRecording, stopRecording } = useConsultationRecorder({
        visitId: workspace?.visitId,
        onTranscriptReady: setPendingTranscriptPreview,
        transcribeAudio: actions.transcribeAudio,
    });
    const toastContext = useClinicianToastMessages([
        {
            type: "error",
            content: state.errorMessage,
            onClose: actions.clearMessages,
        },
        {
            type: "success",
            content: state.successMessage,
            onClose: actions.clearMessages,
        },
        {
            type: "warning",
            content: recordingError,
            onClose: clearRecordingError,
        },
        {
            type: "warning",
            content: timelineToastMessage,
            onClose: () => setTimelineToastMessage(null),
        },
    ]);

    const updateNoteDraft = (updater: INoteDraftState | ((current: INoteDraftState) => INoteDraftState)): void => {
        setNoteDraftState((current) => {
            const base = current.signature === noteSignature ? current.values : hydratedNote;
            return { signature: noteSignature, values: typeof updater === "function" ? updater(base) : updater };
        });
    };

    const updateVitalsDraft = (updater: IVitalsDraftState | ((current: IVitalsDraftState) => IVitalsDraftState)): void => {
        setVitalsDraftState((current) => {
            const base = current.signature === vitalsSignature ? current.values : hydratedVitals;
            return { signature: vitalsSignature, values: typeof updater === "function" ? updater(base) : updater };
        });
    };

    const patientName = review?.patientName ?? workspace?.patientContext.patientName ?? "Consultation";
    const queueStatus = review?.queueStatus ?? workspace?.patientContext.queueStatus;
    const urgencyLevel = (review?.urgencyLevel ?? workspace?.patientContext.urgencyLevel ?? "Priority") as "Routine" | "Priority" | "Urgent";
    const isFinalized = (workspace?.encounterNote.status ?? "draft") === "finalized";
    const canCompleteVisit = isFinalized && Boolean(review?.queueTicketId) && review?.queueStatus === "in_consultation";

    const workflowSteps = useMemo(() => {
        const steps = [
            { title: "Capture Context", content: workspace?.transcripts.length ? "Transcript attached" : "Attach transcript or typed notes", done: Boolean(workspace?.transcripts.length) },
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
                title: "Timeline Summary",
                content: missingTimelineSummaries.length === 0 ? "Summaries ready for final review" : "Add clinician and patient summaries",
                done: missingTimelineSummaries.length === 0,
            },
            { title: "Finalize Note", content: isFinalized ? "Note locked" : "Finalize when the consultation note is complete", done: isFinalized },
        ];

        const currentIndex = steps.findIndex((item) => !item.done);
        return steps.map((item, index): { title: string; content: string; status: "wait" | "process" | "finish" } => ({
            title: item.title,
            content: item.content,
            status: currentIndex === -1 ? "finish" : index < currentIndex && item.done ? "finish" : index === currentIndex ? "process" : "wait",
        }));
    }, [isFinalized, missingTimelineSummaries.length, noteDraft.assessment, noteDraft.objective, noteDraft.plan, workspace?.latestVitals, workspace?.transcripts.length]);

    const saveNoteDraft = async (): Promise<void> => {
        if (!workspace) return;
        await actions.saveEncounterNoteDraft({ visitId: workspace.visitId, ...noteDraft });
    };

    const finalizeNote = async (): Promise<void> => {
        if (!workspace) return;
        if (missingTimelineSummaries.length > 0) {
            setTimelineToastMessage(`Add the ${missingTimelineSummaries.join(" and ")} before finalizing this encounter note.`);
            setActiveTab("timeline");
            return;
        }

        const saved = await actions.saveEncounterNoteDraft({ visitId: workspace.visitId, ...noteDraft });
        if (saved) {
            await actions.finalizeEncounterNote({
                visitId: workspace.visitId,
                clinicianTimelineSummary: noteDraft.clinicianTimelineSummary.trim(),
                patientTimelineSummary: noteDraft.patientTimelineSummary.trim(),
            });
        }
    };

    const saveVitals = async (): Promise<void> => {
        if (!workspace) return;
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

    const confirmRecordedTranscript = async (): Promise<void> => {
        if (!workspace || !pendingTranscriptPreview.trim()) {
            return;
        }

        const confirmedTranscript = pendingTranscriptPreview.trim();
        const attached = await actions.attachTranscript({
            visitId: workspace.visitId,
            inputMode: "typed",
            rawTranscriptText: confirmedTranscript,
        });

        if (attached) {
            setPendingTranscriptPreview("");
        }
    };

    const noteTabs =
        buildConsultationEditorTabs({
            styles,
            isFinalized,
            noteDraft,
            vitalsDraft,
            missingTimelineSummaries,
            subjectiveDraft: state.subjectiveDraft,
            assessmentPlanDraft: state.assessmentPlanDraft,
            isGeneratingSubjective: state.isGeneratingSubjective,
            isRecording,
            isSavingVitals: state.isSavingVitals,
            isGeneratingAssessmentPlan: state.isGeneratingAssessmentPlan,
            onGenerateSubjective: () => workspace && void actions.generateSubjectiveDraft(workspace.visitId),
            onToggleRecording: () => void (isRecording ? stopRecording() : startRecording()),
            onApplyGeneratedSubjective: () => {
                if (!state.subjectiveDraft?.subjective) return;
                updateNoteDraft((current) => ({ ...current, subjective: sanitizeClinicalCopy(state.subjectiveDraft?.subjective ?? current.subjective) }));
            },
            onSaveVitals: () => void saveVitals(),
            onGenerateAssessmentPlan: () => workspace && void actions.generateAssessmentPlanDraft(workspace.visitId),
            onApplyGeneratedAssessmentPlan: () => {
                if (!state.assessmentPlanDraft) return;
                updateNoteDraft((current) => ({
                    ...current,
                    assessment: sanitizeClinicalCopy(state.assessmentPlanDraft?.assessment ?? current.assessment),
                    plan: sanitizeClinicalCopy(state.assessmentPlanDraft?.plan ?? current.plan),
                }));
                setActiveTab("assessment");
            },
            onUpdateNoteDraft: updateNoteDraft,
            onUpdateVitalsDraft: updateVitalsDraft,
        }) ?? [];

    return (
        <section className={styles.page}>
            {toastContext}

            {!activeVisitId ? (
                <ConsultationInboxState styles={styles} inbox={inbox} isLoading={state.isLoadingWorkspace && !state.inbox} />
            ) : state.isLoadingWorkspace && !workspace ? (
                <Card className={styles.panelCard}>
                    <Skeleton active paragraph={{ rows: 12 }} />
                </Card>
            ) : !workspace ? (
                <Card className={styles.emptyStateCard}>
                    <Empty description="Consultation workspace could not be loaded for this visit." />
                </Card>
            ) : (
                <ConsultationWorkspaceContent
                    styles={styles}
                    workspace={workspace}
                    patientName={patientName}
                    queueStatus={queueStatus}
                    urgencyLevel={urgencyLevel}
                    isFinalized={isFinalized}
                    canCompleteVisit={canCompleteVisit}
                    noteTabs={noteTabs}
                    workflowSteps={workflowSteps}
                    reviewSummary={review?.clinicianSummary}
                    isSavingDraft={state.isSavingDraft}
                    isFinalizing={state.isFinalizing}
                    isCompletingVisit={state.isCompletingVisit}
                    activeTab={activeTab}
                    onSetActiveTab={setActiveTab}
                    onSaveDraft={() => void saveNoteDraft()}
                    onFinalizeNote={() => void finalizeNote()}
                    onCompleteVisit={() =>
                        void actions.completeVisit(review!.queueTicketId).then((result) => {
                            if (result) {
                                actions.clearActiveConsultation();
                                router.push("/clinician/consultation");
                            }
                        })
                    }
                    onGoToObjective={() => setActiveTab("objective")}
                />
            )}

            {isTranscribing || pendingTranscriptPreview ? (
                <div className={styles.transcriptOverlay}>
                    <section className={styles.transcriptPreviewCard}>
                        <Typography.Title level={4} className={styles.transcriptPreviewTitle}>
                            {isTranscribing ? "Transcribing consultation" : "Review recorded transcript"}
                        </Typography.Title>
                        {isTranscribing ? (
                            <>
                                <Typography.Paragraph className={styles.helperText}>We&apos;re turning the recording into editable text. This can take a few moments.</Typography.Paragraph>
                                <Skeleton active paragraph={{ rows: 6 }} />
                            </>
                        ) : (
                            <>
                                <Typography.Paragraph className={styles.helperText}>
                                    Check and edit the captured text before using it for draft generation and transcript attachment.
                                </Typography.Paragraph>
                                <Input.TextArea
                                    value={pendingTranscriptPreview}
                                    onChange={(event) => setPendingTranscriptPreview(event.target.value)}
                                    className={styles.transcriptPreviewArea}
                                    autoSize={{ minRows: 8, maxRows: 14 }}
                                    data-testid="consultation-transcript-preview"
                                />
                                <div className={styles.transcriptPreviewActions}>
                                    <Button className={styles.secondaryAction} onClick={() => setPendingTranscriptPreview("")}>
                                        Dismiss
                                    </Button>
                                    <Button type="primary" className={styles.primaryAction} loading={state.isAttachingTranscript} onClick={() => void confirmRecordedTranscript()}>
                                        Confirm transcript
                                    </Button>
                                </div>
                            </>
                        )}
                    </section>
                </div>
            ) : null}
        </section>
    );
};
