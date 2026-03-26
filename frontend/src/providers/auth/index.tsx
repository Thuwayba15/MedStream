"use client";

import { useContext, useReducer } from "react";
import { API } from "@/constants/api";
import { clearError, requestError, requestPending, requestSuccess } from "./actions";
import { AuthActionContext, AuthStateContext, INITIAL_STATE, type IAuthActionContext, type IAuthStateContext } from "./context";
import { authReducer } from "./reducer";

interface IMessageResponse {
    message?: string;
}

interface IAuthRouteResponse {
    homePath?: string;
}

interface ICurrentUserResponse {
    user?: {
        homePath?: string;
    };
}

export function AuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
    const [state, dispatch] = useReducer(authReducer, INITIAL_STATE);

    async function parseResponse<TResponse>(response: Response, fallbackMessage: string): Promise<TResponse> {
        const body = (await response.json()) as TResponse & IMessageResponse;
        if (!response.ok) {
            throw new Error(body.message ?? fallbackMessage);
        }

        return body;
    }

    const actions: IAuthActionContext = {
        login: async (payload) => {
            dispatch(requestPending());
            try {
                const response = await fetch(API.AUTH_LOGIN_ROUTE, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                const body = await parseResponse<IAuthRouteResponse>(response, "Authentication request failed.");
                if (!body.homePath) {
                    throw new Error("Authentication request failed.");
                }
                dispatch(requestSuccess());
                return { homePath: body.homePath };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Authentication request failed.";
                dispatch(requestError(errorMessage));
                throw new Error(errorMessage);
            }
        },
        register: async (payload) => {
            dispatch(requestPending());
            try {
                const response = await fetch(API.AUTH_REGISTER_ROUTE, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                const body = await parseResponse<IAuthRouteResponse>(response, "Authentication request failed.");
                if (!body.homePath) {
                    throw new Error("Authentication request failed.");
                }
                dispatch(requestSuccess());
                return { homePath: body.homePath };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Authentication request failed.";
                dispatch(requestError(errorMessage));
                throw new Error(errorMessage);
            }
        },
        logout: async () => {
            dispatch(requestPending());
            try {
                const response = await fetch(API.AUTH_LOGOUT_ROUTE, { method: "POST" });
                await parseResponse<Record<string, unknown>>(response, "Unable to log out.");
                dispatch(requestSuccess());
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Unable to log out.";
                dispatch(requestError(errorMessage));
                throw new Error(errorMessage);
            }
        },
        getCurrentHomePath: async () => {
            const response = await fetch(API.AUTH_ME_ROUTE);
            const body = await parseResponse<ICurrentUserResponse>(response, "Unable to check current approval status.");
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
}

export function useAuthState(): IAuthStateContext {
    return useContext(AuthStateContext);
}

export function useAuthActions(): IAuthActionContext {
    const context = useContext(AuthActionContext);
    if (!context) {
        throw new Error("useAuthActions must be used within an AuthProvider.");
    }

    return context;
}
