"use client";

import { AudioOutlined, CheckCircleOutlined, FileDoneOutlined, LoadingOutlined, SaveOutlined, StopOutlined } from "@ant-design/icons";
import { Button, Card, Input, Space, Steps, Tabs, Tag, Typography } from "antd";
import Link from "next/link";
import type { IConsultationWorkspace } from "@/services/consultation/types";
import type { TUrgencyLevel } from "@/services/queue-operations/types";
import type { INoteDraftState } from "./consultationHelpers";
import { formatVisitStartedAt, getStatusLabel, getUrgencyClassName, isConcerning, sanitizeClinicalCopy } from "./consultationHelpers";

interface IConsultationWorkspaceContentProps {
    styles: Record<string, string>;
    workspace: IConsultationWorkspace;
    patientName: string;
    queueStatus?: string;
    urgencyLevel: TUrgencyLevel;
    isFinalized: boolean;
    canCompleteVisit: boolean;
    recordingDurationLabel: string;
    transcriptText: string;
    isRecording: boolean;
    noteTabs: NonNullable<React.ComponentProps<typeof Tabs>["items"]>;
    workflowSteps: Array<{ title: string; content: string; status: "wait" | "process" | "finish" }>;
    reviewSummary?: string | null;
    reviewQueueTicketId?: number;
    transcriptCount: number;
    isSavingDraft: boolean;
    isFinalizing: boolean;
    isCompletingVisit: boolean;
    isAttachingTranscript: boolean;
    activeTab: string;
    noteDraft: INoteDraftState;
    onSetActiveTab: (key: string) => void;
    onSaveDraft: () => void;
    onFinalizeNote: () => void;
    onCompleteVisit: () => void;
    onGoToObjective: () => void;
    onStartRecording: () => void;
    onStopRecording: () => void;
    onChangeTranscriptText: (value: string) => void;
    onAttachTranscript: () => void;
}

