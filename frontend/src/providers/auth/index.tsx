"use client";

import { useContext, useReducer } from "react";
import { clearError, requestError, requestPending, requestSuccess } from "./actions";
import { AuthActionContext, AuthStateContext, INITIAL_STATE, type IAuthActionContext, type IAuthStateContext } from "./context";
import { authReducer } from "./reducer";

interface IApiSuccessResponse {
    homePath?: string;
}

interface IApiErrorResponse {
    message?: string;
}

export function AuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
    const [state, dispatch] = useReducer(authReducer, INITIAL_STATE);

    const executeAuthRequest = async <TRequest extends object>(
        path: "/api/auth/login" | "/api/auth/register",
        payload: TRequest,
    ): Promise<{ homePath: string }> => {
        dispatch(requestPending());

        try {
            const response = await fetch(path, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const responseBody = (await response.json()) as IApiSuccessResponse & IApiErrorResponse;
            if (!response.ok || !responseBody.homePath) {
                throw new Error(responseBody.message ?? "Authentication request failed.");
            }

            dispatch(requestSuccess());
            return { homePath: responseBody.homePath };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Authentication request failed.";
            dispatch(requestError(errorMessage));
            throw new Error(errorMessage);
        }
    };

    const actions: IAuthActionContext = {
        login: async (payload) => executeAuthRequest("/api/auth/login", payload),
        register: async (payload) => executeAuthRequest("/api/auth/register", payload),
        logout: async () => {
            dispatch(requestPending());
            try {
                await fetch("/api/auth/logout", { method: "POST" });
                dispatch(requestSuccess());
            } catch {
                dispatch(requestError("Unable to log out."));
            }
        },
        clearError: () => dispatch(clearError()),
    };

    return (
        <AuthStateContext.Provider value={state}>
            <AuthActionContext.Provider value={actions}>
                {children}
            </AuthActionContext.Provider>
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
