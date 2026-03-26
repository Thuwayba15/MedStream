import { AuthState } from "@/lib/auth/constants";

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
