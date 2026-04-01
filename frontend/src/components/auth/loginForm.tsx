"use client";

import { Button, Card, Form, Input, Typography } from "antd";
import Image from "next/image";
import Link from "next/link";
import { useLoginForm } from "@/hooks/auth/useLoginForm";
import { useAuthStyles } from "./style";

export const LoginForm = () => {
    const { styles } = useAuthStyles();
    const { form, getFieldError, isPending, formErrorMessage, onFinish } = useLoginForm();

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
                    <div className={styles.mobileBrandBlock}>
                        <Link href="/" className={styles.brandLink} aria-label="Go to landing page">
                            <div className={styles.brand}>
                                <div className={styles.brandMark}>
                                    <Image src="/logo_inverted.png" alt="" width={44} height={44} />
                                </div>
                                <div className={styles.mobileBrandText}>
                                    Med<span className={styles.brandTextAccent}>Stream</span>
                                </div>
                            </div>
                        </Link>
                        <p className={styles.mobileIntro}>Your clinic&apos;s live queue, patient timelines, and AI-assisted documentation all in one place.</p>
                    </div>

                    <Card className={styles.card}>
                        <Typography.Title level={1} className={styles.title}>
                            Login
                        </Typography.Title>

                        <Form form={form} layout="vertical" className={styles.form} onFinish={onFinish}>
                            <Form.Item
                                label="Email Address"
                                name="userNameOrEmailAddress"
                                rules={[{ required: true, message: "Enter your email address." }]}
                                help={getFieldError("userNameOrEmailAddress")}
                                validateStatus={getFieldError("userNameOrEmailAddress") ? "error" : undefined}
                            >
                                <Input placeholder="Enter email" autoComplete="username" aria-label="Email Address" />
                            </Form.Item>

                            <Form.Item
                                label="Password"
                                name="password"
                                rules={[{ required: true, message: "Enter your password." }]}
                                help={getFieldError("password")}
                                validateStatus={getFieldError("password") ? "error" : undefined}
                            >
                                <Input.Password placeholder="Enter password" autoComplete="current-password" aria-label="Password" />
                            </Form.Item>

                            {formErrorMessage ? <Typography.Text className={styles.formErrorText}>{formErrorMessage}</Typography.Text> : null}

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
