import { AuthState, APPROVAL_STATE_CLAIM_KEY, REQUESTED_ROLE_CLAIM_KEY, ROLE_CLAIM_KEY } from "@/lib/auth/constants";
import { getHomePathForAuthState } from "@/lib/auth/state";

interface JwtPayload {
    [key: string]: unknown;
}

export interface TokenDerivedAuthInfo {
    authState: AuthState;
    homePath: string;
}

export const deriveAuthInfoFromAccessToken = (accessToken: string): TokenDerivedAuthInfo => {
    const payload = decodeJwtPayload(accessToken);
    const authState = deriveAuthStateFromPayload(payload);

    return {
        authState,
        homePath: getHomePathForAuthState(authState),
    };
};

const decodeJwtPayload = (token: string): JwtPayload => {
    const tokenParts = token.split(".");
    if (tokenParts.length < 2) {
        throw new Error("Invalid access token format.");
    }

    const normalizedPayload = tokenParts[1].replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4), "=");
    const decodedJson = Buffer.from(paddedPayload, "base64").toString("utf8");
    return JSON.parse(decodedJson) as JwtPayload;
};

const deriveAuthStateFromPayload = (payload: JwtPayload): AuthState => {
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
};

const toSingleString = (value: unknown): string | null => {
    if (typeof value === "string") {
        return value;
    }

    if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
        return value[0];
    }

    return null;
};

const toStringList = (value: unknown): string[] => {
    if (typeof value === "string") {
        return [value];
    }

    if (Array.isArray(value)) {
        return value.filter((item): item is string => typeof item === "string");
    }

    return [];
};
