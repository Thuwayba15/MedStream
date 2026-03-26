import { Button, Select, Space, Tag, Typography } from "antd";
import type { FormInstance } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { IClinicianApplicant, IFacility } from "@/providers/admin-governance/context";
import type { IFacilityFormValues } from "@/components/admin/types";

interface IBuildApprovalColumnsArgs {
    adminStyles: Record<string, string>;
    activeFacilities: IFacility[];
    assigningFacilityByUserId: Record<number, number | undefined>;
    setAssigningFacilityByUserId: React.Dispatch<React.SetStateAction<Record<number, number | undefined>>>;
    isMutating: boolean;
    onAssignFacility: (clinicianUserId: number) => Promise<void>;
    openDecisionModal: (userId: number, mode: "approve" | "decline") => void;
}

export function buildApprovalColumns(args: IBuildApprovalColumnsArgs): ColumnsType<IClinicianApplicant> {
    return [
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
                <Space orientation="vertical" size={0} className={args.adminStyles.secondaryTextStack}>
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
                                className={args.adminStyles.assignSelect}
                                placeholder="Assign facility"
                                value={args.assigningFacilityByUserId[row.id] ?? row.clinicianFacilityId ?? undefined}
                                options={args.activeFacilities.map((facility) => ({ label: facility.name, value: facility.id }))}
                                onChange={(value) => args.setAssigningFacilityByUserId((previous) => ({ ...previous, [row.id]: value }))}
                                data-testid={`assign-facility-select-${row.id}`}
                            />
                            <Button
                                loading={args.isMutating}
                                data-testid={`assign-facility-button-${row.id}`}
                                onClick={() => {
                                    void args.onAssignFacility(row.id);
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
                <Space orientation="vertical" size={0} className={args.adminStyles.secondaryTextStack}>
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
                    <Tag className={args.adminStyles.statusTag} color={row.approvalStatus === "PendingApproval" ? "gold" : row.approvalStatus === "Rejected" ? "red" : "green"}>
                        {row.approvalStatus || "Approved"}
                    </Tag>
                    <Tag className={args.adminStyles.stateTag} color={row.isActive ? "blue" : "default"}>
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
                        <Button type="primary" loading={args.isMutating} onClick={() => args.openDecisionModal(row.id, "approve")}>
                            Approve
                        </Button>
                        <Button danger loading={args.isMutating} onClick={() => args.openDecisionModal(row.id, "decline")}>
                            Decline
                        </Button>
                    </Space>
                ) : (
                    <Tag color="green">No action required</Tag>
                ),
        },
    ];
}

interface IBuildFacilityColumnsArgs {
    adminStyles: Record<string, string>;
    editFacilityForm: FormInstance<IFacilityFormValues>;
    isMutating: boolean;
    setEditingFacility: React.Dispatch<React.SetStateAction<IFacility | null>>;
    setFacilityActivation: (id: number, isActive: boolean) => Promise<void>;
}

export function buildFacilityColumns(args: IBuildFacilityColumnsArgs): ColumnsType<IFacility> {
    return [
        {
            title: "Facility",
            key: "facility",
            render: (_, row) => (
                <Space orientation="vertical" size={0} className={args.adminStyles.secondaryTextStack}>
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
                <Space orientation="vertical" size={0} className={args.adminStyles.secondaryTextStack}>
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
                        data-testid={`edit-facility-button-${row.id}`}
                        onClick={() => {
                            args.setEditingFacility(row);
                            args.editFacilityForm.setFieldsValue({
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
                    <Button loading={args.isMutating} data-testid={`toggle-facility-active-button-${row.id}`} onClick={() => void args.setFacilityActivation(row.id, !row.isActive)}>
                        {row.isActive ? "Deactivate" : "Activate"}
                    </Button>
                </Space>
            ),
        },
    ];
}
