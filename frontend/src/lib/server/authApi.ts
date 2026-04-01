import { API } from "@/constants/api";
import { unwrapAbpResponse } from "@/lib/api/abp";
import type {
    IAuthenticateResponse,
    IBackendPagedUsers,
    IBackendUserListItem,
    IFacilityListItem,
    ILoginRequest,
    IRegisterRequest,
    IRegisterResponse,
} from "@/lib/auth/types";
import { apiClient } from "@/lib/api/client";

const getAuthorizationHeader = (accessToken: string): { Authorization: string } => {
    return { Authorization: `Bearer ${accessToken}` };
};

export const authenticateUser = async (request: ILoginRequest): Promise<IAuthenticateResponse> => {
    const response = await apiClient.post(API.TOKEN_AUTH_ENDPOINT, {
        userNameOrEmailAddress: request.userNameOrEmailAddress.trim(),
        password: request.password,
        tenantId: API.DEFAULT_TENANT_ID,
        rememberClient: true,
    });

    return unwrapAbpResponse<IAuthenticateResponse>(response.data);
};

export const registerUser = async (request: IRegisterRequest): Promise<IRegisterResponse> => {
    const response = await apiClient.post(API.REGISTER_ENDPOINT, {
        firstName: request.firstName.trim(),
        lastName: request.lastName.trim(),
        emailAddress: request.emailAddress.trim(),
        phoneNumber: request.phoneNumber.trim(),
        password: request.password,
        confirmPassword: request.confirmPassword,
        idNumber: request.idNumber?.trim() || null,
        dateOfBirth: request.dateOfBirth || null,
        accountType: request.accountType,
        professionType: request.professionType || null,
        regulatoryBody: request.regulatoryBody || null,
        registrationNumber: request.registrationNumber?.trim() || null,
        requestedFacility: request.requestedFacility?.trim() || null,
        requestedFacilityId: request.requestedFacilityId ?? null,
    });

    return unwrapAbpResponse<IRegisterResponse>(response.data);
};

export const getClinicianApplicants = async (accessToken: string): Promise<IBackendPagedUsers> => {
    const response = await apiClient.get(API.USERS_GET_CLINICIAN_APPLICANTS_ENDPOINT, {
        headers: getAuthorizationHeader(accessToken),
    });
    const result = unwrapAbpResponse<{ items: IBackendUserListItem[] }>(response.data);

    return {
        items: result.items ?? [],
    };
};

export const decideClinicianApplicant = async (
    userId: number,
    decisionReason: string,
    isApprove: boolean,
    accessToken: string
): Promise<IBackendUserListItem> => {
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
};

export const getAdminFacilities = async (accessToken: string): Promise<IFacilityListItem[]> => {
    const response = await apiClient.get(API.FACILITIES_GET_ALL_ENDPOINT, {
        params: { skipCount: 0, maxResultCount: 200 },
        headers: getAuthorizationHeader(accessToken),
    });
    const result = unwrapAbpResponse<{ items: IFacilityListItem[] }>(response.data);
    return result.items ?? [];
};

export const createAdminFacility = async (facility: Omit<IFacilityListItem, "id">, accessToken: string): Promise<IFacilityListItem> => {
    const response = await apiClient.post(API.FACILITIES_CREATE_ENDPOINT, facility, {
        headers: getAuthorizationHeader(accessToken),
    });
    return unwrapAbpResponse<IFacilityListItem>(response.data);
};

export const updateAdminFacility = async (facility: IFacilityListItem, accessToken: string): Promise<IFacilityListItem> => {
    const response = await apiClient.put(API.FACILITIES_UPDATE_ENDPOINT, facility, {
        headers: getAuthorizationHeader(accessToken),
    });
    return unwrapAbpResponse<IFacilityListItem>(response.data);
};

export const setAdminFacilityActivation = async (id: number, isActive: boolean, accessToken: string): Promise<IFacilityListItem> => {
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
};

export const assignAdminClinicianFacility = async (clinicianUserId: number, facilityId: number, accessToken: string): Promise<void> => {
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
};

export const getRegistrationFacilities = async (): Promise<IFacilityListItem[]> => {
    const response = await apiClient.get(API.ACCOUNT_ACTIVE_FACILITIES_ENDPOINT);
    const result = unwrapAbpResponse<IFacilityListItem[]>(response.data);
    return result ?? [];
};
