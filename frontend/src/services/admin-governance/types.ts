export interface IClinicianApplicant {
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
    clinicianFacilityId: number | null;
    approvalStatus: string | null;
    approvalDecisionReason: string | null;
    idNumber: string | null;
    phoneNumber: string | null;
    clinicianSubmittedAt: string | null;
    clinicianApprovedAt: string | null;
    clinicianApprovedByUserId: number | null;
    clinicianDeclinedAt: string | null;
    clinicianDeclinedByUserId: number | null;
    authState: "admin" | "clinician_approved" | "clinician_pending_approval" | "patient";
    isActive: boolean;
}

export interface IFacility {
    id: number;
    name: string;
    code: string | null;
    facilityType: string | null;
    province: string | null;
    district: string | null;
    address: string | null;
    isActive: boolean;
}

export interface IFacilityUpsertRequest {
    id?: number;
    name: string;
    code?: string | null;
    facilityType?: string | null;
    province?: string | null;
    district?: string | null;
    address?: string | null;
    isActive?: boolean;
}
