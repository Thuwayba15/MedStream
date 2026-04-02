import type { IClinicianApplicant } from "@/providers/admin-governance/context";
import { formatMedstreamDateTime } from "@/lib/time/medstreamTime";

export type ApprovalStatusTone = "pending" | "approved" | "declined";

export interface IAdminGovernanceStats {
    pending: number;
    approved: number;
    declined: number;
    total: number;
}

const HUMANIZED_LABELS: Record<string, string> = {
    AlliedHealth: "Allied Health",
    PendingApproval: "Pending",
    Approved: "Approved",
    Rejected: "Declined",
};

export const getApplicantFullName = (applicant: Pick<IClinicianApplicant, "name" | "surname">): string => {
    return `${applicant.name} ${applicant.surname}`.trim();
};

export const getApplicantInitials = (applicant: Pick<IClinicianApplicant, "name" | "surname">): string => {
    return `${applicant.name.charAt(0)}${applicant.surname.charAt(0)}`.toUpperCase();
};

export const humanizeGovernanceValue = (value: string | null | undefined, fallback = "-"): string => {
    if (!value) {
        return fallback;
    }

    return HUMANIZED_LABELS[value] ?? value;
};

export const getApprovalStatusTone = (status: string | null | undefined): ApprovalStatusTone => {
    if (status === "Rejected") {
        return "declined";
    }

    if (status === "PendingApproval") {
        return "pending";
    }

    return "approved";
};

export const getApprovalStatusLabel = (status: string | null | undefined): string => {
    return humanizeGovernanceValue(status ?? "Approved", "Approved");
};

export const formatAuditDate = (value: string | null | undefined): string => {
    return formatMedstreamDateTime(value);
};

export const buildAdminGovernanceStats = (users: IClinicianApplicant[]): IAdminGovernanceStats => {
    return users.reduce<IAdminGovernanceStats>(
        (stats, user) => {
            const tone = getApprovalStatusTone(user.approvalStatus);
            if (tone === "pending") {
                stats.pending += 1;
            } else if (tone === "approved") {
                stats.approved += 1;
            } else {
                stats.declined += 1;
            }

            stats.total += 1;
            return stats;
        },
        {
            pending: 0,
            approved: 0,
            declined: 0,
            total: 0,
        }
    );
};
