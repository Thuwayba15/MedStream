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
    children: React.ReactNode;
}

export const ClinicianWorkspaceShell = ({ activeKey, title, subtitle, extra, reviewQueueTicketId, children }: IClinicianWorkspaceShellProps): React.JSX.Element => {
    const { styles } = useClinicianWorkspaceShellStyles();

    const tabs = useMemo(() => {
        const items: Array<{ key: TClinicianWorkspaceTabKey; label: string; href: string }> = [
            { key: "queue", label: "Queue Dashboard", href: "/clinician" },
            ...(reviewQueueTicketId ? [{ key: "review" as const, label: "Triage Review", href: `/clinician/review/${reviewQueueTicketId}` }] : []),
            { key: "consultation", label: "Consultation", href: "/clinician/consultation" },
            { key: "history", label: "Patient Timeline", href: "/clinician/history" },
        ];

        return items.map((item) => ({
            key: item.key,
            label: (
                <Link href={item.href} className={styles.tabLink}>
                    {item.label}
                </Link>
            ),
        }));
    }, [reviewQueueTicketId, styles.tabLink]);

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
