"use client";

import { Skeleton, Tabs } from "antd";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useClinicianWorkspaceShellStyles } from "./workspaceShellStyle";

type TClinicianWorkspaceTabKey = "queue" | "review" | "consultation" | "history";

interface IClinicianWorkspaceShellProps {
    activeKey: TClinicianWorkspaceTabKey;
    reviewQueueTicketId?: number;
    consultationVisitId?: number;
    consultationQueueTicketId?: number;
    historyPatientUserId?: number;
    historyVisitId?: number;
    children: React.ReactNode;
}

export const ClinicianWorkspaceShell = ({
    activeKey,
    reviewQueueTicketId,
    consultationVisitId,
    consultationQueueTicketId,
    historyPatientUserId,
    historyVisitId,
    children,
}: IClinicianWorkspaceShellProps): React.JSX.Element => {
    const { styles } = useClinicianWorkspaceShellStyles();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [pendingKey, setPendingKey] = useState<TClinicianWorkspaceTabKey | null>(null);

    const tabTargets = useMemo(() => {
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

        return items;
    }, [consultationQueueTicketId, consultationVisitId, historyPatientUserId, historyVisitId, reviewQueueTicketId]);

    const tabs = useMemo(
        () =>
            tabTargets.map((item) => ({
                key: item.key,
                label: item.label,
            })),
        [tabTargets]
    );

    const handleTabChange = (nextKey: string): void => {
        const target = tabTargets.find((item) => item.key === nextKey);
        if (!target || target.key === activeKey) {
            return;
        }

        setPendingKey(target.key);
        startTransition(() => {
            router.push(target.href);
        });
    };

    const isShowingLoadingState = isPending || (pendingKey !== null && pendingKey !== activeKey);

    return (
        <section className={styles.page}>
            <section className={styles.tabCard}>
                <Tabs activeKey={activeKey} items={tabs} className={styles.tabs} onChange={handleTabChange} />
                <div className={styles.content}>
                    {isShowingLoadingState ? (
                        <div className={styles.loadingState}>
                            <Skeleton active paragraph={{ rows: 10 }} />
                        </div>
                    ) : (
                        children
                    )}
                </div>
            </section>
        </section>
    );
};
