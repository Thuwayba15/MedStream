"use client";

import { createContext } from "react";
import { IClinicianApplicant, IFacility, IFacilityUpsertRequest } from "@/services/admin-governance/types";

export type ApprovalFilter = "All" | "PendingApproval" | "Approved" | "Rejected";

export interface IAdminGovernanceStateContext {
    users: IClinicianApplicant[];
    facilities: IFacility[];
    isLoadingUsers: boolean;
    isLoadingFacilities: boolean;
    isMutating: boolean;
    errorMessage?: string;
    successMessage?: string;
    searchText: string;
    approvalFilter: ApprovalFilter;
}

export interface IAdminGovernanceActionContext {
    loadGovernanceData: () => Promise<void>;
    setSearchText: (value: string) => void;
    setApprovalFilter: (value: ApprovalFilter) => void;
    clearMessages: () => void;
    approveClinician: (userId: number, decisionReason: string) => Promise<void>;
    declineClinician: (userId: number, decisionReason: string) => Promise<void>;
    createFacility: (payload: IFacilityUpsertRequest) => Promise<void>;
    updateFacility: (payload: IFacilityUpsertRequest) => Promise<void>;
    setFacilityActivation: (id: number, isActive: boolean) => Promise<void>;
    assignClinicianFacility: (clinicianUserId: number, facilityId: number) => Promise<void>;
}

export const INITIAL_STATE: IAdminGovernanceStateContext = {
    users: [],
    facilities: [],
    isLoadingUsers: false,
    isLoadingFacilities: false,
    isMutating: false,
    errorMessage: undefined,
    successMessage: undefined,
    searchText: "",
    approvalFilter: "PendingApproval",
};

export const INITIAL_ACTION_STATE: IAdminGovernanceActionContext = {
    loadGovernanceData: async () => Promise.resolve(),
    setSearchText: () => undefined,
    setApprovalFilter: () => undefined,
    clearMessages: () => undefined,
    approveClinician: async () => Promise.resolve(),
    declineClinician: async () => Promise.resolve(),
    createFacility: async () => Promise.resolve(),
    updateFacility: async () => Promise.resolve(),
    setFacilityActivation: async () => Promise.resolve(),
    assignClinicianFacility: async () => Promise.resolve(),
};

export const AdminGovernanceStateContext = createContext<IAdminGovernanceStateContext>(INITIAL_STATE);
export const AdminGovernanceActionContext = createContext<IAdminGovernanceActionContext | undefined>(undefined);
