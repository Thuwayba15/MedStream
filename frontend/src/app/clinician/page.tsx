"use client";

import { LogoutButton } from "@/components/auth/logoutButton";
import { useAuthStyles } from "@/components/auth/style";
import { Card, Space, Typography } from "antd";

export default function ClinicianHomePage(): React.JSX.Element {
    const { styles } = useAuthStyles();

    return (
        <main className={styles.dashboardPage}>
            <div className={styles.dashboardShell}>
                <Card className={styles.dashboardCard}>
                    <Space orientation="vertical" size={16}>
                        <Typography.Title level={1} className={styles.dashboardHeading}>
                            Clinician Workspace
                        </Typography.Title>
                        <Typography.Paragraph className={styles.dashboardText}>Your clinician account is approved. Clinical workflows are now accessible.</Typography.Paragraph>
                        <LogoutButton />
                    </Space>
                </Card>
            </div>
        </main>
    );
}
