import { Button, Select, Space, Tag, Typography } from "antd";
import type { FormInstance } from "antd";
import type { ColumnsType } from "antd/es/table";
import { formatAuditDate, getApplicantFullName, getApplicantInitials, getApprovalStatusLabel, getApprovalStatusTone, humanizeGovernanceValue } from "@/lib/admin/governance";
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

export const buildApprovalColumns = (args: IBuildApprovalColumnsArgs): ColumnsType<IClinicianApplicant> => {
    return [
        {
            title: "Applicant",
            key: "applicant",
            render: (_, row) => (
                <div className={args.adminStyles.applicantCell}>
                    <div
                        className={`${args.adminStyles.applicantAvatar} ${args.adminStyles[`applicantAvatar${getApprovalStatusTone(row.approvalStatus).charAt(0).toUpperCase()}${getApprovalStatusTone(row.approvalStatus).slice(1)}`]}`}
                    >
                        {getApplicantInitials(row)}
                    </div>
                    <div className={args.adminStyles.applicantMeta}>
                        <Typography.Text className={args.adminStyles.applicantName}>{getApplicantFullName(row)}</Typography.Text>
                        <Typography.Text className={args.adminStyles.applicantSubtext}>{row.emailAddress}</Typography.Text>
                        <Typography.Text className={args.adminStyles.applicantSubtext}>{row.phoneNumber || "-"}</Typography.Text>
                    </div>
                </div>
            ),
        },
        {
            title: "Registration",
            key: "registration",
            render: (_, row) => (
                <div className={args.adminStyles.registrationCell}>
                    <Typography.Text className={args.adminStyles.registrationRole}>{humanizeGovernanceValue(row.professionType)}</Typography.Text>
                    <Typography.Text className={args.adminStyles.registrationBody}>{humanizeGovernanceValue(row.regulatoryBody)}</Typography.Text>
                    <Typography.Text className={args.adminStyles.registrationNumber}>{row.registrationNumber || "-"}</Typography.Text>
                    <Typography.Text className={args.adminStyles.registrationMeta}>ID: {row.idNumber || "-"}</Typography.Text>
                </div>
            ),
        },
        {
            title: "Facility Assignment",
            key: "facility",
            render: (_, row) => (
                <Space orientation="vertical" size={10}>
                    <div className={args.adminStyles.secondaryTextStack}>
                        <Typography.Text className={args.adminStyles.facilityName}>{row.requestedFacility || "-"}</Typography.Text>
                    </div>
                    {row.accountType === "Clinician" ? (
                        <Space direction="vertical" size={8} className={args.adminStyles.assignControlStack}>
                            <Select<number>
                                className={args.adminStyles.assignSelect}
                                placeholder="Assign facility"
                                value={args.assigningFacilityByUserId[row.id] ?? row.clinicianFacilityId ?? undefined}
                                options={args.activeFacilities.map((facility) => ({ label: facility.name, value: facility.id }))}
                                onChange={(value) => args.setAssigningFacilityByUserId((previous) => ({ ...previous, [row.id]: value }))}
                                data-testid={`assign-facility-select-${row.id}`}
                            />
                            <Button
                                className={args.adminStyles.primaryActionButton}
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
                <div className={args.adminStyles.auditTrail}>
                    <Typography.Text className={args.adminStyles.auditItem}>
                        <span className={args.adminStyles.auditLabel}>Submitted:</span> {formatAuditDate(row.clinicianSubmittedAt)}
                    </Typography.Text>
                    <Typography.Text className={args.adminStyles.auditItem}>
                        <span className={args.adminStyles.auditLabel}>Approved:</span> {formatAuditDate(row.clinicianApprovedAt)}
                    </Typography.Text>
                    <Typography.Text className={args.adminStyles.auditItem}>
                        <span className={args.adminStyles.auditLabel}>Declined:</span> {formatAuditDate(row.clinicianDeclinedAt)}
                    </Typography.Text>
                    <Typography.Text className={args.adminStyles.auditItem}>
                        <span className={args.adminStyles.auditLabel}>Reason:</span> {row.approvalDecisionReason || "-"}
                    </Typography.Text>
                </div>
            ),
        },
        {
            title: "Status",
            key: "status",
            width: 130,
            render: (_, row) => (
                <span
                    className={`${args.adminStyles.statusPill} ${args.adminStyles[`statusPill${getApprovalStatusTone(row.approvalStatus).charAt(0).toUpperCase()}${getApprovalStatusTone(row.approvalStatus).slice(1)}`]}`}
                >
                    {getApprovalStatusLabel(row.approvalStatus)}
                </span>
            ),
        },
        {
            title: "Actions",
            key: "action",
            align: "right",
            render: (_, row) =>
                row.isClinicianApprovalPending ? (
                    <Space className={args.adminStyles.actionStack}>
                        <Button className={args.adminStyles.primaryActionButton} loading={args.isMutating} onClick={() => args.openDecisionModal(row.id, "approve")}>
                            Approve
                        </Button>
                        <Button className={args.adminStyles.secondaryActionButton} danger loading={args.isMutating} onClick={() => args.openDecisionModal(row.id, "decline")}>
                            Decline
                        </Button>
                    </Space>
                ) : (
                    <Typography.Text type="secondary">No action required</Typography.Text>
                ),
        },
    ];
};

interface IBuildFacilityColumnsArgs {
    adminStyles: Record<string, string>;
    editFacilityForm: FormInstance<IFacilityFormValues>;
    isMutating: boolean;
    setEditingFacility: React.Dispatch<React.SetStateAction<IFacility | null>>;
    setFacilityActivation: (id: number, isActive: boolean) => Promise<void>;
}

export const buildFacilityColumns = (args: IBuildFacilityColumnsArgs): ColumnsType<IFacility> => {
    return [
        {
            title: "Facility",
            key: "facility",
            render: (_, row) => (
                <div className={args.adminStyles.secondaryTextStack}>
                    <Typography.Text strong>{row.name}</Typography.Text>
                    <Typography.Text type="secondary">{row.code || "-"}</Typography.Text>
                    <Typography.Text type="secondary">{row.address || "-"}</Typography.Text>
                </div>
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
                        className={args.adminStyles.secondaryActionButton}
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
                    <Button
                        className={args.adminStyles.secondaryActionButton}
                        loading={args.isMutating}
                        data-testid={`toggle-facility-active-button-${row.id}`}
                        onClick={() => void args.setFacilityActivation(row.id, !row.isActive)}
                    >
                        {row.isActive ? "Deactivate" : "Activate"}
                    </Button>
                </Space>
            ),
        },
    ];
};
