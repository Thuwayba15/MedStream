"use client";

import { ArrowLeftOutlined, CheckCircleOutlined, ClockCircleOutlined, FileTextOutlined, HistoryOutlined, StopOutlined, WarningOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Empty, Modal, Select, Skeleton, Space, Tag, Typography } from "antd";
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

const appendQueryToPath = (path: string, params: Record<string, string | number | undefined>): string => {
    const [basePath, queryString] = path.split("?");
    const query = new URLSearchParams(queryString ?? "");

    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
            return;
        }

        query.set(key, String(value));
    });

    const serialized = query.toString();
    return serialized ? `${basePath}?${serialized}` : basePath;
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
    const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
    const [overrideUrgencyLevel, setOverrideUrgencyLevel] = useState<TUrgencyLevel>("Priority");
    const [overrideNote, setOverrideNote] = useState("");

    useEffect(() => {
        if (queueTicketId > 0) {
            void actions.loadReview(queueTicketId);
        }
    }, [actions, queueTicketId]);

    const review = state.review;
    const status = review?.queueStatus;

    const actionConfig = useMemo((): { status: TQueueStatus; label: string; icon: React.ReactNode } | null => {
        if (!status) {
            return null;
        }

        if (status === "waiting") {
            return {
                status: "in_consultation",
                label: "Start Consultation",
                icon: <FileTextOutlined />,
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

    const openOverrideModal = (): void => {
        if (review) {
            setOverrideUrgencyLevel(review.urgencyLevel);
        }

        setOverrideNote("");
        setIsOverrideModalOpen(true);
    };

    const closeOverrideModal = (): void => {
        setIsOverrideModalOpen(false);
        setOverrideNote("");
    };

    const handlePrimaryAction = async (): Promise<void> => {
        if (!review || !actionConfig) {
            return;
        }

        const updateResult = await actions.updateQueueStatus(review.queueTicketId, actionConfig.status);
        if (!updateResult) {
            return;
        }

        if (actionConfig.status === "in_consultation") {
            router.push(
                appendQueryToPath(review.consultationPath, {
                    patientUserId: review.patientUserId,
                })
            );
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

    const handleUrgencyOverride = async (): Promise<void> => {
        if (!review) {
            return;
        }

        const result = await actions.overrideUrgency(review.queueTicketId, overrideUrgencyLevel, overrideNote);
        if (result) {
            closeOverrideModal();
        }
    };

    const patientSummary = review ? (review.selectedSymptoms.length > 0 ? `Reported symptoms: ${review.selectedSymptoms.join(", ")}` : "No additional symptom tags were captured.") : "";

    return (
        <section className={styles.page}>
            <header className={styles.topBar}>
                <div className={styles.topBarLeft}>
                    <Link href="/clinician">
                        <Button icon={<ArrowLeftOutlined />} className={`${styles.backButton} ${styles.secondaryAction}`}>
                            Back
                        </Button>
                    </Link>
                    <Typography.Title level={2} className={styles.reviewTitle}>
                        Triage Review
                    </Typography.Title>
                    {review ? <Tag className={styles.queueBadge}>#{review.queueNumber}</Tag> : null}
                </div>
                <Space size={10} wrap>
                    <Button className={styles.secondaryAction} onClick={openOverrideModal}>
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
                                <Typography.Text strong>AI Summary</Typography.Text>
                                <div className={styles.summaryPanel}>
                                    <Typography.Paragraph className={styles.bodyText}>{review.clinicianSummary || "A clinician-ready summary is not available yet."}</Typography.Paragraph>
                                </div>
                            </Space>
                        </Card>
                    </Space>

                    <Space orientation="vertical" size={14}>
                        <Card className={styles.sectionCard}>
                            <Space orientation="vertical" size={12}>
                                <div className={`${styles.assessmentIconWrap} ${getAssessmentIconClassName(review.urgencyLevel, styles)}`}>
                                    <WarningOutlined />
                                </div>
                                <Typography.Title level={4} className={styles.sideSectionTitle}>
                                    System Assessment
                                </Typography.Title>
                                <Typography.Title level={2} className={`${styles.assessmentUrgency} ${getAssessmentUrgencyClassName(review.urgencyLevel, styles)}`}>
                                    {review.urgencyLevel.toUpperCase()}
                                </Typography.Title>
                                <Typography.Paragraph className={styles.bodyText}>{review.triageExplanation || "No triage explanation is available."}</Typography.Paragraph>
                                <Typography.Text strong>Reasoning</Typography.Text>
                                {review.reasoning.length > 0 ? (
                                    <div className={styles.redFlagList}>
                                        {review.reasoning.map((item) => (
                                            <div key={item} className={styles.redFlagItem}>
                                                <span className={`${styles.redDot} ${getReasoningDotClassName(review.urgencyLevel, styles)}`} />
                                                <Typography.Text>{item}</Typography.Text>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <Typography.Text type="secondary">No explicit clinical reasoning was captured.</Typography.Text>
                                )}
                                <Typography.Text type="secondary">Priority score: {review.priorityScore}</Typography.Text>
                            </Space>
                        </Card>

                        <Card className={styles.sectionCard}>
                            <Space orientation="vertical" size={10} className={styles.actionStack}>
                                <Link
                                    href={appendQueryToPath(review.consultationPath, {
                                        patientUserId: review.patientUserId,
                                    })}
                                >
                                    <Button icon={<FileTextOutlined />} className={styles.secondaryAction} block>
                                        Consultation
                                    </Button>
                                </Link>
                                <Link
                                    href={appendQueryToPath(review.patientHistoryPath, {
                                        queueTicketId: review.queueTicketId,
                                    })}
                                >
                                    <Button icon={<HistoryOutlined />} className={styles.secondaryAction} block>
                                        Patient Timeline
                                    </Button>
                                </Link>
                                {canCancel ? (
                                    <Button
                                        icon={<StopOutlined />}
                                        className={`${styles.secondaryAction} ${styles.centeredAction}`}
                                        loading={state.isUpdatingStatus}
                                        onClick={() => setIsCancelModalOpen(true)}
                                        block
                                    >
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

            <Modal
                title="Override urgency"
                open={isOverrideModalOpen}
                onCancel={closeOverrideModal}
                onOk={() => void handleUrgencyOverride()}
                okText="Save urgency"
                confirmLoading={state.isUpdatingStatus}
            >
                <Space orientation="vertical" size={12} style={{ width: "100%" }}>
                    <Select<TUrgencyLevel>
                        value={overrideUrgencyLevel}
                        onChange={setOverrideUrgencyLevel}
                        options={[
                            { value: "Urgent", label: "Urgent" },
                            { value: "Priority", label: "Priority" },
                            { value: "Routine", label: "Routine" },
                        ]}
                    />
                </Space>
            </Modal>
        </section>
    );
};

const getAssessmentUrgencyClassName = (urgencyLevel: TUrgencyLevel, styles: Record<string, string>): string => {
    if (urgencyLevel === "Urgent") {
        return styles.assessmentUrgent;
    }

    if (urgencyLevel === "Priority") {
        return styles.assessmentPriority;
    }

    return styles.assessmentRoutine;
};

const getAssessmentIconClassName = (urgencyLevel: TUrgencyLevel, styles: Record<string, string>): string => {
    if (urgencyLevel === "Urgent") {
        return styles.assessmentIconUrgent;
    }

    if (urgencyLevel === "Priority") {
        return styles.assessmentIconPriority;
    }

    return styles.assessmentIconRoutine;
};

const getReasoningDotClassName = (urgencyLevel: TUrgencyLevel, styles: Record<string, string>): string => {
    if (urgencyLevel === "Urgent") {
        return styles.reasoningDotUrgent;
    }

    if (urgencyLevel === "Priority") {
        return styles.reasoningDotPriority;
    }

    return styles.reasoningDotRoutine;
};
