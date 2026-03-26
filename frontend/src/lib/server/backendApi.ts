import { AuthState } from "@/lib/auth/constants";

interface AbpErrorPayload {
    error?: {
        message?: string;
        details?: string;
        validationErrors?: Array<{
            message?: string;
            members?: string[];
        }>;
    };
    success?: boolean;
    result?: unknown;
}

export interface AuthUserProfile {
    id: number;
    name: string;
    surname: string;
    userName: string;
    emailAddress: string;
    roleNames: string[];
    requestedRegistrationRole: string | null;
    isClinicianApprovalPending: boolean;
    clinicianApprovedAt: string | null;
    authState: AuthState;
    homePath: string;
}

export interface BackendUserListItem {
    id: number;
    name: string;
    surname: string;
    userName: string;
    emailAddress: string;
    roleNames: string[];
    requestedRegistrationRole: string | null;
    isClinicianApprovalPending: boolean;
    clinicianApprovedAt: string | null;
    clinicianApprovedByUserId: number | null;
    isActive: boolean;
}

function getApiBaseUrl(): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseUrl) {
        throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured.");
    }

    return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

export async function callBackendApi<TResponse>(path: string, init?: RequestInit, accessToken?: string): Promise<TResponse> {
    const headers = new Headers(init?.headers);
    headers.set("Content-Type", "application/json");

    if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
    }

    try {
        const response = await fetch(`${getApiBaseUrl()}${path}`, {
            ...init,
            headers,
            cache: "no-store",
        });

        const responseText = await response.text();
        const payload = parseJson(responseText) as AbpErrorPayload | null;

        if (!response.ok || payload?.success === false) {
            const message = buildBackendErrorMessage(payload, responseText, response.status) ?? extractMessageFromText(responseText) ?? `Request to backend failed (HTTP ${response.status}).`;
            throw new Error(message);
        }

        return (payload?.result ?? payload) as TResponse;
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }

        throw new Error("Request to backend failed.");
    }
}

function buildBackendErrorMessage(payload: AbpErrorPayload | null, responseText: string, statusCode: number): string | null {
    if (!payload?.error) {
        return null;
    }

    const baseMessage = payload.error.message?.trim();
    const validationMessage = payload.error.validationErrors?.find((error) => !!error.message)?.message?.trim();
    const details = payload.error.details?.trim();

    if (details && details.includes("does not exist") && details.includes("AbpUsers")) {
        return "Database schema is out of date (missing columns on AbpUsers). Run EF migrations and retry registration.";
    }

    if (validationMessage && baseMessage && validationMessage !== baseMessage) {
        return `${baseMessage} ${validationMessage}`;
    }

    if (validationMessage) {
        return validationMessage;
    }

    if (baseMessage && baseMessage !== "An internal error occurred during your request!" && baseMessage !== "InternalServerError") {
        return baseMessage;
    }

    if (details) {
        return details.length > 280 ? `${details.slice(0, 280)}...` : details;
    }

    if (baseMessage) {
        return `${baseMessage} (HTTP ${statusCode})`;
    }

    const textFallback = extractMessageFromText(responseText);
    return textFallback;
}

function parseJson(value: string): unknown | null {
    if (!value) {
        return null;
    }

    try {
        return JSON.parse(value) as unknown;
    } catch {
        return null;
    }
}

function extractMessageFromText(value: string): string | null {
    if (!value) {
        return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    if (trimmed.length <= 220) {
        return trimmed;
    }

    return `${trimmed.slice(0, 220)}...`;
}
