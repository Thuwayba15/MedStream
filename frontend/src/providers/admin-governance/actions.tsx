import { createAction } from "redux-actions";
import type { IAdminGovernanceStateContext, ApprovalFilter, IClinicianApplicant, IFacility } from "./context";

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
    payload: IAdminGovernanceStatePayload;
}

export type IAdminGovernanceStatePayload = Partial<IAdminGovernanceStateContext>;

export const loadStarted = createAction<IAdminGovernanceStatePayload>(AdminGovernanceActionEnums.loadStarted, () => ({
    isLoadingUsers: true,
    isLoadingFacilities: true,
    errorMessage: undefined,
}));

export const loadSucceeded = createAction<IAdminGovernanceStatePayload, IClinicianApplicant[], IFacility[]>(
    AdminGovernanceActionEnums.loadSucceeded,
    (users: IClinicianApplicant[], facilities: IFacility[]) => ({
        users,
        facilities,
        isLoadingUsers: false,
        isLoadingFacilities: false,
        errorMessage: undefined,
    })
);

export const loadFailed = createAction<IAdminGovernanceStatePayload, string>(AdminGovernanceActionEnums.loadFailed, (errorMessage: string) => ({
    isLoadingUsers: false,
    isLoadingFacilities: false,
    errorMessage,
}));

export const mutationStarted = createAction<IAdminGovernanceStatePayload>(AdminGovernanceActionEnums.mutationStarted, () => ({
    isMutating: true,
    errorMessage: undefined,
    successMessage: undefined,
}));

export const mutationSucceeded = createAction<IAdminGovernanceStatePayload, string>(
    AdminGovernanceActionEnums.mutationSucceeded,
    (message: string) => ({
        isMutating: false,
        successMessage: message,
        errorMessage: undefined,
    })
);

export const mutationFailed = createAction<IAdminGovernanceStatePayload, string>(AdminGovernanceActionEnums.mutationFailed, (message: string) => ({
    isMutating: false,
    errorMessage: message,
}));

export const setSearchText = createAction<IAdminGovernanceStatePayload, string>(AdminGovernanceActionEnums.setSearchText, (value: string) => ({
    searchText: value,
}));

export const setApprovalFilter = createAction<IAdminGovernanceStatePayload, ApprovalFilter>(AdminGovernanceActionEnums.setApprovalFilter, (value: ApprovalFilter) => ({
    approvalFilter: value,
}));

export const clearMessages = createAction<IAdminGovernanceStatePayload>(AdminGovernanceActionEnums.clearMessages, () => ({
    errorMessage: undefined,
    successMessage: undefined,
}));
