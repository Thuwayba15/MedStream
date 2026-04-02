"use client";

import { CheckCircleOutlined, FileDoneOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Card, Steps, Tabs, Tag, Typography } from "antd";
import type { IConsultationWorkspace } from "@/services/consultation/types";
import type { TUrgencyLevel } from "@/services/queue-operations/types";
import { formatVisitStartedAt, getStatusLabel, getUrgencyClassName, isConcerning, sanitizeClinicalCopy } from "./consultationHelpers";

interface IConsultationWorkspaceContentProps {
    styles: Record<string, string>;
    workspace: IConsultationWorkspace;
    patientName: string;
    queueStatus?: string;
    urgencyLevel: TUrgencyLevel;
    isFinalized: boolean;
    canCompleteVisit: boolean;
    noteTabs: NonNullable<React.ComponentProps<typeof Tabs>["items"]>;
    workflowSteps: Array<{ title: string; content: string; status: "wait" | "process" | "finish" }>;
    reviewSummary?: string | null;
    isSavingDraft: boolean;
    isFinalizing: boolean;
    isCompletingVisit: boolean;
    activeTab: string;
    onSetActiveTab: (key: string) => void;
    onSaveDraft: () => void;
    onFinalizeNote: () => void;
    onCompleteVisit: () => void;
    onGoToObjective: () => void;
}

export const ConsultationWorkspaceContent = ({
    styles,
    workspace,
    patientName,
    queueStatus,
    urgencyLevel,
    isFinalized,
    canCompleteVisit,
    noteTabs,
    workflowSteps,
    reviewSummary,
    isSavingDraft,
    isFinalizing,
    isCompletingVisit,
    activeTab,
    onSetActiveTab,
    onSaveDraft,
    onFinalizeNote,
    onCompleteVisit,
    onGoToObjective,
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
                        <div className={styles.patientContextHeader}>
                            <Typography.Title level={5} className={styles.sectionHeading}>Patient Context</Typography.Title>
                            <div className={styles.tagRow}>
                                <Tag className={styles.queueTag}>{getStatusLabel(queueStatus)}</Tag>
                                <Tag className={getUrgencyClassName(urgencyLevel, styles)}>Triage: {urgencyLevel}</Tag>
                            </div>
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
                        {isFinalized ? <Typography.Text className={styles.helperText}>Finalized notes are locked for this visit.</Typography.Text> : null}
                    </Card>
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
