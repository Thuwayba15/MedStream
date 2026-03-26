"use client";

import { Alert, Button, Card, Form, Input, Typography } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthActions, useAuthState } from "@/providers/auth";
import { useAuthStyles } from "./style";

interface LoginFormValues {
    userNameOrEmailAddress: string;
    password: string;
}

export function LoginForm(): React.JSX.Element {
    const router = useRouter();
    const { styles } = useAuthStyles();
    const { login, clearError } = useAuthActions();
    const { isPending, errorMessage } = useAuthState();

    const onFinish = async (values: LoginFormValues): Promise<void> => {
        clearError();

        try {
            const payload = await login(values);
            router.replace(payload.homePath);
        } catch {}
    };

    return (
        <main className={styles.page}>
            <Card className={styles.card}>
                <Typography.Title level={1} className={styles.title}>
                    Login
                </Typography.Title>
                <Typography.Paragraph className={styles.subtitle}>
                    Access MedStream using your username or email.
                </Typography.Paragraph>

                {errorMessage ? (
                    <Alert
                        type="error"
                        title={errorMessage}
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                ) : null}

                <Form<LoginFormValues> layout="vertical" className={styles.form} onFinish={onFinish}>
                    <Form.Item
                        label="Username or Email"
                        name="userNameOrEmailAddress"
                        rules={[{ required: true, message: "Enter your username or email." }]}
                    >
                        <Input placeholder="admin or admin@defaulttenant.com" autoComplete="username" />
                    </Form.Item>

                    <Form.Item
                        label="Password"
                        name="password"
                        rules={[{ required: true, message: "Enter your password." }]}
                    >
                        <Input.Password placeholder="Enter password" autoComplete="current-password" />
                    </Form.Item>

                    <Button type="primary" htmlType="submit" loading={isPending} block>
                        Sign In
                    </Button>
                </Form>

                <Typography.Paragraph className={styles.footerText}>
                    New to MedStream? <Link href="/registration">Create your account</Link>
                </Typography.Paragraph>
            </Card>
        </main>
    );
}
