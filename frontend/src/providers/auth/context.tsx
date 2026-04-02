"use client";

import { createContext } from "react";
import type { IAuthFieldError, ILoginRequest, IRegisterRequest } from "@/lib/auth/types";

export interface IAuthStateContext {
    isPending: boolean;
    isSuccess: boolean;
    isError: boolean;
    errorMessage?: string;
    fieldErrors: IAuthFieldError[];
}

export interface IAuthActionContext {
    login: (payload: ILoginRequest) => Promise<{ homePath: string }>;
    register: (payload: IRegisterRequest) => Promise<{ homePath: string }>;
    logout: () => Promise<void>;
    getCurrentHomePath: () => Promise<string>;
    clearError: () => void;
}

export const INITIAL_STATE: IAuthStateContext = {
    isPending: false,
    isSuccess: false,
    isError: false,
    errorMessage: undefined,
    fieldErrors: [],
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
