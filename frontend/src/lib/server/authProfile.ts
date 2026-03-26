import { AuthState } from "@/lib/auth/constants";
import { getHomePathForAuthState } from "@/lib/auth/state";
import { AuthUserProfile } from "./backendApi";

export interface SessionUserResult {
    id: number;
    name: string;
    surname: string;
    userName: string;
    emailAddress: string;
    roleNames?: string[];
    requestedRegistrationRole?: string | null;
    isClinicianApprovalPending?: boolean;
    clinicianApprovedAt?: string | null;
}

export interface SessionResult {
    user?: SessionUserResult | null;
}

export function mapSessionToAuthUserProfile(session: SessionResult): AuthUserProfile {
    if (!session.user) {
        throw new Error("Authenticated user profile is missing.");
    }

    const roleNames = session.user.roleNames ?? [];
    const requestedRegistrationRole = session.user.requestedRegistrationRole ?? null;
    const isClinicianApprovalPending = session.user.isClinicianApprovalPending ?? false;
    const clinicianApprovedAt = session.user.clinicianApprovedAt ?? null;

    const authState = deriveAuthState(roleNames, requestedRegistrationRole, isClinicianApprovalPending);

    return {
        id: session.user.id,
        name: session.user.name,
        surname: session.user.surname,
        userName: session.user.userName,
        emailAddress: session.user.emailAddress,
        roleNames,
        requestedRegistrationRole,
        isClinicianApprovalPending,
        clinicianApprovedAt,
        authState,
        homePath: getHomePathForAuthState(authState),
    };
}

export function deriveAuthState(roleNames: string[], requestedRegistrationRole: string | null, isClinicianApprovalPending: boolean): AuthState {
    if (roleNames.includes("Admin")) {
        return "admin";
    }

    if (isClinicianApprovalPending && requestedRegistrationRole === "Clinician") {
        return "clinician_pending_approval";
    }

    if (roleNames.includes("Clinician")) {
        return "clinician_approved";
    }

    return "patient";
}
