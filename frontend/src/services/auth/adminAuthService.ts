import { USERS_APPROVE_CLINICIAN_ENDPOINT, USERS_GET_ALL_ENDPOINT } from "@/constants/api";
import { unwrapAbpResponse } from "@/lib/api/abp";
import { apiClient } from "@/lib/api/client";
import { IBackendPagedUsers, IBackendUserListItem } from "./types";

function getAuthorizationHeader(accessToken: string): { Authorization: string } {
    return { Authorization: `Bearer ${accessToken}` };
}

async function getUsers(accessToken: string): Promise<IBackendPagedUsers> {
    const response = await apiClient.post(
        USERS_GET_ALL_ENDPOINT,
        {
            keyword: "",
            maxResultCount: 500,
            skipCount: 0,
        },
        {
            headers: getAuthorizationHeader(accessToken),
        },
    );

    return unwrapAbpResponse<IBackendPagedUsers>(response.data);
}

async function approveClinician(userId: number, accessToken: string): Promise<IBackendUserListItem> {
    const response = await apiClient.post(
        USERS_APPROVE_CLINICIAN_ENDPOINT,
        { id: userId },
        {
            headers: getAuthorizationHeader(accessToken),
        },
    );

    return unwrapAbpResponse<IBackendUserListItem>(response.data);
}

export const adminAuthService = {
    getUsers,
    approveClinician,
};
