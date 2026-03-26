"use client";

import { LogoutButton } from "@/components/auth/logoutButton";
import { useAuthStyles } from "@/components/auth/style";
import { Card, Space, Typography } from "antd";

export default function PatientHomePage(): React.JSX.Element {
    const { styles } = useAuthStyles();

    return (
        <main className={styles.dashboardPage}>
            <div className={styles.dashboardShell}>
                <Card className={styles.dashboardCard}>
                    <Space orientation="vertical" size={16}>
                        <Typography.Title level={1} className={styles.dashboardHeading}>
                            Patient Portal
                        </Typography.Title>
                        <Typography.Paragraph className={styles.dashboardText}>
                            You are authenticated as a patient and have immediate access.
                        </Typography.Paragraph>
                        <LogoutButton />
                    </Space>
                </Card>
            </div>
        </main>
    );
}
