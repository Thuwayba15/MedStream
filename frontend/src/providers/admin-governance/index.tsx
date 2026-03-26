"use client";

import { useContext, useReducer } from "react";
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
    type ApprovalFilter,
} from "./context";
import { adminGovernanceReducer } from "./reducer";
import { IFacilityUpsertRequest } from "@/services/admin-governance/types";
import { adminGovernanceService } from "@/services/admin-governance/adminGovernanceService";

export function AdminGovernanceProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
    const [state, dispatch] = useReducer(adminGovernanceReducer, INITIAL_STATE);

    const loadGovernanceData = async (): Promise<void> => {
        dispatch(loadStarted());
        try {
            const [users, facilities] = await Promise.all([adminGovernanceService.getApplicants(), adminGovernanceService.getFacilities()]);
            dispatch(loadSucceeded(users, facilities));
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to load governance data.";
            dispatch(loadFailed(message));
        }
    };

    const executeMutation = async (action: () => Promise<void>, successMessage: string): Promise<void> => {
        dispatch(mutationStarted());
        try {
            await action();
            const [users, facilities] = await Promise.all([adminGovernanceService.getApplicants(), adminGovernanceService.getFacilities()]);
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
            executeMutation(() => adminGovernanceService.decideClinician(userId, decisionReason, "approve"), "Clinician approved successfully."),
        declineClinician: async (userId, decisionReason) =>
            executeMutation(() => adminGovernanceService.decideClinician(userId, decisionReason, "decline"), "Clinician application declined."),
        createFacility: async (payload: IFacilityUpsertRequest) =>
            executeMutation(() => adminGovernanceService.createFacility(payload), "Facility created successfully."),
        updateFacility: async (payload: IFacilityUpsertRequest) =>
            executeMutation(() => adminGovernanceService.updateFacility(payload), "Facility updated successfully."),
        setFacilityActivation: async (id: number, isActive: boolean) =>
            executeMutation(() => adminGovernanceService.setActivation(id, isActive), isActive ? "Facility activated." : "Facility deactivated."),
        assignClinicianFacility: async (clinicianUserId, facilityId) =>
            executeMutation(() => adminGovernanceService.assignClinicianFacility(clinicianUserId, facilityId), "Clinician facility assignment updated."),
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
