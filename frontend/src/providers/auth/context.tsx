"use client";

import { createContext } from "react";

export interface IAuthStateContext {
    isPending: boolean;
    isSuccess: boolean;
    isError: boolean;
    errorMessage?: string;
}

export interface IAuthActionContext {
    login: (payload: { userNameOrEmailAddress: string; password: string }) => Promise<{ homePath: string }>;
    register: (payload: {
        firstName: string;
        lastName: string;
        emailAddress: string;
        phoneNumber: string;
        password: string;
        confirmPassword: string;
        idNumber?: string;
        dateOfBirth?: string;
        accountType: "Patient" | "Clinician";
        professionType?: "Doctor" | "Nurse" | "AlliedHealth" | "Other";
        regulatoryBody?: "HPCSA" | "SANC" | "Other";
        registrationNumber?: string;
        requestedFacility?: string;
        requestedFacilityId?: number;
    }) => Promise<{ homePath: string }>;
    logout: () => Promise<void>;
    getCurrentHomePath: () => Promise<string>;
    clearError: () => void;
}

export const INITIAL_STATE: IAuthStateContext = {
    isPending: false,
    isSuccess: false,
    isError: false,
    errorMessage: undefined,
};

export const INITIAL_ACTION_STATE: IAuthActionContext = {
    login: async () => ({ homePath: "/login" }),
    register: async () => ({ homePath: "/registration" }),
    logout: async () => Promise.resolve(),
    getCurrentHomePath: async () => "/login",
    clearError: () => undefined,
};

export const AuthStateContext = createContext<IAuthStateContext>(INITIAL_STATE);
export const AuthActionContext = createContext<IAuthActionContext | undefined>(undefined);
