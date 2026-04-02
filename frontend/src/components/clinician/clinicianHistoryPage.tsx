"use client";

import { Card, Empty, Result, Skeleton, Space, Tag, Typography } from "antd";
import { useEffect, useMemo } from "react";
import { useClinicianToastMessages } from "@/hooks/clinician/useClinicianToastMessages";
import { useClinicianConsultationState } from "@/providers/clinician-consultation";
import { useClinicianHistoryActions, useClinicianHistoryState } from "@/providers/clinician-history";
import type { IPatientTimelineVisit } from "@/services/patient-timeline/types";
import { useClinicianHistoryStyles } from "./historyStyle";

interface IClinicianHistoryPageProps {
    patientUserId?: number;
}

const formatDate = (value?: string | null): string => {
    if (!value) {
        return "-";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString("en-ZA", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Johannesburg",
    });
};

const byNewestVisit = (left: IPatientTimelineVisit, right: IPatientTimelineVisit): number => {
    return new Date(right.visitDate).getTime() - new Date(left.visitDate).getTime();
};

export const ClinicianHistoryPage = ({ patientUserId }: IClinicianHistoryPageProps): React.JSX.Element => {
    const { styles } = useClinicianHistoryStyles();
    const consultationState = useClinicianConsultationState();
    const timelineState = useClinicianHistoryState();
    const timelineActions = useClinicianHistoryActions();
    const activePatientUserId = patientUserId ?? consultationState.workspace?.patientContext.patientUserId ?? consultationState.review?.patientUserId;
    const activeVisitId = consultationState.workspace?.visitId ?? consultationState.review?.visitId;
    const unauthorized = /access|authorize|authoriz|forbidden|permission/i.test(timelineState.errorMessage ?? "");
    const toastContext = useClinicianToastMessages([
        {
            type: "error",
            content: unauthorized ? null : timelineState.errorMessage,
        },
    ]);

    useEffect(() => {
        if (activePatientUserId && activePatientUserId > 0) {
            void timelineActions.loadTimeline(activePatientUserId);
            return;
        }

        timelineActions.clearTimeline();
    }, [activePatientUserId, timelineActions]);

    const visits = useMemo(() => {
        return [...(timelineState.timeline?.visits ?? [])].sort(byNewestVisit);
    }, [timelineState.timeline?.visits]);

    if (!activePatientUserId) {
        return (
            <Card className={styles.sectionCard}>
                <Empty description="Open a patient in triage review or consultation to view their timeline here." />
            </Card>
        );
    }

    if (timelineState.isLoadingTimeline && !timelineState.timeline) {
        return (
            <Card className={styles.sectionCard}>
                <Skeleton active paragraph={{ rows: 10 }} />
            </Card>
        );
    }

    if (timelineState.errorMessage && unauthorized) {
        return (
            <Card className={styles.sectionCard}>
                <Result status="403" title="Timeline Access Blocked" subTitle="You do not currently have permission to view this patient timeline." />
            </Card>
        );
    }

    if (!timelineState.timeline) {
        return (
            <Card className={styles.sectionCard}>
                {toastContext}
                <Empty description="No timeline data available for this patient yet." />
            </Card>
        );
    }

    const patient = timelineState.timeline.patient;

    return (
        <section className={styles.page}>
            {toastContext}
            <Card className={styles.sectionCard}>
                <div className={styles.patientHeader}>
                    <Typography.Title level={3} className={styles.patientName}>
                        {patient.patientName}
                    </Typography.Title>
                    <Typography.Text className={styles.patientMeta}>
                        Patient #{patient.patientUserId} {activeVisitId ? `· Active Visit ${activeVisitId}` : ""} · {patient.totalVisits} total visits
                    </Typography.Text>
                    <div className={styles.chipRow}>
                        <Tag>Last Visit: {formatDate(patient.mostRecentVisitAt)}</Tag>
                        {patient.dateOfBirth ? <Tag>DOB: {formatDate(patient.dateOfBirth)}</Tag> : null}
                        {patient.idNumber ? <Tag>ID: {patient.idNumber}</Tag> : null}
                    </div>
                </div>
            </Card>

            <Card
                className={styles.sectionCard}
                title={
                    <Typography.Title level={4} className={styles.listCardTitle}>
                        Visit History
                    </Typography.Title>
                }
            >
                {visits.length === 0 ? (
                    <Empty description="No visits available." />
                ) : (
                    <section className={styles.timelineList}>
                        {visits.map((visit) => (
                            <article key={visit.visitId} className={styles.timelineItem}>
                                <span className={styles.timelineDot} />
                                <Card className={styles.visitCard}>
                                    <div className={styles.visitTopRow}>
                                        <Typography.Text className={styles.eventMeta}>{formatDate(visit.visitDate)}</Typography.Text>
                                        <Space size={6} wrap>
                                            <Tag>{visit.visitStatus}</Tag>
                                            <Tag>{visit.facilityName}</Tag>
                                            {visit.urgencyLevel ? <Tag color="orange">{visit.urgencyLevel}</Tag> : null}
                                        </Space>
                                    </div>
                                    <div>
                                        <Typography.Title level={5} className={styles.visitTitle}>
                                            {visit.title || "Consultation Summary"}
                                        </Typography.Title>
                                    </div>
                                    <Typography.Paragraph className={styles.summaryText}>{visit.summary || "No clinician summary was captured for this visit."}</Typography.Paragraph>
                                </Card>
                            </article>
                        ))}
                    </section>
                )}
            </Card>
        </section>
    );
};