export const ConsultationWorkspaceContent = ({
    styles,
    workspace,
    patientName,
    queueStatus,
    urgencyLevel,
    isFinalized,
    canCompleteVisit,
    recordingDurationLabel,
    transcriptText,
    isRecording,
    noteTabs,
    workflowSteps,
    reviewSummary,
    reviewQueueTicketId,
    transcriptCount,
    isSavingDraft,
    isFinalizing,
    isCompletingVisit,
    isAttachingTranscript,
    activeTab,
    onSetActiveTab,
    onSaveDraft,
    onFinalizeNote,
    onCompleteVisit,
    onGoToObjective,
    onStartRecording,
    onStopRecording,
    onChangeTranscriptText,
    onAttachTranscript,
}: IConsultationWorkspaceContentProps): React.JSX.Element => {
    return (
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
                    <Button icon={<SaveOutlined />} className={styles.secondaryAction} loading={isSavingDraft} disabled={isFinalized} onClick={onSaveDraft} data-testid="consultation-save-draft">
                        Save Draft
                    </Button>
                    <Button type="primary" icon={<FileDoneOutlined />} className={styles.primaryAction} loading={isFinalizing} disabled={isFinalized} onClick={onFinalizeNote} data-testid="consultation-finalize-note">
                        {isFinalized ? "Note Finalized" : "Finalize Note"}
                    </Button>
                    {canCompleteVisit ? (
                        <Button icon={<CheckCircleOutlined />} className={styles.secondaryAction} loading={isCompletingVisit} onClick={onCompleteVisit}>
                            Complete Visit
                        </Button>
                    ) : null}
                </div>
            </header>

            <div className={styles.shellGrid}>
                <aside className={styles.sideRail}>
                    <Card className={styles.panelCard}>
                        <Typography.Title level={5} className={styles.sectionHeading}>Patient Context</Typography.Title>
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
                                {sanitizeClinicalCopy(reviewSummary ?? workspace.patientContext.subjectiveSummary) || "A clinician-facing summary is not available yet."}
                            </Typography.Paragraph>
                        </div>
                    </Card>

                    <Card className={styles.panelCard}>
                        <div className={styles.cardTitleRow}>
                            <Typography.Title level={5} className={styles.sectionHeading} style={{ marginBottom: 0 }}>Latest Vitals</Typography.Title>
                            <Button size="small" className={styles.secondaryAction} onClick={onGoToObjective}>Update</Button>
                        </div>
                        <div className={styles.metricStack}>
                            <VitalMetricRow label="BP" value={workspace.latestVitals?.bloodPressureSystolic && workspace.latestVitals?.bloodPressureDiastolic ? `${workspace.latestVitals.bloodPressureSystolic}/${workspace.latestVitals.bloodPressureDiastolic}` : "Not recorded"} alert={isConcerning("BP", workspace.latestVitals)} styles={styles} />
                            <VitalMetricRow label="HR" value={workspace.latestVitals?.heartRate ? `${workspace.latestVitals.heartRate} bpm` : "Not recorded"} alert={isConcerning("HR", workspace.latestVitals)} styles={styles} />
                            <VitalMetricRow label="Temp" value={workspace.latestVitals?.temperatureCelsius ? `${workspace.latestVitals.temperatureCelsius} deg C` : "Not recorded"} alert={isConcerning("Temp", workspace.latestVitals)} styles={styles} />
                            <VitalMetricRow label="SpO2" value={workspace.latestVitals?.oxygenSaturation ? `${workspace.latestVitals.oxygenSaturation}%` : "Not recorded"} alert={isConcerning("SpO2", workspace.latestVitals)} styles={styles} />
                            <VitalMetricRow label="RR" value={workspace.latestVitals?.respiratoryRate ? `${workspace.latestVitals.respiratoryRate}/min` : "Not recorded"} alert={isConcerning("RR", workspace.latestVitals)} styles={styles} />
                        </div>
                    </Card>

                    <Card className={styles.panelCard}>
                        <Typography.Title level={5} className={styles.sectionHeading}>Consultation Capture</Typography.Title>
                        <div className={styles.capturePanel}>
                            <div className={styles.captureHeader}>
                                <div>
                                    <Typography.Text strong>Live transcription</Typography.Text>
                                    <Typography.Paragraph className={styles.helperText}>Start recording during the consultation, then stop to transcribe and attach the captured notes.</Typography.Paragraph>
                                </div>
                                {isRecording ? <Tag className={styles.recordingTag}>Recording {recordingDurationLabel}</Tag> : null}
                            </div>
                            <Space wrap>
                                <Button icon={<AudioOutlined />} className={styles.signalAction} disabled={isFinalized || isRecording || isAttachingTranscript} loading={isAttachingTranscript && !isRecording} onClick={onStartRecording} data-testid="consultation-start-recording">
                                    Start Live Transcript
                                </Button>
                                <Button icon={<StopOutlined />} className={styles.secondaryAction} disabled={isFinalized || !isRecording} onClick={onStopRecording} data-testid="consultation-stop-recording">
                                    Stop Recording
                                </Button>
                            </Space>
                        </div>
                        <Input.TextArea value={transcriptText} onChange={(event) => onChangeTranscriptText(event.target.value)} className={styles.transcriptArea} disabled={isFinalized} placeholder="Paste or type the consultation transcript here." />
                        <Space wrap style={{ marginTop: 12 }}>
                            <Button icon={isAttachingTranscript ? <LoadingOutlined /> : <AudioOutlined />} className={styles.signalAction} loading={isAttachingTranscript} disabled={isFinalized} onClick={onAttachTranscript}>
                                Attach Transcript
                            </Button>
                            <span className={styles.transcriptMeta}>{transcriptCount > 0 ? `${transcriptCount} transcript entries attached` : "No transcript attached yet"}</span>
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
                            <Typography.Text className={styles.helperText}>{workspace.patientContext.chiefComplaint || workspace.visitStatus}</Typography.Text>
                        </div>
                        <Tabs activeKey={activeTab} onChange={onSetActiveTab} items={noteTabs} />
                        <Typography.Text className={styles.helperText}>{isFinalized ? "Finalized notes are locked for this visit." : "Draft saves persist and can be reopened from the consultation workspace."}</Typography.Text>
                    </Card>

                    {reviewQueueTicketId ? (
                        <Link href="/clinician">
                            <Button className={styles.secondaryAction}>Back to Queue</Button>
                        </Link>
                    ) : null}
                </div>
            </div>
        </>
    );
};

const VitalMetricRow = ({ label, value, alert, styles }: { label: string; value: string; alert: boolean; styles: Record<string, string> }) => (
    <div className={`${styles.metricRow} ${alert ? styles.metricRowAlert : ""}`}>
        <span className={styles.metricLabel}>{label}</span>
        <span className={styles.metricValue}>{value}</span>
    </div>
);
