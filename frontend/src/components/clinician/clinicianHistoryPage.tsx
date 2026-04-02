"use client";

import { Card, Empty, Result, Skeleton, Tag, Typography } from "antd";
import { useEffect, useMemo } from "react";
import { useClinicianToastMessages } from "@/hooks/clinician/useClinicianToastMessages";
import { formatMedstreamDate } from "@/lib/time/medstreamTime";
import { useClinicianConsultationState } from "@/providers/clinician-consultation";
import { useClinicianHistoryActions, useClinicianHistoryState } from "@/providers/clinician-history";
import type { IPatientTimelineVisit } from "@/services/patient-timeline/types";
import { useClinicianHistoryStyles } from "./historyStyle";

interface IClinicianHistoryPageProps {
    patientUserId?: number;
}

const MAX_TIMELINE_SUMMARY_LENGTH = 140;

const byNewestVisit = (left: IPatientTimelineVisit, right: IPatientTimelineVisit): number => {
    return new Date(right.visitDate).getTime() - new Date(left.visitDate).getTime();
};

const hasClinicianSummary = (visit: IPatientTimelineVisit): boolean => {
    return Boolean(visit.summary?.trim());
};

const getVisitStatusDisplay = (visit: IPatientTimelineVisit): { label: string; color: string } => {
    const visitStatus = (visit.visitStatus || "").trim().toLowerCase();

    if (visitStatus === "intakeinprogress" || visitStatus === "inprogress") {
        return { label: "In Progress", color: "gold" };
    }

    return { label: "Completed", color: "blue" };
};

const buildCompactSummary = (summary: string): string => {
    const cleaned = summary.replace(/\s+/g, " ").trim();
    if (cleaned.length <= MAX_TIMELINE_SUMMARY_LENGTH) {
        return cleaned;
    }

    return `${cleaned.slice(0, MAX_TIMELINE_SUMMARY_LENGTH).trimEnd()}...`;
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
        return [...(timelineState.timeline?.visits ?? [])].filter(hasClinicianSummary).sort(byNewestVisit);
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
                <header className={styles.titleBlock}>
                    <Typography.Title level={2} className={styles.title}>
                        {patient.patientName}
                    </Typography.Title>
                    <Typography.Text className={styles.subtitle}>
                        Clinician timeline for Patient #{patient.patientUserId}
                        {activeVisitId ? ` · Active Visit ${activeVisitId}` : ""}
                    </Typography.Text>
                </header>

                <div className={styles.patientHeader}>
                    <Typography.Text className={styles.patientMeta}>
                        {patient.totalVisits} total visit{patient.totalVisits === 1 ? "" : "s"} in MedStream
                    </Typography.Text>
                    <div className={styles.chipRow}>
                        <Tag>Last Visit: {formatMedstreamDate(patient.mostRecentVisitAt)}</Tag>
                        {patient.dateOfBirth ? <Tag>DOB: {formatMedstreamDate(patient.dateOfBirth)}</Tag> : null}
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
                    <Empty description="No clinician summaries are available for this patient yet." />
                ) : (
                    <section className={styles.timelineList}>
                        {visits.map((visit) => {
                            const status = getVisitStatusDisplay(visit);

                            return (
                                <article key={visit.visitId} className={styles.timelineItem}>
                                    <span className={styles.timelineDot} />
                                    <Card className={styles.visitCard}>
                                        <div className={styles.visitMetaRow}>
                                            <Tag>{formatMedstreamDate(visit.visitDate)}</Tag>
                                            <Tag color={status.color}>{status.label}</Tag>
                                            {visit.urgencyLevel ? <Tag color="orange">{visit.urgencyLevel}</Tag> : null}
                                        </div>
                                        <Typography.Title level={4} className={styles.visitTitle}>
                                            {visit.title || "Consultation"}
                                        </Typography.Title>
                                        <Typography.Text type="secondary">{visit.facilityName}</Typography.Text>
                                        <Typography.Paragraph className={styles.summaryText}>{buildCompactSummary(visit.summary)}</Typography.Paragraph>
                                    </Card>
                                </article>
                            );
                        })}
                    </section>
                )}
            </Card>
        </section>
    );
};
