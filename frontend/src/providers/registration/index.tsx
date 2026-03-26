"use client";

import { useContext, useReducer } from "react";
import { API } from "@/constants/api";
import { clearError, loadFailed, loadStarted, loadSucceeded } from "./actions";
import { INITIAL_STATE, IRegistrationActionContext, IRegistrationStateContext, RegistrationActionContext, RegistrationStateContext } from "./context";
import { registrationReducer } from "./reducer";

interface IMessageResponse {
    message?: string;
}

interface IActiveFacilitiesResponse {
    facilities: Array<{ id: number; name: string }>;
}

export function RegistrationProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
    const [state, dispatch] = useReducer(registrationReducer, INITIAL_STATE);

    const actions: IRegistrationActionContext = {
        loadFacilities: async () => {
            dispatch(loadStarted());
            try {
                const response = await fetch(API.ACTIVE_FACILITIES_ROUTE);
                const body = (await response.json()) as IActiveFacilitiesResponse & IMessageResponse;
                if (!response.ok) {
                    throw new Error(body.message ?? "Unable to load facilities.");
                }

                dispatch(loadSucceeded(body.facilities ?? []));
            } catch (error) {
                const message = error instanceof Error ? error.message : "Unable to load facilities.";
                dispatch(loadFailed(message));
            }
        },
        clearError: () => dispatch(clearError()),
    };

    return (
        <RegistrationStateContext.Provider value={state}>
            <RegistrationActionContext.Provider value={actions}>{children}</RegistrationActionContext.Provider>
        </RegistrationStateContext.Provider>
    );
}

export function useRegistrationState(): IRegistrationStateContext {
    return useContext(RegistrationStateContext);
}

export function useRegistrationActions(): IRegistrationActionContext {
    const context = useContext(RegistrationActionContext);
    if (!context) {
        throw new Error("useRegistrationActions must be used within a RegistrationProvider.");
    }

    return context;
}
