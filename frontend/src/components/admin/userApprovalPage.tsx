"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Empty, Form, Input, Modal, Select, Space, Table, Tabs, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { LogoutButton } from "@/components/auth/logoutButton";
import { useAuthStyles } from "@/components/auth/style";
import { useAdminStyles } from "@/components/admin/style";
import { useAdminGovernanceActions, useAdminGovernanceState } from "@/providers/admin-governance";
import { ApprovalFilter } from "@/providers/admin-governance/context";
import { IClinicianApplicant, IFacility } from "@/services/admin-governance/types";

const FACILITY_TYPE_OPTIONS = [
    { label: "Clinic", value: "Clinic" },
    { label: "Community Health Centre", value: "CommunityHealthCentre" },
    { label: "District Hospital", value: "DistrictHospital" },
    { label: "Regional Hospital", value: "RegionalHospital" },
    { label: "Tertiary Hospital", value: "TertiaryHospital" },
    { label: "Academic Hospital", value: "AcademicHospital" },
];

const PROVINCE_OPTIONS = [
    { label: "Eastern Cape", value: "Eastern Cape" },
    { label: "Free State", value: "Free State" },
    { label: "Gauteng", value: "Gauteng" },
    { label: "KwaZulu-Natal", value: "KwaZulu-Natal" },
    { label: "Limpopo", value: "Limpopo" },
    { label: "Mpumalanga", value: "Mpumalanga" },
    { label: "North West", value: "North West" },
    { label: "Northern Cape", value: "Northern Cape" },
    { label: "Western Cape", value: "Western Cape" },
];

interface IDecisionFormValues {
    decisionReason: string;
}

interface IFacilityFormValues {
    name: string;
    code?: string;
    facilityType?: string;
    province?: string;
    district?: string;
    address?: string;
}

