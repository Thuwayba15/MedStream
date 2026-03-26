import { API } from "@/constants/api";
import { unwrapAbpResponse } from "@/lib/api/abp";
import { apiClient } from "@/lib/api/client";
import { IBackendPagedUsers, IBackendUserListItem, IFacilityListItem } from "./types";

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

async function decideClinician(userId: number, decisionReason: string, isApprove: boolean, accessToken: string): Promise<IBackendUserListItem> {
    const endpoint = isApprove ? API.USERS_APPROVE_CLINICIAN_ENDPOINT : API.USERS_DECLINE_CLINICIAN_ENDPOINT;
    const response = await apiClient.post(
        endpoint,
        {
            id: userId,
            decisionReason: decisionReason.trim(),
        },
        {
            headers: getAuthorizationHeader(accessToken),
        }
    );

    return unwrapAbpResponse<IBackendUserListItem>(response.data);
}

async function getFacilities(accessToken: string): Promise<IFacilityListItem[]> {
    const response = await apiClient.get(API.FACILITIES_GET_ALL_ENDPOINT, {
        params: { skipCount: 0, maxResultCount: 200 },
        headers: getAuthorizationHeader(accessToken),
    });
    const result = unwrapAbpResponse<{ items: IFacilityListItem[] }>(response.data);
    return result.items ?? [];
}

async function createFacility(facility: Omit<IFacilityListItem, "id">, accessToken: string): Promise<IFacilityListItem> {
    const response = await apiClient.post(API.FACILITIES_CREATE_ENDPOINT, facility, {
        headers: getAuthorizationHeader(accessToken),
    });
    return unwrapAbpResponse<IFacilityListItem>(response.data);
}

async function updateFacility(facility: IFacilityListItem, accessToken: string): Promise<IFacilityListItem> {
    const response = await apiClient.put(API.FACILITIES_UPDATE_ENDPOINT, facility, {
        headers: getAuthorizationHeader(accessToken),
    });
    return unwrapAbpResponse<IFacilityListItem>(response.data);
}

async function setFacilityActivation(id: number, isActive: boolean, accessToken: string): Promise<IFacilityListItem> {
    const response = await apiClient.post(
        API.FACILITIES_SET_ACTIVATION_ENDPOINT,
        {
            id,
            isActive,
        },
        {
            headers: getAuthorizationHeader(accessToken),
        }
    );
    return unwrapAbpResponse<IFacilityListItem>(response.data);
}

async function assignClinicianFacility(clinicianUserId: number, facilityId: number, accessToken: string): Promise<void> {
    await apiClient.post(
        API.FACILITIES_ASSIGN_CLINICIAN_ENDPOINT,
        {
            clinicianUserId,
            facilityId,
        },
        {
            headers: getAuthorizationHeader(accessToken),
        }
    );
}

async function getActiveFacilitiesForRegistration(): Promise<IFacilityListItem[]> {
    const response = await apiClient.get(API.ACCOUNT_ACTIVE_FACILITIES_ENDPOINT);
    const result = unwrapAbpResponse<IFacilityListItem[]>(response.data);
    return result ?? [];
}

export const adminAuthService = {
    getUsers,
    decideClinician,
    getFacilities,
    createFacility,
    updateFacility,
    setFacilityActivation,
    assignClinicianFacility,
    getActiveFacilitiesForRegistration,
};
