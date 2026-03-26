import { DEFAULT_TENANT_ID, REGISTER_ENDPOINT, TOKEN_AUTH_ENDPOINT } from "@/constants/api";
import { unwrapAbpResponse } from "@/lib/api/abp";
import { apiClient } from "@/lib/api/client";
import { IAuthenticateResponse, ILoginRequest, IRegisterRequest, IRegisterResponse } from "./types";

async function login(request: ILoginRequest): Promise<IAuthenticateResponse> {
    const response = await apiClient.post(TOKEN_AUTH_ENDPOINT, {
        userNameOrEmailAddress: request.userNameOrEmailAddress.trim(),
        password: request.password,
        tenantId: DEFAULT_TENANT_ID,
        rememberClient: true,
    });

    return unwrapAbpResponse<IAuthenticateResponse>(response.data);
}

async function register(request: IRegisterRequest): Promise<IRegisterResponse> {
    const response = await apiClient.post(REGISTER_ENDPOINT, {
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
    });

    return unwrapAbpResponse<IRegisterResponse>(response.data);
}

export const authService = {
    login,
    register,
};
