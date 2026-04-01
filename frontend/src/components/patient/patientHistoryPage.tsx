"use client";

import { Button, Card, Empty, Skeleton, Tag, Typography, message } from "antd";
import { useEffect, useMemo } from "react";
import { usePatientHistoryActions, usePatientHistoryState } from "@/providers/patient-history";
import type { IPatientTimelineVisit } from "@/services/patient-timeline/types";
import { PatientBottomNav } from "./patientBottomNav";
import { usePatientHistoryStyles } from "./patientHistoryStyle";

const formatDate = (value?: string | null): string => {
    if (!value) {
        return "-";
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleDateString([], { year: "numeric", month: "short", day: "2-digit" });
};

const byNewestVisit = (left: IPatientTimelineVisit, right: IPatientTimelineVisit): number => {
    return new Date(right.visitDate).getTime() - new Date(left.visitDate).getTime();
};

const isPatientSummaryVisit = (visit: IPatientTimelineVisit): boolean => {
    const source = (visit.summarySource || "").trim().toLowerCase();
    const hasPatientSummarySource = source === "finalized_summary" || source === "encounter_note_patient_summary";
    return hasPatientSummarySource && Boolean(visit.summary?.trim());
};

export const PatientHistoryPage = (): React.JSX.Element => {
    const { styles } = usePatientHistoryStyles();
    const state = usePatientHistoryState();
    const actions = usePatientHistoryActions();
    const [messageApi, messageContextHolder] = message.useMessage();

    useEffect(() => {
        void actions.loadTimeline();
    }, [actions]);

    useEffect(() => {
        if (!state.errorMessage) {
            return;
        }

        void messageApi.error(state.errorMessage);
    }, [messageApi, state.errorMessage]);

    const visits = useMemo(() => {
        return [...(state.timeline?.visits ?? [])].filter(isPatientSummaryVisit).sort(byNewestVisit);
    }, [state.timeline?.visits]);

    return (
        <section className={styles.page}>
            {messageContextHolder}
            <PatientBottomNav activeKey="history" hasQueueStatus={false} />

            <Card className={styles.panelCard}>
                <header className={styles.titleBlock}>
                    <Typography.Title level={2} className={styles.title}>
                        Visit History
                    </Typography.Title>
                    <Typography.Text className={styles.subtitle}>Your past interactions across MedStream facilities.</Typography.Text>
                </header>

                {state.isLoadingTimeline && !state.timeline ? (
                    <Card>
                        <Skeleton active paragraph={{ rows: 8 }} />
                    </Card>
                ) : null}

                {!state.isLoadingTimeline ? (
                    state.errorMessage ? (
                        <Card>
                            <Empty description="We couldn't load your visit history right now.">
                                <Button onClick={() => void actions.loadTimeline()}>Try Again</Button>
                            </Empty>
                        </Card>
                    ) : (
                        visits.length === 0 ? (
                            <Card>
                                <Empty description="No finalized visit summaries yet. Completed visits with patient summaries will appear here." />
                            </Card>
                        ) : (
                            <section className={styles.timelineList}>
                                {visits.map((visit) => (
                                    <article key={visit.visitId} className={styles.timelineItem}>
                                        <span className={styles.timelineDot} />
                                        <Card className={styles.visitCard}>
                                            <div className={styles.visitMetaRow}>
                                                <Tag>{formatDate(visit.visitDate)}</Tag>
                                                <Tag color={visit.visitStatus.toLowerCase() === "completed" ? "blue" : "gold"}>{visit.visitStatus}</Tag>
                                            </div>
                                            <Typography.Title level={4} className={styles.visitTitle}>
                                                {visit.title || "Consultation"}
                                            </Typography.Title>
                                            <Typography.Text type="secondary">{visit.facilityName}</Typography.Text>
                                            <Typography.Paragraph className={styles.visitSummary}>{visit.summary}</Typography.Paragraph>
                                        </Card>
                                    </article>
                                ))}
                            </section>
                        )
                    )
                ) : null}
            </Card>

            <Typography.Paragraph className={styles.footNote}>For detailed clinical records or test results, please speak directly with your healthcare provider.</Typography.Paragraph>
        </section>
    );
};
