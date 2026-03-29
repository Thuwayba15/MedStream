"use client";

import { useAuthStyles } from "@/components/auth/style";
import { RoleAppShell } from "@/components/layout/roleAppShell";
import { Card, Space, Typography } from "antd";

const ClinicianHomePage = () => {
    const { styles } = useAuthStyles();

    return (
        <RoleAppShell roleLabel="Clinician" activeKey="clinician-workspace" items={[{ key: "clinician-workspace", label: "Workspace", href: "/clinician" }]}>
            <Card className={styles.dashboardCard}>
                <Space orientation="vertical" size={16}>
                    <Typography.Title level={1} className={styles.dashboardHeading}>
                        Clinician Workspace
                    </Typography.Title>
                    <Typography.Paragraph className={styles.dashboardText}>Your clinician account is approved. Clinical workflows are now accessible.</Typography.Paragraph>
                </Space>
            </Card>
        </RoleAppShell>
    );
};

export default ClinicianHomePage;
