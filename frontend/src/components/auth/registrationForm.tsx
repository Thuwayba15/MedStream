"use client";

import { Alert, Button, Card, Form, Input, Radio, Typography } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthActions, useAuthState } from "@/providers/auth";
import { useAuthStyles } from "./style";

type AccountType = "Patient" | "Clinician";
type ProfessionType = "Doctor" | "Nurse" | "AlliedHealth" | "Other";
type RegulatoryBody = "HPCSA" | "SANC" | "Other";
const SOUTH_AFRICAN_PHONE_PATTERN = /^(\+27|0)[6-8][0-9]{8}$/;
const SOUTH_AFRICAN_ID_PATTERN = /^[0-9]{13}$/;
const STRONG_PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

interface RegistrationFormValues {
    firstName: string;
    lastName: string;
    emailAddress: string;
    phoneNumber: string;
    password: string;
    confirmPassword: string;
    idNumber?: string;
    dateOfBirth?: string;
    accountType: AccountType;
    professionType?: ProfessionType;
    regulatoryBody?: RegulatoryBody;
    registrationNumber?: string;
    requestedFacility?: string;
}

export function RegistrationForm(): React.JSX.Element {
    const router = useRouter();
    const { styles } = useAuthStyles();
    const { register, clearError } = useAuthActions();
    const { isPending, errorMessage } = useAuthState();
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const onFinish = async (values: RegistrationFormValues): Promise<void> => {
        clearError();
        setSuccessMessage(null);

        try {
            const payload = await register(values);

            if (values.accountType === "Clinician") {
                setSuccessMessage("Registration complete. Your account is pending admin approval.");
            } else {
                setSuccessMessage("Registration complete. Redirecting to your dashboard.");
            }

            router.replace(payload.homePath);
        } catch {}
    };

    return (
        <main className={styles.page}>
            <Card className={styles.card}>
                <Typography.Title level={1} className={styles.title}>
                    Registration
                </Typography.Title>
                <Typography.Paragraph className={styles.subtitle}>
                    Patients get immediate access. Clinicians stay pending until admin approval.
                </Typography.Paragraph>

                {errorMessage ? (
                    <Alert type="error" title={errorMessage} showIcon style={{ marginBottom: 16 }} />
                ) : null}
                {successMessage ? (
                    <Alert type="success" title={successMessage} showIcon style={{ marginBottom: 16 }} />
                ) : null}

                <Form<RegistrationFormValues>
                    layout="vertical"
                    className={styles.form}
                    onFinish={onFinish}
                    initialValues={{ accountType: "Patient" }}
                >
                    <Form.Item
                        label="Account Type"
                        name="accountType"
                        rules={[{ required: true, message: "Select your role." }]}
                    >
                        <Radio.Group>
                            <Radio value="Patient">Patient</Radio>
                            <Radio value="Clinician">Clinician</Radio>
                        </Radio.Group>
                    </Form.Item>

                    <Form.Item label="First name" name="firstName" rules={[{ required: true, message: "Enter your first name." }]}>
                        <Input placeholder="First name" autoComplete="given-name" />
                    </Form.Item>

                    <Form.Item label="Last name" name="lastName" rules={[{ required: true, message: "Enter your last name." }]}>
                        <Input placeholder="Last name" autoComplete="family-name" />
                    </Form.Item>

                    <Form.Item
                        label="Email"
                        name="emailAddress"
                        rules={[
                            { required: true, message: "Enter your email." },
                            { type: "email", message: "Enter a valid email address." },
                        ]}
                    >
                        <Input placeholder="name@example.com" autoComplete="email" />
                    </Form.Item>

                    <Form.Item
                        label="Phone number"
                        name="phoneNumber"
                        rules={[
                            { required: true, message: "Enter your phone number." },
                            {
                                validator(_, value: string) {
                                    if (!value || SOUTH_AFRICAN_PHONE_PATTERN.test(value)) {
                                        return Promise.resolve();
                                    }

                                    return Promise.reject(new Error("Use a valid South African mobile number, for example 0634113456."));
                                },
                            },
                        ]}
                    >
                        <Input placeholder="+27..." autoComplete="tel" />
                    </Form.Item>

                    <Form.Item
                        label="Password"
                        name="password"
                        rules={[
                            { required: true, message: "Choose a password." },
                            { min: 8, message: "Password must be at least 8 characters." },
                            {
                                validator(_, value: string) {
                                    if (!value || STRONG_PASSWORD_PATTERN.test(value)) {
                                        return Promise.resolve();
                                    }

                                    return Promise.reject(new Error("Password must include upper, lower, and a number."));
                                },
                            },
                        ]}
                    >
                        <Input.Password placeholder="At least 8 characters" autoComplete="new-password" />
                    </Form.Item>

                    <Form.Item
                        label="Confirm password"
                        name="confirmPassword"
                        dependencies={["password"]}
                        rules={[
                            { required: true, message: "Confirm your password." },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue("password") === value) {
                                        return Promise.resolve();
                                    }

                                    return Promise.reject(new Error("Passwords do not match."));
                                },
                            }),
                        ]}
                    >
                        <Input.Password placeholder="Repeat password" autoComplete="new-password" />
                    </Form.Item>

                    <Form.Item
                        label="ID number"
                        name="idNumber"
                        dependencies={["accountType"]}
                        rules={[
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (getFieldValue("accountType") !== "Clinician" || value) {
                                        if (!value || SOUTH_AFRICAN_ID_PATTERN.test(value)) {
                                            return Promise.resolve();
                                        }

                                        return Promise.reject(new Error("ID number must be exactly 13 digits."));
                                    }

                                    return Promise.reject(new Error("ID number is required for clinician registration."));
                                },
                            }),
                        ]}
                    >
                        <Input placeholder="ID number" />
                    </Form.Item>

                    <Form.Item
                        label="Date of birth (optional)"
                        name="dateOfBirth"
                        rules={[
                            {
                                validator(_, value: string) {
                                    if (!value) {
                                        return Promise.resolve();
                                    }

                                    const selectedDate = new Date(value);
                                    const today = new Date();
                                    if (selectedDate <= today) {
                                        return Promise.resolve();
                                    }

                                    return Promise.reject(new Error("Date of birth cannot be in the future."));
                                },
                            },
                        ]}
                    >
                        <Input type="date" />
                    </Form.Item>

                    <Form.Item noStyle shouldUpdate={(previous, current) => previous.accountType !== current.accountType}>
                        {({ getFieldValue }) =>
                            getFieldValue("accountType") === "Clinician" ? (
                                <>
                                    <Form.Item
                                        label="Profession type"
                                        name="professionType"
                                        rules={[{ required: true, message: "Select profession type." }]}
                                    >
                                        <Radio.Group>
                                            <Radio value="Doctor">Doctor</Radio>
                                            <Radio value="Nurse">Nurse</Radio>
                                            <Radio value="AlliedHealth">Allied health</Radio>
                                            <Radio value="Other">Other</Radio>
                                        </Radio.Group>
                                    </Form.Item>

                                    <Form.Item
                                        label="Regulatory body"
                                        name="regulatoryBody"
                                        rules={[{ required: true, message: "Select regulatory body." }]}
                                    >
                                        <Radio.Group>
                                            <Radio value="HPCSA">HPCSA</Radio>
                                            <Radio value="SANC">SANC</Radio>
                                            <Radio value="Other">Other</Radio>
                                        </Radio.Group>
                                    </Form.Item>

                                    <Form.Item
                                        label="Registration number"
                                        name="registrationNumber"
                                        rules={[{ required: true, message: "Enter registration number." }]}
                                    >
                                        <Input placeholder="Registration number" />
                                    </Form.Item>

                                    <Form.Item
                                        label="Requested facility"
                                        name="requestedFacility"
                                        rules={[{ required: true, message: "Enter requested facility." }]}
                                    >
                                        <Input placeholder="Requested facility" />
                                    </Form.Item>
                                </>
                            ) : null
                        }
                    </Form.Item>

                    <Button type="primary" htmlType="submit" loading={isPending} block>
                        Create Account
                    </Button>
                </Form>

                <Typography.Paragraph className={styles.footerText}>
                    Already registered? <Link href="/login">Sign in</Link>
                </Typography.Paragraph>
            </Card>
        </main>
    );
}
