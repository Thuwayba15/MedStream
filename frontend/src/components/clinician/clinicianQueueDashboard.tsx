"use client";

import { ClockCircleOutlined, EyeOutlined, ReloadOutlined, WarningOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Empty, Input, Segmented, Skeleton, Space, Statistic, Tag, Typography } from "antd";
import Link from "next/link";
import { useMemo } from "react";
import { useClinicianQueueActions, useClinicianQueueState } from "@/providers/clinician-queue";
import type { IClinicianQueueItem, TUrgencyLevel } from "@/services/queue-operations/types";
import { useClinicianQueueStyles } from "./style";

interface ISummaryCard {
    title: string;
    value: number;
    suffix?: string;
    hint: string;
    tone: "neutral" | "warning" | "danger" | "success";
}

const getUrgencyClassName = (urgencyLevel: TUrgencyLevel, styles: Record<string, string>): string => {
    if (urgencyLevel === "Urgent") {
        return styles.badgeUrgent;
    }

    if (urgencyLevel === "Priority") {
        return styles.badgePriority;
    }

    return styles.badgeRoutine;
};

const getStatusClassName = (queueStatus: IClinicianQueueItem["queueStatus"], styles: Record<string, string>): string => {
    if (queueStatus === "in_consultation") {
        return styles.statusInConsult;
    }

    if (queueStatus === "called") {
        return styles.statusCalled;
    }

    return styles.statusWaiting;
};

const getQueueAccentClassName = (urgencyLevel: TUrgencyLevel, styles: Record<string, string>): string => {
    if (urgencyLevel === "Urgent") {
        return styles.rowUrgent;
    }

    if (urgencyLevel === "Priority") {
        return styles.rowPriority;
    }

    return styles.rowRoutine;
};

const buildClinicalPreview = (item: IClinicianQueueItem): string => {
    if (item.urgencyLevel === "Urgent") {
        return "Urgent triage indicator detected. Immediate clinician review recommended.";
    }

    if (item.urgencyLevel === "Priority") {
        return "Priority visit with moderate risk profile. Review soon to reduce wait escalation.";
    }

    return "Routine visit currently waiting for clinician availability and consultation start.";
};

