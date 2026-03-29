"use client";

import { Alert, Button, Card, Form, Input, Typography } from "antd";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthActions, useAuthState } from "@/providers/auth";
import { useAuthStyles } from "./style";

interface LoginFormValues {
    userNameOrEmailAddress: string;
    password: string;
}

export const LoginForm = () => {
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
            <div className={styles.layout}>
                <section className={styles.panelLeft}>
                    <Link href="/" className={styles.brandLink} aria-label="Go to landing page">
                        <div className={styles.brand}>
                            <div className={styles.brandMark}>
                                <Image src="/logo_inverted.png" alt="" width={54} height={54} />
                            </div>
                            <div className={styles.brandText}>
                                Med<span className={styles.brandTextAccent}>Stream</span>
                            </div>
                        </div>
                    </Link>

                    <div>
                        <p className={styles.eyebrow}>South African Public Healthcare</p>
                        <h2 className={styles.leftTitle}>
                            Care that flows <span className={styles.leftTitleAccent}>forward.</span>
                        </h2>
                        <p className={styles.leftText}>Your clinic&apos;s live queue, patient timelines, and AI-assisted documentation all in one place.</p>
                    </div>
                </section>

                <section className={styles.panelRight}>
                    <Card className={styles.card}>
                        <Typography.Title level={1} className={styles.title}>
                            Login
                        </Typography.Title>
                        <Typography.Paragraph className={styles.subtitle}>Sign in to your clinic account.</Typography.Paragraph>

                        {errorMessage ? <Alert type="error" title={errorMessage} showIcon className={styles.alertBlock} /> : null}

                        <Form<LoginFormValues> layout="vertical" className={styles.form} onFinish={onFinish}>
                            <Form.Item label="Username or Email" name="userNameOrEmailAddress" rules={[{ required: true, message: "Enter your username or email." }]}>
                                <Input placeholder="admin or admin@defaulttenant.com" autoComplete="username" />
                            </Form.Item>

                            <Form.Item label="Password" name="password" rules={[{ required: true, message: "Enter your password." }]}>
                                <Input.Password placeholder="Enter password" autoComplete="current-password" />
                            </Form.Item>

                            <Button type="primary" htmlType="submit" loading={isPending} block className={styles.submitButton}>
                                Sign In
                            </Button>
                        </Form>

                        <Typography.Paragraph className={styles.footerText}>
                            New to MedStream? <Link href="/registration">Create your account</Link>
                        </Typography.Paragraph>
                    </Card>
                </section>
            </div>
        </main>
    );
};
