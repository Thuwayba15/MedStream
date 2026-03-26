import type { IAdminGovernanceStateContext, ApprovalFilter } from "./context";
import { IClinicianApplicant, IFacility } from "@/services/admin-governance/types";

export enum AdminGovernanceActionEnums {
    loadStarted = "ADMIN_GOVERNANCE_LOAD_STARTED",
    loadSucceeded = "ADMIN_GOVERNANCE_LOAD_SUCCEEDED",
    loadFailed = "ADMIN_GOVERNANCE_LOAD_FAILED",
    mutationStarted = "ADMIN_GOVERNANCE_MUTATION_STARTED",
    mutationSucceeded = "ADMIN_GOVERNANCE_MUTATION_SUCCEEDED",
    mutationFailed = "ADMIN_GOVERNANCE_MUTATION_FAILED",
    setSearchText = "ADMIN_GOVERNANCE_SET_SEARCH_TEXT",
    setApprovalFilter = "ADMIN_GOVERNANCE_SET_APPROVAL_FILTER",
    clearMessages = "ADMIN_GOVERNANCE_CLEAR_MESSAGES",
}

export interface IAdminGovernanceStateAction {
    type: AdminGovernanceActionEnums;
    payload: Partial<IAdminGovernanceStateContext>;
}

export const loadStarted = (): IAdminGovernanceStateAction => ({
    type: AdminGovernanceActionEnums.loadStarted,
    payload: {
        isLoadingUsers: true,
        isLoadingFacilities: true,
        errorMessage: undefined,
    },
});

export const loadSucceeded = (users: IClinicianApplicant[], facilities: IFacility[]): IAdminGovernanceStateAction => ({
    type: AdminGovernanceActionEnums.loadSucceeded,
    payload: {
        users,
        facilities,
        isLoadingUsers: false,
        isLoadingFacilities: false,
        errorMessage: undefined,
    },
});

export const loadFailed = (errorMessage: string): IAdminGovernanceStateAction => ({
    type: AdminGovernanceActionEnums.loadFailed,
    payload: {
        isLoadingUsers: false,
        isLoadingFacilities: false,
        errorMessage,
    },
});

export const mutationStarted = (): IAdminGovernanceStateAction => ({
    type: AdminGovernanceActionEnums.mutationStarted,
    payload: {
        isMutating: true,
        errorMessage: undefined,
        successMessage: undefined,
    },
});

export const mutationSucceeded = (message: string): IAdminGovernanceStateAction => ({
    type: AdminGovernanceActionEnums.mutationSucceeded,
    payload: {
        isMutating: false,
        successMessage: message,
        errorMessage: undefined,
    },
});

export const mutationFailed = (message: string): IAdminGovernanceStateAction => ({
    type: AdminGovernanceActionEnums.mutationFailed,
    payload: {
        isMutating: false,
        errorMessage: message,
    },
});

export const setSearchText = (value: string): IAdminGovernanceStateAction => ({
    type: AdminGovernanceActionEnums.setSearchText,
    payload: {
        searchText: value,
    },
});

export const setApprovalFilter = (value: ApprovalFilter): IAdminGovernanceStateAction => ({
    type: AdminGovernanceActionEnums.setApprovalFilter,
    payload: {
        approvalFilter: value,
    },
});

export const clearMessages = (): IAdminGovernanceStateAction => ({
    type: AdminGovernanceActionEnums.clearMessages,
    payload: {
        errorMessage: undefined,
        successMessage: undefined,
    },
});
