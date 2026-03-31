"use client";

import { Tabs, Typography } from "antd";
import Link from "next/link";
import { useMemo } from "react";
import { useClinicianWorkspaceShellStyles } from "./workspaceShellStyle";

type TClinicianWorkspaceTabKey = "queue" | "consultation" | "history";

interface IClinicianWorkspaceShellProps {
    activeKey: TClinicianWorkspaceTabKey;
    title: string;
    subtitle: string;
    extra?: React.ReactNode;
    children: React.ReactNode;
}

const TAB_CONFIG: Array<{ key: TClinicianWorkspaceTabKey; label: string; href: string }> = [
    { key: "queue", label: "Queue Dashboard", href: "/clinician" },
    { key: "consultation", label: "Consultation", href: "/clinician/consultation" },
    { key: "history", label: "Patient Timeline", href: "/clinician/history" },
];

export const ClinicianWorkspaceShell = ({ activeKey, title, subtitle, extra, children }: IClinicianWorkspaceShellProps): React.JSX.Element => {
    const { styles } = useClinicianWorkspaceShellStyles();

    const tabs = useMemo(
        () =>
            TAB_CONFIG.map((item) => ({
                key: item.key,
                label: <Link href={item.href}>{item.label}</Link>,
            })),
        []
    );

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
