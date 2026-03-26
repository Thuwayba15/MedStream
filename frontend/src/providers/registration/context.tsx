"use client";

import { createContext } from "react";

export interface IRegistrationFacilityOption {
    id: number;
    name: string;
}

export interface IRegistrationStateContext {
    facilities: IRegistrationFacilityOption[];
    isLoading: boolean;
    errorMessage?: string;
}

export interface IRegistrationActionContext {
    loadFacilities: () => Promise<void>;
    clearError: () => void;
}

export const INITIAL_STATE: IRegistrationStateContext = {
    facilities: [],
    isLoading: false,
    errorMessage: undefined,
};

export const RegistrationStateContext = createContext<IRegistrationStateContext>(INITIAL_STATE);
export const RegistrationActionContext = createContext<IRegistrationActionContext | undefined>(undefined);