export const ClinicianQueueDashboard = (): React.JSX.Element => {
    const { styles } = useClinicianQueueStyles();
    const state = useClinicianQueueState();
    const actions = useClinicianQueueActions();

    const summaryCards = useMemo<ISummaryCard[]>(() => {
        const waitingItems = state.items.filter((item) => item.queueStatus === "waiting");
        const urgentCount = state.items.filter((item) => item.urgencyLevel === "Urgent" && item.isActive).length;
        const completedToday = state.items.filter((item) => item.queueStatus === "completed").length;
        const averageWaitingMinutes = waitingItems.length === 0 ? 0 : Math.round(waitingItems.reduce((sum, item) => sum + item.waitingMinutes, 0) / waitingItems.length);

        return [
            {
                title: "Patients Waiting",
                value: waitingItems.length,
                hint: "In the queue now",
                tone: "neutral",
            },
            {
                title: "Average Wait",
                value: averageWaitingMinutes,
                suffix: "m",
                hint: "Across all visible cases",
                tone: "warning",
            },
            {
                title: "Urgent Cases",
                value: urgentCount,
                hint: "Needs immediate attention",
                tone: "danger",
            },
            {
                title: "Seen Today",
                value: completedToday,
                hint: "Consultations completed",
                tone: "success",
            },
        ];
    }, [state.items]);

    return (
        <section className={styles.queuePage}>
            <header className={styles.pageHeader}>
                <div>
                    <Typography.Title level={1} className={styles.pageTitle}>
                        Queue Dashboard
                    </Typography.Title>
                </div>
                <Tag className={styles.liveTag}>Live - Manual Refresh</Tag>
            </header>

            {state.errorMessage ? (
                <Alert
                    type="error"
                    showIcon
                    message={state.errorMessage}
                    action={
                        <Button size="small" onClick={actions.clearError}>
                            Dismiss
                        </Button>
                    }
                />
            ) : null}

            <div className={styles.summaryGrid}>
                {summaryCards.map((card) => (
                    <Card key={card.title} className={`${styles.summaryCard} ${styles[`summary${card.tone.charAt(0).toUpperCase()}${card.tone.slice(1)}` as keyof typeof styles]}`}>
                        <Statistic title={card.title} value={card.value} suffix={card.suffix} />
                        <Typography.Text type="secondary">{card.hint}</Typography.Text>
                    </Card>
                ))}
            </div>

            <Card className={styles.filterCard}>
                <div className={styles.filterTopRow}>
                    <Input
                        allowClear
                        size="large"
                        prefix={<ClockCircleOutlined />}
                        placeholder="Search patient name or queue #"
                        value={state.searchText}
                        onChange={(event) => actions.setSearchText(event.target.value)}
                    />
                    <Button type="primary" className={styles.refreshButton} icon={<ReloadOutlined />} loading={state.isRefreshing} onClick={() => void actions.loadQueue("refresh")}>
                        Refresh
                    </Button>
                </div>
                <div className={styles.filterBottomRow}>
                    <Space size={8} wrap>
                        <Typography.Text className={styles.filterLabel}>Status</Typography.Text>
                        <Segmented
                            data-testid="queue-status-filter"
                            options={[
                                { value: "all", label: "All" },
                                { value: "waiting", label: "Waiting" },
                                { value: "called", label: "Called" },
                                { value: "in_consultation", label: "In Consult" },
                            ]}
                            value={state.queueStatusFilter}
                            onChange={(value) => actions.setQueueStatusFilter(value as "all" | "waiting" | "called" | "in_consultation")}
                        />
                    </Space>
                    <Space size={8} wrap>
                        <Typography.Text className={styles.filterLabel}>Urgency</Typography.Text>
                        <Segmented
                            data-testid="queue-urgency-filter"
                            options={[
                                { value: "all", label: "All" },
                                { value: "urgent", label: "Urgent" },
                                { value: "priority", label: "Priority" },
                                { value: "routine", label: "Routine" },
                            ]}
                            value={state.urgencyTabFilter}
                            onChange={(value) => actions.setUrgencyTabFilter(value as "all" | "urgent" | "priority" | "routine")}
                        />
                    </Space>
                </div>
            </Card>

            <section className={styles.liveQueueSection}>
                <div className={styles.liveQueueHeader}>
                    <Typography.Title level={2} className={styles.liveQueueTitle}>
                        Live Queue
                    </Typography.Title>
                    <Typography.Text type="secondary">
                        Showing {state.totalCount} patient{state.totalCount === 1 ? "" : "s"}
                    </Typography.Text>
                </div>

                {state.isLoading ? (
                    <div className={styles.loadingWrap}>
                        <Skeleton active paragraph={{ rows: 3 }} />
                        <Skeleton active paragraph={{ rows: 3 }} />
                    </div>
                ) : state.items.length === 0 ? (
                    <Card className={styles.queueCard}>
                        <Empty description="No queue entries match current filters." />
                    </Card>
                ) : (
                    <div className={styles.queueList}>
                        {state.items.map((item) => (
                            <QueueRow key={item.queueTicketId} item={item} />
                        ))}
                    </div>
                )}
            </section>
        </section>
    );
};

const QueueRow = ({ item }: { item: IClinicianQueueItem }): React.JSX.Element => {
    const { styles } = useClinicianQueueStyles();

    return (
        <article className={`${styles.queueItem} ${getQueueAccentClassName(item.urgencyLevel, styles)}`}>
            <div className={styles.queueNumberBlock}>
                <Typography.Text className={styles.queueNumberLabel}>Queue</Typography.Text>
                <Typography.Text className={styles.queueNumberValue}>{item.queueNumber}</Typography.Text>
            </div>

            <div className={styles.patientBlock}>
                <div className={styles.rowTitleWrap}>
                    <Typography.Title level={4} className={styles.patientName}>
                        {item.patientName}
                    </Typography.Title>
                    <Tag className={getUrgencyClassName(item.urgencyLevel, styles)}>{item.urgencyLevel}</Tag>
                    <Tag className={getStatusClassName(item.queueStatus, styles)}>{item.queueStatus.replace("_", " ")}</Tag>
                </div>
                <Typography.Paragraph className={styles.clinicalPreview}>{buildClinicalPreview(item)}</Typography.Paragraph>
                <div className={styles.detailRow}>
                    <Space size={8}>
                        <ClockCircleOutlined />
                        <span>Waiting {item.waitingMinutes} min</span>
                    </Space>
                    <Space size={8}>
                        <WarningOutlined />
                        <span>Queue stage: {item.currentStage}</span>
                    </Space>
                </div>
            </div>

            <div className={styles.actionPanel}>
                <Link href={`/clinician/review/${item.queueTicketId}`}>
                    <Button className={styles.primaryAction} icon={<EyeOutlined />}>
                        Review
                    </Button>
                </Link>
                <Typography.Text type="secondary">#{item.queueNumber}</Typography.Text>
            </div>
        </article>
    );
};