export function UserApprovalPage(): React.JSX.Element {
    const { styles } = useAuthStyles();
    const { styles: adminStyles } = useAdminStyles();
    const {
        users,
        facilities,
        isLoadingUsers,
        isLoadingFacilities,
        isMutating,
        errorMessage,
        successMessage,
        searchText,
        approvalFilter,
    } = useAdminGovernanceState();
    const {
        loadGovernanceData,
        setSearchText,
        setApprovalFilter,
        clearMessages,
        approveClinician,
        declineClinician,
        createFacility,
        updateFacility,
        setFacilityActivation,
        assignClinicianFacility,
    } = useAdminGovernanceActions();

    const [decisionTargetUserId, setDecisionTargetUserId] = useState<number | null>(null);
    const [decisionMode, setDecisionMode] = useState<"approve" | "decline">("approve");
    const [decisionForm] = Form.useForm<IDecisionFormValues>();
    const [facilityForm] = Form.useForm<IFacilityFormValues>();
    const [editingFacility, setEditingFacility] = useState<IFacility | null>(null);
    const [editFacilityForm] = Form.useForm<IFacilityFormValues>();
    const [assigningFacilityByUserId, setAssigningFacilityByUserId] = useState<Record<number, number | undefined>>({});

    useEffect(() => {
        void loadGovernanceData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const activeFacilities = useMemo(() => facilities.filter((facility) => facility.isActive), [facilities]);

    const filteredUsers = useMemo(() => {
        const normalizedSearch = searchText.trim().toLowerCase();
        return users.filter((user) => {
            const status = user.approvalStatus ?? "Approved";
            const matchesStatus = approvalFilter === "All" || status === approvalFilter;
            const matchesSearch =
                normalizedSearch.length === 0 ||
                `${user.name} ${user.surname}`.toLowerCase().includes(normalizedSearch) ||
                user.emailAddress.toLowerCase().includes(normalizedSearch) ||
                (user.registrationNumber ?? "").toLowerCase().includes(normalizedSearch) ||
                (user.requestedFacility ?? "").toLowerCase().includes(normalizedSearch);

            return matchesStatus && matchesSearch;
        });
    }, [users, searchText, approvalFilter]);

    const pendingCount = useMemo(() => users.filter((row) => row.isClinicianApprovalPending).length, [users]);

    const openDecisionModal = (userId: number, mode: "approve" | "decline"): void => {
        clearMessages();
        setDecisionTargetUserId(userId);
        setDecisionMode(mode);
        decisionForm.resetFields();
    };

    const onSubmitDecision = async (values: IDecisionFormValues): Promise<void> => {
        if (!decisionTargetUserId) {
            return;
        }

        if (decisionMode === "approve") {
            await approveClinician(decisionTargetUserId, values.decisionReason);
        } else {
            await declineClinician(decisionTargetUserId, values.decisionReason);
        }

        setDecisionTargetUserId(null);
    };

    const onCreateFacility = async (values: IFacilityFormValues): Promise<void> => {
        await createFacility({
            name: values.name.trim(),
            code: values.code?.trim() || null,
            facilityType: values.facilityType || null,
            province: values.province || null,
            district: values.district?.trim() || null,
            address: values.address?.trim() || null,
            isActive: true,
        });
        facilityForm.resetFields();
    };

    const onUpdateFacility = async (values: IFacilityFormValues): Promise<void> => {
        if (!editingFacility) {
            return;
        }

        await updateFacility({
            id: editingFacility.id,
            name: values.name.trim(),
            code: values.code?.trim() || null,
            facilityType: values.facilityType || null,
            province: values.province || null,
            district: values.district?.trim() || null,
            address: values.address?.trim() || null,
            isActive: editingFacility.isActive,
        });
        setEditingFacility(null);
    };

    const onAssignFacility = async (clinicianUserId: number): Promise<void> => {
        const facilityId = assigningFacilityByUserId[clinicianUserId];
        if (!facilityId) {
            return;
        }

        await assignClinicianFacility(clinicianUserId, facilityId);
    };

    const approvalColumns: ColumnsType<IClinicianApplicant> = [
        {
            title: "Applicant",
            key: "applicant",
            render: (_, row) => (
                <Space orientation="vertical" size={0}>
                    <Typography.Text strong>{`${row.name} ${row.surname}`}</Typography.Text>
                    <Typography.Text type="secondary">{row.emailAddress}</Typography.Text>
                    <Typography.Text type="secondary">{row.phoneNumber || "-"}</Typography.Text>
                </Space>
            ),
        },
        {
            title: "Registration",
            key: "registration",
            render: (_, row) => (
                <Space orientation="vertical" size={0} className={adminStyles.secondaryTextStack}>
                    <Typography.Text>{row.professionType || "-"}</Typography.Text>
                    <Typography.Text type="secondary">{row.regulatoryBody || "-"}</Typography.Text>
                    <Typography.Text type="secondary">{row.registrationNumber || "-"}</Typography.Text>
                    <Typography.Text type="secondary">{row.idNumber || "-"}</Typography.Text>
                </Space>
            ),
        },
        {
            title: "Facility",
            key: "facility",
            render: (_, row) => (
                <Space orientation="vertical" size={8}>
                    <Typography.Text>{row.requestedFacility || "-"}</Typography.Text>
                    {row.accountType === "Clinician" ? (
                        <Space wrap>
                            <Select<number>
                                className={adminStyles.assignSelect}
                                placeholder="Assign facility"
                                value={assigningFacilityByUserId[row.id] ?? row.clinicianFacilityId ?? undefined}
                                options={activeFacilities.map((facility) => ({ label: facility.name, value: facility.id }))}
                                onChange={(value) => setAssigningFacilityByUserId((previous) => ({ ...previous, [row.id]: value }))}
                            />
                            <Button
                                loading={isMutating}
                                onClick={() => {
                                    void onAssignFacility(row.id);
                                }}
                            >
                                Assign
                            </Button>
                        </Space>
                    ) : null}
                </Space>
            ),
        },
        {
            title: "Audit",
            key: "audit",
            render: (_, row) => (
                <Space orientation="vertical" size={0} className={adminStyles.secondaryTextStack}>
                    <Typography.Text type="secondary">Submitted: {row.clinicianSubmittedAt ? new Date(row.clinicianSubmittedAt).toLocaleString() : "-"}</Typography.Text>
                    <Typography.Text type="secondary">Approved: {row.clinicianApprovedAt ? new Date(row.clinicianApprovedAt).toLocaleString() : "-"}</Typography.Text>
                    <Typography.Text type="secondary">Declined: {row.clinicianDeclinedAt ? new Date(row.clinicianDeclinedAt).toLocaleString() : "-"}</Typography.Text>
                    <Typography.Text type="secondary">Reason: {row.approvalDecisionReason || "-"}</Typography.Text>
                </Space>
            ),
        },
        {
            title: "Status",
            key: "status",
            render: (_, row) => (
                <Space wrap>
                    <Tag className={adminStyles.statusTag} color={row.approvalStatus === "PendingApproval" ? "gold" : row.approvalStatus === "Rejected" ? "red" : "green"}>
                        {row.approvalStatus || "Approved"}
                    </Tag>
                    <Tag className={adminStyles.stateTag} color={row.isActive ? "blue" : "default"}>
                        {row.isActive ? "active" : "inactive"}
                    </Tag>
                </Space>
            ),
        },
        {
            title: "Action",
            key: "action",
            render: (_, row) =>
                row.isClinicianApprovalPending ? (
                    <Space>
                        <Button type="primary" loading={isMutating} onClick={() => openDecisionModal(row.id, "approve")}>
                            Approve
                        </Button>
                        <Button danger loading={isMutating} onClick={() => openDecisionModal(row.id, "decline")}>
                            Decline
                        </Button>
                    </Space>
                ) : (
                    <Tag color="green">No action required</Tag>
                ),
        },
    ];

    const facilityColumns: ColumnsType<IFacility> = [
        {
            title: "Facility",
            key: "facility",
            render: (_, row) => (
                <Space orientation="vertical" size={0} className={adminStyles.secondaryTextStack}>
                    <Typography.Text strong>{row.name}</Typography.Text>
                    <Typography.Text type="secondary">{row.code || "-"}</Typography.Text>
                    <Typography.Text type="secondary">{row.address || "-"}</Typography.Text>
                </Space>
            ),
        },
        {
            title: "Region",
            key: "region",
            render: (_, row) => (
                <Space orientation="vertical" size={0} className={adminStyles.secondaryTextStack}>
                    <Typography.Text>{row.province || "-"}</Typography.Text>
                    <Typography.Text type="secondary">{row.district || "-"}</Typography.Text>
                    <Typography.Text type="secondary">{row.facilityType || "-"}</Typography.Text>
                </Space>
            ),
        },
        {
            title: "Status",
            key: "status",
            render: (_, row) => <Tag color={row.isActive ? "green" : "default"}>{row.isActive ? "Active" : "Inactive"}</Tag>,
        },
        {
            title: "Action",
            key: "action",
            render: (_, row) => (
                <Space>
                    <Button
                        onClick={() => {
                            setEditingFacility(row);
                            editFacilityForm.setFieldsValue({
                                name: row.name,
                                code: row.code || undefined,
                                facilityType: row.facilityType || undefined,
                                province: row.province || undefined,
                                district: row.district || undefined,
                                address: row.address || undefined,
                            });
                        }}
                    >
                        Edit
                    </Button>
                    <Button loading={isMutating} onClick={() => void setFacilityActivation(row.id, !row.isActive)}>
                        {row.isActive ? "Deactivate" : "Activate"}
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <main className={styles.dashboardPage}>
            <div className={styles.dashboardShell}>
                <section className={styles.dashboardCard}>
                    <div className={adminStyles.headerRow}>
                        <div>
                            <Typography.Title level={1} className={styles.dashboardHeading}>
                                Admin Governance
                            </Typography.Title>
                            <Typography.Paragraph className={styles.dashboardText}>
                                Manage clinician approvals, assignments, and facility governance from one workspace.
                            </Typography.Paragraph>
                            <Typography.Text className={adminStyles.headingHint}>Pending requests: {pendingCount}</Typography.Text>
                        </div>
                        <div className={adminStyles.headerActions}>
                            <Tag className={adminStyles.pendingBadge} color={pendingCount > 0 ? "gold" : "green"}>
                                {pendingCount} pending approvals
                            </Tag>
                            <LogoutButton />
                        </div>
                    </div>
                </section>

                {successMessage ? <Alert type="success" title={successMessage} showIcon /> : null}
                {errorMessage ? <Alert type="error" title={errorMessage} showIcon /> : null}

                <section className={`${styles.dashboardCard} ${adminStyles.tableCard}`}>
                    <Tabs
                        items={[
                            {
                                key: "approvals",
                                label: "Clinician Approvals",
                                children: (
                                    <Space orientation="vertical" size={16} className={adminStyles.fullWidth}>
                                        <Space wrap>
                                            <Input.Search
                                                placeholder="Search by name, email, registration or facility"
                                                allowClear
                                                className={adminStyles.searchInput}
                                                value={searchText}
                                                onChange={(event) => setSearchText(event.target.value)}
                                            />
                                            <Select<ApprovalFilter>
                                                value={approvalFilter}
                                                className={adminStyles.filterSelect}
                                                onChange={(value) => setApprovalFilter(value)}
                                                options={[
                                                    { value: "All", label: "All statuses" },
                                                    { value: "PendingApproval", label: "Pending approval" },
                                                    { value: "Approved", label: "Approved" },
                                                    { value: "Rejected", label: "Rejected" },
                                                ]}
                                            />
                                        </Space>

                                        <div className={adminStyles.tableWrap}>
                                            <Table<IClinicianApplicant>
                                                rowKey="id"
                                                loading={isLoadingUsers}
                                                columns={approvalColumns}
                                                dataSource={filteredUsers}
                                                locale={{ emptyText: <Empty description="No clinician applications found" /> }}
                                                pagination={{ pageSize: 10 }}
                                                scroll={{ x: 1700 }}
                                            />
                                        </div>
                                    </Space>
                                ),
                            },
                            {
                                key: "facilities",
                                label: "Facility Governance",
                                children: (
                                    <Space orientation="vertical" size={16} className={adminStyles.fullWidth}>
                                        <Form<IFacilityFormValues> form={facilityForm} layout="vertical" onFinish={(values) => void onCreateFacility(values)}>
                                            <div className={adminStyles.facilityFormGrid}>
                                                <Form.Item name="name" label="Facility name" rules={[{ required: true, message: "Facility name is required." }]}>
                                                    <Input placeholder="Facility name" />
                                                </Form.Item>
                                                <Form.Item name="code" label="Code">
                                                    <Input placeholder="Code" />
                                                </Form.Item>
                                                <Form.Item name="facilityType" label="Type" rules={[{ required: true, message: "Select a facility type." }]}>
                                                    <Select showSearch optionFilterProp="label" options={FACILITY_TYPE_OPTIONS} placeholder="Select type" />
                                                </Form.Item>
                                                <Form.Item name="province" label="Province" rules={[{ required: true, message: "Select a province." }]}>
                                                    <Select showSearch optionFilterProp="label" options={PROVINCE_OPTIONS} placeholder="Select province" />
                                                </Form.Item>
                                                <Form.Item name="district" label="District">
                                                    <Input placeholder="District" />
                                                </Form.Item>
                                                <Form.Item name="address" label="Address">
                                                    <Input placeholder="Address" />
                                                </Form.Item>
                                            </div>
                                            <Button type="primary" htmlType="submit" loading={isMutating}>
                                                Add Facility
                                            </Button>
                                        </Form>

                                        <div className={adminStyles.tableWrap}>
                                            <Table<IFacility>
                                                rowKey="id"
                                                loading={isLoadingFacilities}
                                                columns={facilityColumns}
                                                dataSource={facilities}
                                                locale={{ emptyText: <Empty description="No facilities found" /> }}
                                                pagination={{ pageSize: 10 }}
                                            />
                                        </div>
                                    </Space>
                                ),
                            },
                        ]}
                    />
                </section>
            </div>

            <Modal
                title={decisionMode === "approve" ? "Approve Clinician" : "Decline Clinician"}
                open={decisionTargetUserId !== null}
                onCancel={() => setDecisionTargetUserId(null)}
                footer={null}
                destroyOnHidden
            >
                <Form<IDecisionFormValues> form={decisionForm} layout="vertical" onFinish={(values) => void onSubmitDecision(values)}>
                    <Form.Item
                        label="Decision reason"
                        name="decisionReason"
                        rules={[
                            { required: true, message: "Decision reason is required." },
                            { min: 3, message: "Decision reason must be at least 3 characters." },
                        ]}
                    >
                        <Input.TextArea rows={4} placeholder="Provide the reason for this decision." />
                    </Form.Item>

                    <Space>
                        <Button onClick={() => setDecisionTargetUserId(null)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={isMutating}>
                            {decisionMode === "approve" ? "Approve Clinician" : "Decline Clinician"}
                        </Button>
                    </Space>
                </Form>
            </Modal>

            <Modal title="Edit Facility" open={editingFacility !== null} onCancel={() => setEditingFacility(null)} footer={null} destroyOnHidden>
                <Form<IFacilityFormValues> form={editFacilityForm} layout="vertical" onFinish={(values) => void onUpdateFacility(values)}>
                    <Form.Item label="Facility name" name="name" rules={[{ required: true, message: "Facility name is required." }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Code" name="code">
                        <Input />
                    </Form.Item>
                    <Form.Item label="Facility type" name="facilityType" rules={[{ required: true, message: "Select a facility type." }]}>
                        <Select showSearch optionFilterProp="label" options={FACILITY_TYPE_OPTIONS} />
                    </Form.Item>
                    <Form.Item label="Province" name="province" rules={[{ required: true, message: "Select a province." }]}>
                        <Select showSearch optionFilterProp="label" options={PROVINCE_OPTIONS} />
                    </Form.Item>
                    <Form.Item label="District" name="district">
                        <Input />
                    </Form.Item>
                    <Form.Item label="Address" name="address">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                    <Space>
                        <Button onClick={() => setEditingFacility(null)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={isMutating}>
                            Save
                        </Button>
                    </Space>
                </Form>
            </Modal>
        </main>
    );
}
