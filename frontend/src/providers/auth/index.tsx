"use client";

import axios from "axios";
import { useContext, useReducer } from "react";
import { API } from "@/constants/api";
import type { IAuthRouteErrorResponse, IAuthRouteResponse } from "@/lib/auth/types";
import { clearError, requestErrorWithFields, requestPending, requestSuccess } from "./actions";
import { AuthActionContext, AuthStateContext, INITIAL_STATE, type IAuthActionContext, type IAuthStateContext } from "./context";
import { authReducer } from "./reducer";

interface ICurrentUserResponse {
    user?: {
        homePath?: string;
    };
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, dispatch] = useReducer(authReducer, INITIAL_STATE);

    const parseRouteError = (error: unknown, fallbackMessage: string): IAuthRouteErrorResponse => {
        if (axios.isAxiosError<IAuthRouteErrorResponse>(error)) {
            return {
                message: error.response?.data?.message ?? fallbackMessage,
                fieldErrors: error.response?.data?.fieldErrors ?? [],
            };
        }

        return {
            message: error instanceof Error ? error.message : fallbackMessage,
            fieldErrors: [],
        };
    };

    const actions: IAuthActionContext = {
        // Login User
        // POST /api/auth/login
        login: async (payload) => {
            dispatch(requestPending());
            try {
                const response = await axios.post<IAuthRouteResponse>(API.AUTH_LOGIN_ROUTE, payload, {
                    headers: { "Content-Type": "application/json" },
                });
                const body = response.data;
                if (!body.homePath) {
                    throw new Error("Authentication request failed.");
                }
                dispatch(requestSuccess());
                return { homePath: body.homePath };
            } catch (error) {
                const routeError = parseRouteError(error, "Authentication request failed.");
                dispatch(
                    requestErrorWithFields({
                        errorMessage: routeError.message ?? "Authentication request failed.",
                        fieldErrors: routeError.fieldErrors,
                    })
                );
                throw new Error(routeError.message ?? "Authentication request failed.");
            }
        },
        // Register User
        // POST /api/auth/register
        register: async (payload) => {
            dispatch(requestPending());
            try {
                const response = await axios.post<IAuthRouteResponse>(API.AUTH_REGISTER_ROUTE, payload, {
                    headers: { "Content-Type": "application/json" },
                });
                const body = response.data;
                if (!body.homePath) {
                    throw new Error("Authentication request failed.");
                }
                dispatch(requestSuccess());
                return { homePath: body.homePath };
            } catch (error) {
                const routeError = parseRouteError(error, "Authentication request failed.");
                dispatch(
                    requestErrorWithFields({
                        errorMessage: routeError.message ?? "Authentication request failed.",
                        fieldErrors: routeError.fieldErrors,
                    })
                );
                throw new Error(routeError.message ?? "Authentication request failed.");
            }
        },
        // Logout User
        // POST /api/auth/logout
        logout: async () => {
            dispatch(requestPending());
            try {
                await axios.post(API.AUTH_LOGOUT_ROUTE);
                dispatch(requestSuccess());
            } catch (error) {
                const routeError = parseRouteError(error, "Unable to log out.");
                dispatch(requestErrorWithFields({ errorMessage: routeError.message ?? "Unable to log out." }));
                throw new Error(routeError.message ?? "Unable to log out.");
            }
        },
        // Get Current Home Path
        // GET /api/auth/me
        getCurrentHomePath: async () => {
            const response = await axios.get<ICurrentUserResponse>(API.AUTH_ME_ROUTE);
            const body = response.data;
            if (!body.user?.homePath) {
                throw new Error("Unable to check current approval status.");
            }

            return body.user.homePath;
        },
        clearError: () => dispatch(clearError()),
    };

    return (
        <AuthStateContext.Provider value={state}>
            <AuthActionContext.Provider value={actions}>{children}</AuthActionContext.Provider>
        </AuthStateContext.Provider>
    );
};

export const useAuthState = (): IAuthStateContext => {
    return useContext(AuthStateContext);
};

export const useAuthActions = (): IAuthActionContext => {
    const context = useContext(AuthActionContext);
    if (!context) {
        throw new Error("useAuthActions must be used within an AuthProvider.");
    }

    return context;
};
