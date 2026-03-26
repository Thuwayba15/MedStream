"use client";

import { useAuthStyles } from "@/components/auth/style";
import { RoleAppShell } from "@/components/layout/roleAppShell";
import { Card, Space, Typography } from "antd";

export default function PatientHomePage(): React.JSX.Element {
    const { styles } = useAuthStyles();

    return (
        <RoleAppShell roleLabel="Patient" activeKey="patient-portal" items={[{ key: "patient-portal", label: "Portal", href: "/patient" }]}>
            <Card className={styles.dashboardCard}>
                <Space orientation="vertical" size={16}>
                    <Typography.Title level={1} className={styles.dashboardHeading}>
                        Patient Portal
                    </Typography.Title>
                    <Typography.Paragraph className={styles.dashboardText}>You are authenticated as a patient and have immediate access.</Typography.Paragraph>
                </Space>
            </Card>
        </RoleAppShell>
    );
}
