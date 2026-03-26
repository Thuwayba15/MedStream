import axios, { AxiosInstance } from "axios";
import { DEFAULT_TENANT_ID, TENANT_HEADER } from "@/constants/api";

function getApiBaseUrl(): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseUrl) {
        throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured.");
    }

    return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

/**
 * Centralized Axios client for backend requests.
 * Tenant header is attached by default because MedStream is currently single-tenant.
 */
export const apiClient: AxiosInstance = axios.create({
    baseURL: getApiBaseUrl(),
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
        [TENANT_HEADER]: DEFAULT_TENANT_ID,
    },
});

apiClient.interceptors.request.use((config) => {
    config.headers[TENANT_HEADER] = DEFAULT_TENANT_ID;
    return config;
});
