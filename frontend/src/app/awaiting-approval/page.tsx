"use client";

import { LogoutButton } from "@/components/auth/logoutButton";
import { useAuthStyles } from "@/components/auth/style";
import { Alert, Button, Card, Space, Typography } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthActions } from "@/providers/auth";

const AwaitingApprovalPage = () => {
    const { styles } = useAuthStyles();
    const router = useRouter();
    const { getCurrentHomePath } = useAuthActions();
    const [isChecking, setIsChecking] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const checkApproval = async (): Promise<void> => {
        setIsChecking(true);
        setErrorMessage(null);

        try {
            const homePath = await getCurrentHomePath();
            router.replace(homePath);
            router.refresh();
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Unable to check current approval status.");
        } finally {
            setIsChecking(false);
        }
    };

    return (
        <main className={styles.dashboardPage}>
            <div className={styles.dashboardShell}>
                <Card className={styles.dashboardCard}>
                    <Space orientation="vertical" size={16}>
                        <Typography.Title level={1} className={styles.dashboardHeading}>
                            Awaiting Approval
                        </Typography.Title>
                        <Typography.Paragraph className={styles.dashboardText}>Your clinician application is pending admin approval. You can refresh status anytime.</Typography.Paragraph>

                        {errorMessage ? <Alert type="error" title={errorMessage} showIcon /> : null}

                        <Space wrap>
                            <Button type="primary" loading={isChecking} onClick={() => void checkApproval()}>
                                Refresh Approval Status
                            </Button>
                            <LogoutButton />
                        </Space>
                    </Space>
                </Card>
            </div>
        </main>
    );
};

export default AwaitingApprovalPage;
