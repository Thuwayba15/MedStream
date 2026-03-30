"use client";

import { ArrowLeftOutlined, CheckCircleOutlined, ClockCircleOutlined, FileTextOutlined, HistoryOutlined, PhoneOutlined, StopOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Empty, Modal, Skeleton, Space, Tag, Typography } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useClinicianQueueReviewActions, useClinicianQueueReviewState } from "@/providers/clinician-queue-review";
import type { TQueueStatus, TUrgencyLevel } from "@/services/queue-operations/types";
import { useClinicianReviewStyles } from "./reviewStyle";

const getUrgencyClassName = (urgencyLevel: TUrgencyLevel, styles: Record<string, string>): string => {
    if (urgencyLevel === "Urgent") {
        return styles.urgencyUrgent;
    }

    if (urgencyLevel === "Priority") {
        return styles.urgencyPriority;
    }

    return styles.urgencyRoutine;
};

interface IClinicianTriageReviewPageProps {
    queueTicketId: number;
}

export const ClinicianTriageReviewPage = ({ queueTicketId }: IClinicianTriageReviewPageProps): React.JSX.Element => {
    const { styles } = useClinicianReviewStyles();
    const router = useRouter();
    const state = useClinicianQueueReviewState();
    const actions = useClinicianQueueReviewActions();
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

    useEffect(() => {
        void actions.loadReview(queueTicketId);
    }, [actions, queueTicketId]);

    const review = state.review;
    const status = review?.queueStatus;

    const statusActions = useMemo((): Array<{ label: string; status: TQueueStatus; icon: React.ReactNode; type: "primary" | "default" }> => {
        if (!status) {
            return [];
        }

        if (status === "waiting") {
            return [{ label: "Call In", status: "called", icon: <PhoneOutlined />, type: "primary" }];
        }

        if (status === "called") {
            return [
                { label: "Back to Waiting", status: "waiting", icon: <ClockCircleOutlined />, type: "default" },
                { label: "Start Consultation", status: "in_consultation", icon: <FileTextOutlined />, type: "primary" },
            ];
        }

        if (status === "in_consultation") {
            return [{ label: "Mark Completed", status: "completed", icon: <CheckCircleOutlined />, type: "primary" }];
        }

        return [];
    }, [status]);

    const canCancel = status === "waiting" || status === "called" || status === "in_consultation";

    const handleStatusUpdate = async (newStatus: TQueueStatus): Promise<void> => {
        if (!review) {
            return;
        }

        const updateResult = await actions.updateQueueStatus(review.queueTicketId, newStatus);
        if (!updateResult) {
            return;
        }

        if (newStatus === "in_consultation") {
            router.push(review.consultationPath);
        }
    };

    const handleCancel = async (): Promise<void> => {
        if (!review) {
            return;
        }

        const updateResult = await actions.updateQueueStatus(review.queueTicketId, "cancelled", "Queue entry cancelled by clinician during triage review.");
        if (updateResult) {
            setIsCancelModalOpen(false);
        }
    };

    return (
        <section className={styles.page}>
            <div className={styles.topBar}>
                <div className={styles.topBarLeft}>
                    <Link href="/clinician">
                        <Button icon={<ArrowLeftOutlined />}>Back to Queue</Button>
                    </Link>
                    <Typography.Title level={2} className={styles.reviewTitle}>
                        Triage Review
                    </Typography.Title>
                    {review ? <Tag className={styles.queueBadge}>#{review.queueNumber}</Tag> : null}
                </div>
            </div>

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

            {state.isLoadingReview && !review ? (
                <Card className={styles.sectionCard}>
                    <Skeleton active paragraph={{ rows: 6 }} />
                </Card>
            ) : !review ? (
                <Card className={styles.sectionCard}>
                    <Empty description="Queue ticket context was not found." />
                </Card>
            ) : (
                <div className={styles.contentGrid}>
                    <Space orientation="vertical" size={14}>
                        <Card className={styles.sectionCard}>
                            <Space orientation="vertical" size={10}>
                                <Typography.Title level={3} className={styles.patientName}>
                                    {review.patientName}
                                </Typography.Title>
                                <div className={styles.metaRow}>
                                    <Tag className={getUrgencyClassName(review.urgencyLevel, styles)}>{review.urgencyLevel}</Tag>
                                    <Tag className={styles.statusTag}>{review.queueStatus.replace("_", " ")}</Tag>
                                    <span>Waiting {review.waitingMinutes} min</span>
                                    <span>Stage: {review.currentStage}</span>
                                </div>
                                <Typography.Paragraph className={styles.chiefComplaint}>{review.chiefComplaint || "No chief complaint captured."}</Typography.Paragraph>
                                <Typography.Paragraph className={styles.bodyText}>
                                    {review.subjectiveSummary || "No subjective summary was captured during intake."}
                                </Typography.Paragraph>
                            </Space>
                        </Card>

                        <Card className={styles.sectionCard} title="Intake Summary">
                            <Space orientation="vertical" size={10}>
                                <Typography.Text strong>Reported Symptoms</Typography.Text>
                                <div className={styles.symptomWrap}>
                                    {(review.selectedSymptoms.length > 0 ? review.selectedSymptoms : ["No selected symptom tags"]).map((item) => (
                                        <Tag key={`selected-${item}`}>{item}</Tag>
                                    ))}
                                </div>
                                <Typography.Text strong>Extracted Symptoms</Typography.Text>
                                <div className={styles.symptomWrap}>
                                    {(review.extractedPrimarySymptoms.length > 0 ? review.extractedPrimarySymptoms : ["No extracted primary symptoms"]).map((item) => (
                                        <Tag key={`primary-${item}`}>{item}</Tag>
                                    ))}
                                </div>
                            </Space>
                        </Card>
                    </Space>

                    <Space orientation="vertical" size={14}>
                        <Card className={styles.sectionCard}>
                            <Space orientation="vertical" size={10}>
                                <Typography.Title level={4} className={styles.sideSectionTitle}>
                                    System Assessment
                                </Typography.Title>
                                <Tag className={getUrgencyClassName(review.urgencyLevel, styles)}>{review.urgencyLevel}</Tag>
                                <Typography.Paragraph className={styles.bodyText}>{review.triageExplanation || "No triage explanation is available."}</Typography.Paragraph>
                                {review.redFlags.length > 0 ? (
                                    <ul>
                                        {review.redFlags.map((flag) => (
                                            <li key={flag}>{flag}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <Typography.Text type="secondary">No explicit red flags captured.</Typography.Text>
                                )}
                                <Typography.Text type="secondary">Priority score: {review.priorityScore}</Typography.Text>
                            </Space>
                        </Card>

                        <Card className={styles.sectionCard}>
                            <Space orientation="vertical" size={10} className={styles.actionStack}>
                                {statusActions.map((actionItem) => (
                                    <Button
                                        key={actionItem.status}
                                        type={actionItem.type}
                                        icon={actionItem.icon}
                                        className={actionItem.type === "primary" ? styles.primaryAction : styles.secondaryAction}
                                        loading={state.isUpdatingStatus}
                                        onClick={() => void handleStatusUpdate(actionItem.status)}
                                    >
                                        {actionItem.label}
                                    </Button>
                                ))}

                                <Link href={review.consultationPath}>
                                    <Button icon={<FileTextOutlined />} className={styles.secondaryAction} block>
                                        Consultation Page
                                    </Button>
                                </Link>

                                <Link href={review.patientHistoryPath}>
                                    <Button icon={<HistoryOutlined />} className={styles.secondaryAction} block>
                                        Patient History
                                    </Button>
                                </Link>

                                {canCancel ? (
                                    <Button icon={<StopOutlined />} className={styles.cancelAction} loading={state.isUpdatingStatus} onClick={() => setIsCancelModalOpen(true)}>
                                        Cancel Queue Entry
                                    </Button>
                                ) : null}
                            </Space>
                        </Card>
                    </Space>
                </div>
            )}

            <Modal
                title="Cancel queue entry?"
                open={isCancelModalOpen}
                onCancel={() => setIsCancelModalOpen(false)}
                onOk={() => void handleCancel()}
                okText="Yes, cancel entry"
                confirmLoading={state.isUpdatingStatus}
                okButtonProps={{ danger: true }}
            >
                <Typography.Paragraph>Cancelled queue entries are removed from active flow and should only be used when a visit is no longer continuing.</Typography.Paragraph>
            </Modal>
        </section>
    );
};
