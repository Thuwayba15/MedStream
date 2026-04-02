"use client";

import { CheckOutlined, ClockCircleOutlined, EyeOutlined, SearchOutlined, TeamOutlined, WarningOutlined } from "@ant-design/icons";
import { Button, Card, Empty, Input, Pagination, Segmented, Skeleton, Space, Tag, Typography } from "antd";
import Link from "next/link";
import { useMemo } from "react";
import { useClinicianToastMessages } from "@/hooks/clinician/useClinicianToastMessages";
import { useMinuteClock } from "@/hooks/clinician/useMinuteClock";
import { useClinicianQueueActions, useClinicianQueueState } from "@/providers/clinician-queue";
import type { IClinicianQueueItem, TUrgencyLevel } from "@/services/queue-operations/types";
import { useClinicianQueueStyles } from "./style";

interface ISummaryCard {
    title: string;
    value: number;
    suffix?: string;
    hint: string;
    icon: React.ReactNode;
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

const getLiveWaitingMinutes = (enteredQueueAt: string, fallbackMinutes: number, now: number): number => {
    const enteredAt = new Date(enteredQueueAt).getTime();
    if (Number.isNaN(enteredAt)) {
        return fallbackMinutes;
    }

    return Math.max(fallbackMinutes, Math.max(0, Math.floor((now - enteredAt) / 60000)));
};

export const ClinicianQueueDashboard = (): React.JSX.Element => {
    const { styles } = useClinicianQueueStyles();
    const state = useClinicianQueueState();
    const actions = useClinicianQueueActions();
    const now = useMinuteClock();
    const toastContext = useClinicianToastMessages([
        {
            type: "error",
            content: state.errorMessage,
            onClose: actions.clearError,
        },
    ]);

    const summaryCards = useMemo<ISummaryCard[]>(
        () => [
            {
                title: "Patients Waiting",
                value: state.summary.waitingCount,
                hint: "In the queue now",
                icon: <TeamOutlined />,
                tone: "neutral",
            },
            {
                title: "Average Wait",
                value: state.summary.averageWaitingMinutes,
                suffix: "m",
                hint: "Across waiting patients",
                icon: <ClockCircleOutlined />,
                tone: "warning",
            },
            {
                title: "Urgent Cases",
                value: state.summary.urgentCount,
                hint: "Needs immediate attention",
                icon: <WarningOutlined />,
                tone: "danger",
            },
            {
                title: "Seen Today",
                value: state.summary.seenTodayCount,
                hint: "Consultations completed",
                icon: <CheckOutlined />,
                tone: "success",
            },
        ],
        [state.summary]
    );

    return (
        <section className={styles.queuePage}>
            {toastContext}

            <div className={styles.summaryGrid}>
                {summaryCards.map((card) => (
                    <Card key={card.title} className={`${styles.summaryCard} ${styles[`summary${card.tone.charAt(0).toUpperCase()}${card.tone.slice(1)}` as keyof typeof styles]}`}>
                        <div className={styles.summaryIconWrap}>{card.icon}</div>
                        <div className={styles.summaryInfo}>
                            <Typography.Text className={styles.summaryLabel}>{card.title}</Typography.Text>
                            <Typography.Title level={3} className={styles.summaryValue}>
                                {card.value}
                                {card.suffix ? <span className={styles.summarySuffix}>{card.suffix}</span> : null}
                            </Typography.Title>
                            <Typography.Text className={styles.summaryHint}>{card.hint}</Typography.Text>
                        </div>
                    </Card>
                ))}
            </div>

            <Card className={styles.filterCard}>
                <div className={styles.filterTopRow}>
                    <Input
                        allowClear
                        size="large"
                        prefix={<SearchOutlined />}
                        placeholder="Search patient name or queue #"
                        value={state.searchText}
                        onChange={(event) => actions.setSearchText(event.target.value)}
                        className={styles.searchInput}
                    />
                    <Space size={8} wrap className={styles.filterGroup}>
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
                    <Space size={8} wrap className={styles.filterGroup}>
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

                {state.isLoading || state.isRefreshing ? (
                    <div className={styles.loadingWrap}>
                        <Skeleton active paragraph={{ rows: 3 }} />
                        <Skeleton active paragraph={{ rows: 3 }} />
                    </div>
                ) : state.items.length === 0 ? (
                    <Card className={styles.queueCard}>
                        <Empty description="No queue entries match current filters." />
                    </Card>
                ) : (
                    <>
                        <div className={styles.queueList}>
                            {state.items.map((item) => (
                                <QueueRow key={item.queueTicketId} item={item} now={now} />
                            ))}
                        </div>
                        <div className={styles.paginationRow}>
                            <Pagination
                                current={state.page}
                                pageSize={state.pageSize}
                                total={state.totalCount}
                                showSizeChanger
                                pageSizeOptions={["8", "12", "20"]}
                                onChange={(page, pageSize) => actions.setPage(page, pageSize)}
                            />
                        </div>
                    </>
                )}
            </section>
        </section>
    );
};

const QueueRow = ({ item, now }: { item: IClinicianQueueItem; now: number }): React.JSX.Element => {
    const { styles } = useClinicianQueueStyles();
    const waitingMinutes = getLiveWaitingMinutes(item.enteredQueueAt, item.waitingMinutes, now);

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
                        <span>Waiting {waitingMinutes} min</span>
                    </Space>
                    <Space size={8}>
                        <WarningOutlined />
                        <span>Queue stage: {item.currentStage}</span>
                    </Space>
                </div>
            </div>

            <div className={styles.actionPanel}>
                <Link href={`/clinician/review/${item.queueTicketId}?patientUserId=${item.patientUserId}&visitId=${item.visitId}`}>
                    <Button className={styles.primaryAction} icon={<EyeOutlined />}>
                        Review
                    </Button>
                </Link>
                <Typography.Text type="secondary">#{item.queueNumber}</Typography.Text>
            </div>
        </article>
    );
};
