import {
    APPROVAL_STATE_CLAIM_KEY,
    AuthState,
    REQUESTED_ROLE_CLAIM_KEY,
    ROLE_CLAIM_KEY,
} from "./constants";

interface JwtPayload {
    [key: string]: unknown;
}

export function decodeJwtPayload(token: string): JwtPayload | null {
    const tokenParts = token.split(".");
    if (tokenParts.length < 2) {
        return null;
    }

    try {
        const normalizedPayload = tokenParts[1].replace(/-/g, "+").replace(/_/g, "/");
        const paddedPayload = normalizedPayload.padEnd(normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4), "=");
        return JSON.parse(atob(paddedPayload)) as JwtPayload;
    } catch {
        return null;
    }
}

export function deriveAuthStateFromJwtPayload(payload: JwtPayload): AuthState {
    const roleValues = toStringList(payload[ROLE_CLAIM_KEY] ?? payload.role);
    const requestedRole = toSingleString(payload[REQUESTED_ROLE_CLAIM_KEY]);
    const approvalState = toSingleString(payload[APPROVAL_STATE_CLAIM_KEY]);

    if (roleValues.includes("Admin")) {
        return "admin";
    }

    if (approvalState === "pending" && requestedRole === "Clinician") {
        return "clinician_pending_approval";
    }

    if (roleValues.includes("Clinician")) {
        return "clinician_approved";
    }

    return "patient";
}

export function getHomePathForAuthState(state: AuthState): string {
    switch (state) {
        case "admin":
            return "/admin";
        case "clinician_approved":
            return "/clinician";
        case "clinician_pending_approval":
            return "/awaiting-approval";
        default:
            return "/patient";
    }
}

function toSingleString(value: unknown): string | null {
    if (typeof value === "string") {
        return value;
    }

    if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
        return value[0];
    }

    return null;
}

function toStringList(value: unknown): string[] {
    if (typeof value === "string") {
        return [value];
    }

    if (Array.isArray(value)) {
        return value.filter((item): item is string => typeof item === "string");
    }

    return [];
}
