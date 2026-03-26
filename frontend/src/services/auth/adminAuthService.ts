import { API } from "@/constants/api";
import { unwrapAbpResponse } from "@/lib/api/abp";
import { apiClient } from "@/lib/api/client";
import { IBackendPagedUsers, IBackendUserListItem } from "./types";

function getAuthorizationHeader(accessToken: string): { Authorization: string } {
    return { Authorization: `Bearer ${accessToken}` };
}

async function getUsers(accessToken: string): Promise<IBackendPagedUsers> {
    const response = await apiClient.get(API.USERS_GET_CLINICIAN_APPLICANTS_ENDPOINT, {
        headers: getAuthorizationHeader(accessToken),
    });
    const listResult = unwrapAbpResponse<{ items: IBackendUserListItem[] }>(response.data);

    return {
        items: listResult.items ?? [],
    };
}

async function approveClinician(userId: number, accessToken: string): Promise<IBackendUserListItem> {
    const response = await apiClient.post(
        API.USERS_APPROVE_CLINICIAN_ENDPOINT,
        { id: userId },
        {
            headers: getAuthorizationHeader(accessToken),
        }
    );

    return unwrapAbpResponse<IBackendUserListItem>(response.data);
}

export const adminAuthService = {
    getUsers,
    approveClinician,
};
