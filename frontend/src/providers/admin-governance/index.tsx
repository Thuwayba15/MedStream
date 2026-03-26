"use client";

import { useContext, useReducer } from "react";
import { API } from "@/constants/api";
import {
    clearMessages,
    loadFailed,
    loadStarted,
    loadSucceeded,
    mutationFailed,
    mutationStarted,
    mutationSucceeded,
    setApprovalFilter,
    setSearchText,
} from "./actions";
import {
    AdminGovernanceActionContext,
    AdminGovernanceStateContext,
    IAdminGovernanceActionContext,
    IAdminGovernanceStateContext,
    INITIAL_STATE,
    IClinicianApplicant,
    IFacility,
    IFacilityUpsertRequest,
    type ApprovalFilter,
} from "./context";
import { adminGovernanceReducer } from "./reducer";

interface IReloadOptions {
    users: boolean;
    facilities: boolean;
}

interface IMessageResponse {
    message?: string;
}

interface IApplicantsResponse {
    users: IClinicianApplicant[];
}

interface IFacilitiesResponse {
    facilities: IFacility[];
}

export function AdminGovernanceProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
    const [state, dispatch] = useReducer(adminGovernanceReducer, INITIAL_STATE);

    async function parseResponse<TResponse>(response: Response, fallbackMessage: string): Promise<TResponse> {
        const body = (await response.json()) as TResponse & IMessageResponse;
        if (!response.ok) {
            throw new Error(body.message ?? fallbackMessage);
        }

        return body;
    }

    const getApplicants = async (): Promise<IClinicianApplicant[]> => {
        const response = await fetch(API.ADMIN_USERS_ROUTE);
        const body = await parseResponse<IApplicantsResponse>(response, "Unable to load clinician applicants.");
        return body.users ?? [];
    };

    const getFacilities = async (): Promise<IFacility[]> => {
        const response = await fetch(API.ADMIN_FACILITIES_ROUTE);
        const body = await parseResponse<IFacilitiesResponse>(response, "Unable to load facilities.");
        return body.facilities ?? [];
    };

    const decideClinician = async (userId: number, decisionReason: string, mode: "approve" | "decline"): Promise<void> => {
        const endpoint = mode === "approve" ? API.ADMIN_APPROVE_ROUTE : API.ADMIN_DECLINE_ROUTE;
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId,
                decisionReason: decisionReason.trim(),
            }),
        });

        await parseResponse<Record<string, unknown>>(response, "Unable to submit clinician decision.");
    };

    const createFacility = async (payload: IFacilityUpsertRequest): Promise<void> => {
        const response = await fetch(API.ADMIN_FACILITIES_ROUTE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        await parseResponse<Record<string, unknown>>(response, "Unable to create facility.");
    };

    const updateFacility = async (payload: IFacilityUpsertRequest): Promise<void> => {
        const response = await fetch(API.ADMIN_FACILITIES_ROUTE, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        await parseResponse<Record<string, unknown>>(response, "Unable to update facility.");
    };

    const setActivation = async (id: number, isActive: boolean): Promise<void> => {
        const response = await fetch(API.ADMIN_FACILITIES_ACTIVATION_ROUTE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, isActive }),
        });

        await parseResponse<Record<string, unknown>>(response, "Unable to update facility activation.");
    };

    const assignClinicianFacility = async (clinicianUserId: number, facilityId: number): Promise<void> => {
        const response = await fetch(API.ADMIN_FACILITIES_ASSIGN_ROUTE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clinicianUserId, facilityId }),
        });

        await parseResponse<Record<string, unknown>>(response, "Unable to assign clinician facility.");
    };

    const loadGovernanceData = async (): Promise<void> => {
        dispatch(loadStarted());
        try {
            const [users, facilities] = await Promise.all([getApplicants(), getFacilities()]);
            dispatch(loadSucceeded(users, facilities));
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to load governance data.";
            dispatch(loadFailed(message));
        }
    };

    const executeMutation = async (action: () => Promise<void>, successMessage: string, reloadOptions: IReloadOptions): Promise<void> => {
        dispatch(mutationStarted());
        try {
            await action();
            const [users, facilities] = await Promise.all([
                reloadOptions.users ? getApplicants() : Promise.resolve(state.users),
                reloadOptions.facilities ? getFacilities() : Promise.resolve(state.facilities),
            ]);
            dispatch(loadSucceeded(users, facilities));
            dispatch(mutationSucceeded(successMessage));
        } catch (error) {
            const message = error instanceof Error ? error.message : "Action failed.";
            dispatch(mutationFailed(message));
        }
    };

    const actions: IAdminGovernanceActionContext = {
        loadGovernanceData,
        setSearchText: (value) => dispatch(setSearchText(value)),
        setApprovalFilter: (value: ApprovalFilter) => dispatch(setApprovalFilter(value)),
        clearMessages: () => dispatch(clearMessages()),
        approveClinician: async (userId, decisionReason) =>
            executeMutation(() => decideClinician(userId, decisionReason, "approve"), "Clinician approved successfully.", {
                users: true,
                facilities: false,
            }),
        declineClinician: async (userId, decisionReason) =>
            executeMutation(() => decideClinician(userId, decisionReason, "decline"), "Clinician application declined.", {
                users: true,
                facilities: false,
            }),
        createFacility: async (payload: IFacilityUpsertRequest) =>
            executeMutation(() => createFacility(payload), "Facility created successfully.", {
                users: false,
                facilities: true,
            }),
        updateFacility: async (payload: IFacilityUpsertRequest) =>
            executeMutation(() => updateFacility(payload), "Facility updated successfully.", {
                users: false,
                facilities: true,
            }),
        setFacilityActivation: async (id: number, isActive: boolean) =>
            executeMutation(() => setActivation(id, isActive), isActive ? "Facility activated." : "Facility deactivated.", {
                users: false,
                facilities: true,
            }),
        assignClinicianFacility: async (clinicianUserId, facilityId) =>
            executeMutation(() => assignClinicianFacility(clinicianUserId, facilityId), "Clinician facility assignment updated.", {
                users: true,
                facilities: false,
            }),
    };

    return (
        <AdminGovernanceStateContext.Provider value={state}>
            <AdminGovernanceActionContext.Provider value={actions}>{children}</AdminGovernanceActionContext.Provider>
        </AdminGovernanceStateContext.Provider>
    );
}

export function useAdminGovernanceState(): IAdminGovernanceStateContext {
    return useContext(AdminGovernanceStateContext);
}

export function useAdminGovernanceActions(): IAdminGovernanceActionContext {
    const context = useContext(AdminGovernanceActionContext);
    if (!context) {
        throw new Error("useAdminGovernanceActions must be used within an AdminGovernanceProvider.");
    }

    return context;
}
