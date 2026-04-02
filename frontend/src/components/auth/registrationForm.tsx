"use client";

import { Button, Card, Form, Input, Radio, Select, Typography } from "antd";
import Image from "next/image";
import Link from "next/link";
import { useRegistrationForm } from "@/hooks/auth/useRegistrationForm";
import { getDateOfBirthRule, getPasswordStrengthRule, getPhoneNumberRule, getRegistrationNumberRule, validateClinicianIdNumber, validateIdNumber } from "@/lib/auth/forms";
import { useAuthStyles } from "./style";
import type { RegistrationFormValues } from "@/lib/auth/forms";

export const RegistrationForm = () => {
    const { styles } = useAuthStyles();
    const { accountType, facilityLoadError, facilityOptions, form, formErrorMessage, getFieldError, isLoadingFacilities, isPending, onFinish } = useRegistrationForm();

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
                            Join the <span className={styles.leftTitleAccent}>care flow.</span>
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
                        <p className={styles.mobileIntro}>Create your MedStream account to join the queue, care, and documentation workflow.</p>
                    </div>

                    <Card className={styles.card}>
                        <Typography.Title level={1} className={styles.title}>
                            Registration
                        </Typography.Title>

                        <Form<RegistrationFormValues> form={form} layout="vertical" className={styles.form} onFinish={onFinish} initialValues={{ accountType: "Patient" }}>
                            <Form.Item
                                label="Account Type"
                                name="accountType"
                                rules={[{ required: true, message: "Select your role." }]}
                                help={getFieldError("accountType")}
                                validateStatus={getFieldError("accountType") ? "error" : undefined}
                            >
                                <Radio.Group>
                                    <Radio className={styles.choiceChip} value="Patient">
                                        Patient
                                    </Radio>
                                    <Radio className={styles.choiceChip} value="Clinician">
                                        Clinician
                                    </Radio>
                                </Radio.Group>
                            </Form.Item>

                            <Form.Item
                                label="First name"
                                name="firstName"
                                rules={[{ required: true, message: "Enter your first name." }]}
                                help={getFieldError("firstName")}
                                validateStatus={getFieldError("firstName") ? "error" : undefined}
                            >
                                <Input placeholder="First name" autoComplete="given-name" />
                            </Form.Item>

                            <Form.Item
                                label="Last name"
                                name="lastName"
                                rules={[{ required: true, message: "Enter your last name." }]}
                                help={getFieldError("lastName")}
                                validateStatus={getFieldError("lastName") ? "error" : undefined}
                            >
                                <Input placeholder="Last name" autoComplete="family-name" />
                            </Form.Item>

                            <Form.Item
                                label="Email"
                                name="emailAddress"
                                rules={[
                                    { required: true, message: "Enter your email." },
                                    { type: "email", message: "Enter a valid email address." },
                                ]}
                                help={getFieldError("emailAddress")}
                                validateStatus={getFieldError("emailAddress") ? "error" : undefined}
                            >
                                <Input placeholder="name@example.com" autoComplete="email" />
                            </Form.Item>

                            <Form.Item
                                label="Phone number"
                                name="phoneNumber"
                                rules={[{ required: true, message: "Enter your phone number." }, getPhoneNumberRule()]}
                                help={getFieldError("phoneNumber")}
                                validateStatus={getFieldError("phoneNumber") ? "error" : undefined}
                            >
                                <Input placeholder="+27..." autoComplete="tel" />
                            </Form.Item>

                            <Form.Item
                                label="Password"
                                name="password"
                                rules={[{ required: true, message: "Choose a password." }, { min: 8, message: "Password must be at least 8 characters." }, getPasswordStrengthRule()]}
                                help={getFieldError("password")}
                                validateStatus={getFieldError("password") ? "error" : undefined}
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
                                help={getFieldError("confirmPassword")}
                                validateStatus={getFieldError("confirmPassword") ? "error" : undefined}
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
                                            if (getFieldValue("accountType") === "Clinician") {
                                                return validateClinicianIdNumber(_, value);
                                            }

                                            return validateIdNumber(_, value);
                                        },
                                    }),
                                ]}
                                help={getFieldError("idNumber")}
                                validateStatus={getFieldError("idNumber") ? "error" : undefined}
                            >
                                <Input placeholder="ID number" />
                            </Form.Item>

                            <Form.Item
                                label="Date of birth (optional)"
                                name="dateOfBirth"
                                rules={[getDateOfBirthRule()]}
                                help={getFieldError("dateOfBirth")}
                                validateStatus={getFieldError("dateOfBirth") ? "error" : undefined}
                            >
                                <Input type="date" />
                            </Form.Item>

                            {accountType === "Clinician" ? (
                                <>
                                    <Form.Item
                                        label="Profession type"
                                        name="professionType"
                                        rules={[{ required: true, message: "Select profession type." }]}
                                        help={getFieldError("professionType")}
                                        validateStatus={getFieldError("professionType") ? "error" : undefined}
                                    >
                                        <Radio.Group>
                                            <Radio className={styles.choiceChip} value="Doctor">
                                                Doctor
                                            </Radio>
                                            <Radio className={styles.choiceChip} value="Nurse">
                                                Nurse
                                            </Radio>
                                            <Radio className={styles.choiceChip} value="AlliedHealth">
                                                Allied health
                                            </Radio>
                                            <Radio className={styles.choiceChip} value="Other">
                                                Other
                                            </Radio>
                                        </Radio.Group>
                                    </Form.Item>

                                    <Form.Item
                                        label="Regulatory body"
                                        name="regulatoryBody"
                                        rules={[{ required: true, message: "Select regulatory body." }]}
                                        help={getFieldError("regulatoryBody")}
                                        validateStatus={getFieldError("regulatoryBody") ? "error" : undefined}
                                    >
                                        <Radio.Group>
                                            <Radio className={styles.choiceChip} value="HPCSA">
                                                HPCSA
                                            </Radio>
                                            <Radio className={styles.choiceChip} value="SANC">
                                                SANC
                                            </Radio>
                                            <Radio className={styles.choiceChip} value="Other">
                                                Other
                                            </Radio>
                                        </Radio.Group>
                                    </Form.Item>

                                    <Form.Item
                                        label="Registration number"
                                        name="registrationNumber"
                                        rules={[{ required: true, message: "Enter registration number." }, getRegistrationNumberRule()]}
                                        help={getFieldError("registrationNumber")}
                                        validateStatus={getFieldError("registrationNumber") ? "error" : undefined}
                                    >
                                        <Input placeholder="Registration number" />
                                    </Form.Item>

                                    <Form.Item
                                        label="Requested facility"
                                        name="requestedFacilityId"
                                        rules={[{ required: true, message: "Select requested facility." }]}
                                        help={getFieldError("requestedFacilityId")}
                                        validateStatus={getFieldError("requestedFacilityId") ? "error" : undefined}
                                    >
                                        <Select placeholder="Select requested facility" loading={isLoadingFacilities} options={facilityOptions} />
                                    </Form.Item>
                                </>
                            ) : null}

                            {facilityLoadError ? <Typography.Text className={styles.formErrorText}>{facilityLoadError}</Typography.Text> : null}
                            {formErrorMessage ? <Typography.Text className={styles.formErrorText}>{formErrorMessage}</Typography.Text> : null}

                            <Button type="primary" htmlType="submit" loading={isPending} block className={styles.submitButton}>
                                Create Account
                            </Button>
                        </Form>

                        <Typography.Paragraph className={styles.footerText}>
                            Already registered? <Link href="/login">Sign in</Link>
                        </Typography.Paragraph>
                    </Card>
                </section>
            </div>
        </main>
    );
};
