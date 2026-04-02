"use client";

import axios from "axios";
import { useContext, useReducer } from "react";
import { API } from "@/constants/api";
import { clearMessages, loadFailed, loadStarted, loadSucceeded, mutationFailed, mutationStarted, mutationSucceeded, setApprovalFilter, setSearchText } from "./actions";
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

export const AdminGovernanceProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, dispatch] = useReducer(adminGovernanceReducer, INITIAL_STATE);

    const parseRouteError = (error: unknown, fallbackMessage: string): Error => {
        if (axios.isAxiosError<IMessageResponse>(error)) {
            return new Error(error.response?.data?.message ?? fallbackMessage);
        }

        return error instanceof Error ? error : new Error(fallbackMessage);
    };

    const getApplicants = async (): Promise<IClinicianApplicant[]> => {
        const response = await axios.get<IApplicantsResponse>(API.ADMIN_USERS_ROUTE);
        const body = response.data;
        return body.users ?? [];
    };

    const getFacilities = async (): Promise<IFacility[]> => {
        const response = await axios.get<IFacilitiesResponse>(API.ADMIN_FACILITIES_ROUTE);
        const body = response.data;
        return body.facilities ?? [];
    };

    const decideClinician = async (userId: number, decisionReason: string, mode: "approve" | "decline"): Promise<void> => {
        const endpoint = mode === "approve" ? API.ADMIN_APPROVE_ROUTE : API.ADMIN_DECLINE_ROUTE;
        await axios.post(
            endpoint,
            {
                userId,
                decisionReason: decisionReason.trim(),
            },
            { headers: { "Content-Type": "application/json" } }
        );
    };

    const createFacility = async (payload: IFacilityUpsertRequest): Promise<void> => {
        await axios.post(API.ADMIN_FACILITIES_ROUTE, payload, {
            headers: { "Content-Type": "application/json" },
        });
    };

    const updateFacility = async (payload: IFacilityUpsertRequest): Promise<void> => {
        await axios.put(API.ADMIN_FACILITIES_ROUTE, payload, {
            headers: { "Content-Type": "application/json" },
        });
    };

    const setActivation = async (id: number, isActive: boolean): Promise<void> => {
        await axios.post(
            API.ADMIN_FACILITIES_ACTIVATION_ROUTE,
            { id, isActive },
            {
                headers: { "Content-Type": "application/json" },
            }
        );
    };

    const assignClinicianFacility = async (clinicianUserId: number, facilityId: number): Promise<void> => {
        await axios.post(
            API.ADMIN_FACILITIES_ASSIGN_ROUTE,
            { clinicianUserId, facilityId },
            {
                headers: { "Content-Type": "application/json" },
            }
        );
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
            const message = parseRouteError(error, "Action failed.").message;
            dispatch(mutationFailed(message));
        }
    };

    const actions: IAdminGovernanceActionContext = {
        loadGovernanceData,
        setSearchText: (value) => dispatch(setSearchText(value)),
        setApprovalFilter: (value: ApprovalFilter) => dispatch(setApprovalFilter(value)),
        clearMessages: () => dispatch(clearMessages()),
        // Approve Clinician
        // POST /api/auth/admin/approve
        approveClinician: async (userId, decisionReason) =>
            executeMutation(() => decideClinician(userId, decisionReason, "approve"), "Clinician approved successfully.", {
                users: true,
                facilities: false,
            }),
        // Decline Clinician
        // POST /api/auth/admin/decline
        declineClinician: async (userId, decisionReason) =>
            executeMutation(() => decideClinician(userId, decisionReason, "decline"), "Clinician application declined.", {
                users: true,
                facilities: false,
            }),
        // Create Facility
        // POST /api/auth/admin/facilities
        createFacility: async (payload: IFacilityUpsertRequest) =>
            executeMutation(() => createFacility(payload), "Facility created successfully.", {
                users: false,
                facilities: true,
            }),
        // Update Facility
        // PUT /api/auth/admin/facilities
        updateFacility: async (payload: IFacilityUpsertRequest) =>
            executeMutation(() => updateFacility(payload), "Facility updated successfully.", {
                users: false,
                facilities: true,
            }),
        // Set Facility Activation
        // POST /api/auth/admin/facilities/activation
        setFacilityActivation: async (id: number, isActive: boolean) =>
            executeMutation(() => setActivation(id, isActive), isActive ? "Facility activated." : "Facility deactivated.", {
                users: false,
                facilities: true,
            }),
        // Assign Clinician Facility
        // POST /api/auth/admin/facilities/assign
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
};

export const useAdminGovernanceState = (): IAdminGovernanceStateContext => {
    return useContext(AdminGovernanceStateContext);
};

export const useAdminGovernanceActions = (): IAdminGovernanceActionContext => {
    const context = useContext(AdminGovernanceActionContext);
    if (!context) {
        throw new Error("useAdminGovernanceActions must be used within an AdminGovernanceProvider.");
    }

    return context;
};
