"use client";

import { Tabs, Typography } from "antd";
import Link from "next/link";
import { useMemo } from "react";
import { useClinicianWorkspaceShellStyles } from "./workspaceShellStyle";

type TClinicianWorkspaceTabKey = "queue" | "review" | "consultation" | "history";

interface IClinicianWorkspaceShellProps {
    activeKey: TClinicianWorkspaceTabKey;
    title: string;
    subtitle: string;
    extra?: React.ReactNode;
    reviewQueueTicketId?: number;
    consultationVisitId?: number;
    consultationQueueTicketId?: number;
    historyPatientUserId?: number;
    historyVisitId?: number;
    children: React.ReactNode;
}

export const ClinicianWorkspaceShell = ({
    activeKey,
    title,
    subtitle,
    extra,
    reviewQueueTicketId,
    consultationVisitId,
    consultationQueueTicketId,
    historyPatientUserId,
    historyVisitId,
    children,
}: IClinicianWorkspaceShellProps): React.JSX.Element => {
    const { styles } = useClinicianWorkspaceShellStyles();

    const tabs = useMemo(() => {
        const consultationQuery = new URLSearchParams();
        if (consultationVisitId && consultationVisitId > 0) {
            consultationQuery.set("visitId", String(consultationVisitId));
        }
        if (consultationQueueTicketId && consultationQueueTicketId > 0) {
            consultationQuery.set("queueTicketId", String(consultationQueueTicketId));
        }

        const historyQuery = new URLSearchParams();
        if (historyPatientUserId && historyPatientUserId > 0) {
            historyQuery.set("patientUserId", String(historyPatientUserId));
        }
        if (historyVisitId && historyVisitId > 0) {
            historyQuery.set("visitId", String(historyVisitId));
        }

        const consultationHref = consultationQuery.toString() ? `/clinician/consultation?${consultationQuery.toString()}` : "/clinician/consultation";
        const historyHref = historyQuery.toString() ? `/clinician/history?${historyQuery.toString()}` : "/clinician/history";

        const items: Array<{ key: TClinicianWorkspaceTabKey; label: string; href: string }> = [
            { key: "queue", label: "Queue Dashboard", href: "/clinician" },
            ...(reviewQueueTicketId ? [{ key: "review" as const, label: "Triage Review", href: `/clinician/review/${reviewQueueTicketId}` }] : []),
            { key: "consultation", label: "Consultation", href: consultationHref },
            { key: "history", label: "Patient Timeline", href: historyHref },
        ];

        return items.map((item) => ({
            key: item.key,
            label: (
                <Link href={item.href} className={styles.tabLink}>
                    {item.label}
                </Link>
            ),
        }));
    }, [consultationQueueTicketId, consultationVisitId, historyPatientUserId, historyVisitId, reviewQueueTicketId, styles.tabLink]);

    return (
        <section className={styles.page}>
            <header className={styles.header}>
                <div>
                    <Typography.Title level={1} className={styles.title}>
                        {title}
                    </Typography.Title>
                    <Typography.Text className={styles.subtitle}>{subtitle}</Typography.Text>
                </div>
                {extra ? <div className={styles.extra}>{extra}</div> : null}
            </header>

            <section className={styles.tabCard}>
                <Tabs activeKey={activeKey} items={tabs} className={styles.tabs} />
                <div className={styles.content}>{children}</div>
            </section>
        </section>
    );
};
