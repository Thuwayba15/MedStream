export const ACCESS_TOKEN_COOKIE_NAME = "medstream_access_token";
export const AUTH_STATE_COOKIE_NAME = "medstream_auth_state";
export const SIGNALR_TOKEN_COOKIE_NAME = "medstream_signalr_token";

export const ROLE_CLAIM_KEY = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

export const APPROVAL_STATE_CLAIM_KEY = "medstream:approval_state";

export const REQUESTED_ROLE_CLAIM_KEY = "medstream:requested_registration_role";

export type AuthState = "admin" | "clinician_approved" | "clinician_pending_approval" | "patient";
