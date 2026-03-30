"use client";

import { ArrowLeftOutlined, CheckCircleOutlined, ClockCircleOutlined, FileTextOutlined, HistoryOutlined, PhoneOutlined, StopOutlined, WarningOutlined } from "@ant-design/icons";
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

const getHumanStatus = (status: TQueueStatus): string => {
    return status.replace("_", " ");
};

const normalizeFollowUpValue = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "[]" || trimmed === "{}") {
        return "Not provided";
    }

    if (trimmed.toLowerCase() === "true") {
        return "Yes";
    }

    if (trimmed.toLowerCase() === "false") {
        return "No";
    }

    return trimmed;
};

const parseFollowUpAnswers = (subjectiveSummary: string): Array<{ label: string; value: string }> => {
    const marker = "Follow-up answers:";
    const markerIndex = subjectiveSummary.indexOf(marker);
    if (markerIndex < 0) {
        return [];
    }

    const answerSection = subjectiveSummary.slice(markerIndex + marker.length).trim();
    if (!answerSection) {
        return [];
    }

    return answerSection
        .split(";")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0 && entry.includes(":"))
        .map((entry) => {
            const separatorIndex = entry.indexOf(":");
            const label = entry.slice(0, separatorIndex).trim();
            const value = entry.slice(separatorIndex + 1).trim();
            return {
                label: label.length > 0 ? label : "Follow-up",
                value: normalizeFollowUpValue(value),
            };
        });
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
        if (queueTicketId > 0) {
            void actions.loadReview(queueTicketId);
        }
    }, [actions, queueTicketId]);

    const review = state.review;
    const status = review?.queueStatus;

    const followUpAnswers = useMemo(() => {
        return review ? parseFollowUpAnswers(review.subjectiveSummary) : [];
    }, [review]);

    const actionConfig = useMemo((): { status: TQueueStatus; label: string; icon: React.ReactNode } | null => {
        if (!status) {
            return null;
        }

        if (status === "waiting") {
            return {
                status: "called",
                label: "Call In",
                icon: <PhoneOutlined />,
            };
        }

        if (status === "called") {
            return {
                status: "in_consultation",
                label: "Confirm & Start Consultation",
                icon: <FileTextOutlined />,
            };
        }

        if (status === "in_consultation") {
            return {
                status: "completed",
                label: "Mark Consultation Completed",
                icon: <CheckCircleOutlined />,
            };
        }

        return null;
    }, [status]);

    const canCancel = status === "waiting" || status === "called" || status === "in_consultation";

    const handlePrimaryAction = async (): Promise<void> => {
        if (!review || !actionConfig) {
            return;
        }

        const updateResult = await actions.updateQueueStatus(review.queueTicketId, actionConfig.status);
        if (!updateResult) {
            return;
        }

        if (actionConfig.status === "in_consultation") {
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
            router.push("/clinician");
        }
    };

    const patientSummary = review
        ? review.selectedSymptoms.length > 0
            ? `Reported symptoms: ${review.selectedSymptoms.join(", ")}`
            : "No additional symptom tags were captured."
        : "";

    return (
        <section className={styles.page}>
            <header className={styles.topBar}>
                <div className={styles.topBarLeft}>
                    <Link href="/clinician">
                        <Button icon={<ArrowLeftOutlined />} className={styles.backButton}>
                            Back
                        </Button>
                    </Link>
                    <Typography.Title level={2} className={styles.reviewTitle}>
                        Triage Review
                    </Typography.Title>
                    {review ? <Tag className={styles.queueBadge}>#{review.queueNumber}</Tag> : null}
                </div>
                <Space size={10} wrap>
                    <Button className={styles.secondaryAction} disabled>
                        Override Urgency
                    </Button>
                    {actionConfig ? (
                        <Button type="primary" icon={actionConfig.icon} className={styles.primaryAction} loading={state.isUpdatingStatus} onClick={() => void handlePrimaryAction()}>
                            {actionConfig.label}
                        </Button>
                    ) : null}
                </Space>
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

            {state.isLoadingReview && !review ? (
                <Card className={styles.sectionCard}>
                    <Skeleton active paragraph={{ rows: 7 }} />
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
                                <div className={styles.patientHeaderRow}>
                                    <Typography.Title level={3} className={styles.patientName}>
                                        {review.patientName}
                                    </Typography.Title>
                                </div>
                                <div className={styles.metaRow}>
                                    <Tag className={styles.statusTag}>{getHumanStatus(review.queueStatus)}</Tag>
                                    <Tag className={getUrgencyClassName(review.urgencyLevel, styles)}>{review.urgencyLevel}</Tag>
                                    <span>
                                        <ClockCircleOutlined /> Queue #{review.queueNumber}
                                    </span>
                                </div>
                                <Card className={styles.chiefComplaintCard} variant="borderless">
                                    <Typography.Text className={styles.fieldLabel}>Chief Complaint</Typography.Text>
                                    <Typography.Paragraph className={styles.chiefComplaint}>{review.chiefComplaint || "Not captured."}</Typography.Paragraph>
                                </Card>
                                <Typography.Paragraph className={styles.bodyText}>{patientSummary}</Typography.Paragraph>
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
                                {followUpAnswers.length > 0 ? (
                                    <>
                                        <Typography.Text strong>Follow-up Answers</Typography.Text>
                                        <div className={styles.followUpList}>
                                            {followUpAnswers.map((answer, index) => (
                                                <div key={`${answer.label}-${index}`} className={styles.followUpItem}>
                                                    <Typography.Text className={styles.followUpLabel}>{answer.label}</Typography.Text>
                                                    <Typography.Text className={styles.followUpValue}>{answer.value}</Typography.Text>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : null}
                            </Space>
                        </Card>
                    </Space>

                    <Space orientation="vertical" size={14}>
                        <Card className={styles.sectionCard}>
                            <Space orientation="vertical" size={12}>
                                <div className={styles.assessmentIconWrap}>
                                    <WarningOutlined />
                                </div>
                                <Typography.Title level={4} className={styles.sideSectionTitle}>
                                    System Assessment
                                </Typography.Title>
                                <Typography.Title level={2} className={styles.assessmentUrgency}>
                                    {review.urgencyLevel.toUpperCase()}
                                </Typography.Title>
                                <Typography.Paragraph className={styles.bodyText}>{review.triageExplanation || "No triage explanation is available."}</Typography.Paragraph>
                                <Typography.Text strong>Rule-Based Logic Applied</Typography.Text>
                                {review.redFlags.length > 0 ? (
                                    <div className={styles.redFlagList}>
                                        {review.redFlags.map((flag) => (
                                            <div key={flag} className={styles.redFlagItem}>
                                                <span className={styles.redDot} />
                                                <Typography.Text>{flag}</Typography.Text>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <Typography.Text type="secondary">No explicit red flags captured.</Typography.Text>
                                )}
                                <Typography.Text type="secondary">Priority score: {review.priorityScore}</Typography.Text>
                            </Space>
                        </Card>

                        <Card className={styles.sectionCard}>
                            <Space orientation="vertical" size={10} className={styles.actionStack}>
                                <Link href={review.consultationPath}>
                                    <Button icon={<FileTextOutlined />} className={styles.secondaryAction} block>
                                        Consultation
                                    </Button>
                                </Link>
                                <Link href={review.patientHistoryPath}>
                                    <Button icon={<HistoryOutlined />} className={styles.secondaryAction} block>
                                        Patient Timeline
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
