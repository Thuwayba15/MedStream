export interface ILoginRequest {
    userNameOrEmailAddress: string;
    password: string;
}

export interface IRegisterRequest {
    firstName: string;
    lastName: string;
    emailAddress: string;
    phoneNumber: string;
    password: string;
    confirmPassword: string;
    idNumber?: string | null;
    dateOfBirth?: string | null;
    accountType: "Patient" | "Clinician";
    professionType?: "Doctor" | "Nurse" | "AlliedHealth" | "Other" | null;
    regulatoryBody?: "HPCSA" | "SANC" | "Other" | null;
    registrationNumber?: string | null;
    requestedFacility?: string | null;
}

export interface IAuthenticateResponse {
    accessToken: string;
    expireInSeconds: number;
}

export interface IRegisterResponse {
    canLogin: boolean;
}

export interface IBackendUserListItem {
    id: number;
    name: string;
    surname: string;
    userName: string;
    emailAddress: string;
    phoneNumber: string | null;
    roleNames: string[];
    requestedRegistrationRole: string | null;
    isClinicianApprovalPending: boolean;
    clinicianApprovedAt: string | null;
    clinicianApprovedByUserId: number | null;
    accountType: string | null;
    professionType: string | null;
    regulatoryBody: string | null;
    registrationNumber: string | null;
    requestedFacility: string | null;
    approvalStatus: string | null;
    idNumber: string | null;
    clinicianSubmittedAt: string | null;
    isActive: boolean;
}

export interface IBackendPagedUsers {
    items: IBackendUserListItem[];
}
