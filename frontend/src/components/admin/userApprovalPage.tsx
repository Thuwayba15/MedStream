"use client";

import { LogoutButton } from "@/components/auth/logoutButton";
import { useAuthStyles } from "@/components/auth/style";
import { useAdminStyles } from "@/components/admin/style";
import { Alert, Button, Empty, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";

interface UserRow {
    id: number;
    userName: string;
    name: string;
    surname: string;
    emailAddress: string;
    roleNames: string[];
    requestedRegistrationRole: string | null;
    isClinicianApprovalPending: boolean;
    accountType: string | null;
    professionType: string | null;
    regulatoryBody: string | null;
    registrationNumber: string | null;
    requestedFacility: string | null;
    approvalStatus: string | null;
    idNumber: string | null;
    phoneNumber: string | null;
    clinicianSubmittedAt: string | null;
    authState: "admin" | "clinician_approved" | "clinician_pending_approval" | "patient";
    isActive: boolean;
}

interface UsersApiResponse {
    users: UserRow[];
    message?: string;
}

export function UserApprovalPage(): React.JSX.Element {
    const { styles } = useAuthStyles();
    const { styles: adminStyles } = useAdminStyles();
    const [users, setUsers] = useState<UserRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [approvingUserIds, setApprovingUserIds] = useState<number[]>([]);

    const loadUsers = async (): Promise<void> => {
        setIsLoading(true);
        setErrorMessage(null);

        try {
            const response = await fetch("/api/auth/admin/users");
            const payload = (await response.json()) as UsersApiResponse;
            if (!response.ok || !payload.users) {
                throw new Error(payload.message ?? "Failed to load users.");
            }

            setUsers(payload.users);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Failed to load users.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadUsers();
    }, []);

    const approveClinician = async (userId: number): Promise<void> => {
        setApprovingUserIds((previous) => [...previous, userId]);
        setActionMessage(null);
        setErrorMessage(null);

        try {
            const response = await fetch("/api/auth/admin/approve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });
            const payload = (await response.json()) as { message?: string };
            if (!response.ok) {
                throw new Error(payload.message ?? "Unable to approve clinician.");
            }

            setActionMessage("Clinician approved successfully.");
            await loadUsers();
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Unable to approve clinician.");
        } finally {
            setApprovingUserIds((previous) => previous.filter((id) => id !== userId));
        }
    };

    const columns: ColumnsType<UserRow> = [
        {
            title: "User",
            key: "user",
            render: (_, row) => (
                <Space orientation="vertical" size={0}>
                    <Typography.Text strong>{`${row.name} ${row.surname}`}</Typography.Text>
                    <Typography.Text type="secondary">{row.userName}</Typography.Text>
                </Space>
            ),
        },
        {
            title: "Contact",
            key: "contact",
            render: (_, row) => (
                <Space orientation="vertical" size={0} className={adminStyles.secondaryTextStack}>
                    <Typography.Text>{row.emailAddress}</Typography.Text>
                    <Typography.Text type="secondary">{row.phoneNumber || "-"}</Typography.Text>
                    <Typography.Text type="secondary">{row.idNumber || "-"}</Typography.Text>
                </Space>
            ),
        },
        {
            title: "Application",
            key: "application",
            render: (_, row) => (
                <Space orientation="vertical" size={0} className={adminStyles.secondaryTextStack}>
                    <Typography.Text>{row.professionType || "-"}</Typography.Text>
                    <Typography.Text type="secondary">{row.regulatoryBody || "-"}</Typography.Text>
                    <Typography.Text type="secondary">{row.registrationNumber || "-"}</Typography.Text>
                    <Typography.Text type="secondary">{row.requestedFacility || "-"}</Typography.Text>
                </Space>
            ),
        },
        {
            title: "Submitted",
            key: "submitted",
            render: (_, row) => (
                <Typography.Text type="secondary">
                    {row.clinicianSubmittedAt ? new Date(row.clinicianSubmittedAt).toLocaleString() : "-"}
                </Typography.Text>
            ),
        },
        {
            title: "Status",
            key: "status",
            render: (_, row) => (
                <Space wrap>
                    <Tag className={adminStyles.stateTag} color={row.authState === "clinician_pending_approval" ? "gold" : "blue"}>
                        {row.authState}
                    </Tag>
                    <Tag className={adminStyles.statusTag} color={row.approvalStatus === "PendingApproval" ? "gold" : "green"}>
                        {row.approvalStatus || "Approved"}
                    </Tag>
                </Space>
            ),
        },
        {
            title: "Roles",
            key: "roles",
            render: (_, row) => (
                <Space wrap>
                    {row.roleNames.length === 0 ? <Tag>None</Tag> : row.roleNames.map((role) => <Tag key={role}>{role}</Tag>)}
                </Space>
            ),
        },
        {
            title: "Action",
            key: "action",
            render: (_, row) =>
                row.isClinicianApprovalPending ? (
                    <Button
                        type="primary"
                        loading={approvingUserIds.includes(row.id)}
                        onClick={() => {
                            void approveClinician(row.id);
                        }}
                    >
                        Approve clinician
                    </Button>
                ) : (
                    <Tag color="green">No action required</Tag>
                ),
        },
    ];

    const pendingCount = users.filter((row) => row.isClinicianApprovalPending).length;

    return (
        <main className={styles.dashboardPage}>
            <div className={styles.dashboardShell}>
                <section className={styles.dashboardCard}>
                    <div className={adminStyles.headerRow}>
                        <div>
                            <Typography.Title level={1} className={styles.dashboardHeading}>
                                Admin User Management
                            </Typography.Title>
                            <Typography.Paragraph className={styles.dashboardText}>
                                Review user states and approve clinician applicants.
                            </Typography.Paragraph>
                            <Typography.Text className={adminStyles.headingHint}>
                                Approve clinician applicants to activate clinician access.
                            </Typography.Text>
                        </div>
                        <div className={adminStyles.headerActions}>
                            <Tag className={adminStyles.pendingBadge} color={pendingCount > 0 ? "gold" : "green"}>
                                {pendingCount} pending approvals
                            </Tag>
                            <LogoutButton />
                        </div>
                    </div>
                </section>

                {actionMessage ? <Alert type="success" title={actionMessage} showIcon /> : null}
                {errorMessage ? <Alert type="error" title={errorMessage} showIcon /> : null}

                <section className={`${styles.dashboardCard} ${adminStyles.tableCard}`}>
                    <div className={adminStyles.tableWrap}>
                        <Table<UserRow>
                            rowKey="id"
                            loading={isLoading}
                            columns={columns}
                            dataSource={users}
                            locale={{ emptyText: <Empty description="No users found" /> }}
                            pagination={{ pageSize: 10 }}
                            scroll={{ x: 1500 }}
                        />
                    </div>
                </section>
            </div>
        </main>
    );
}
