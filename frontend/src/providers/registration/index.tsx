"use client";

import { useContext, useReducer } from "react";
import { clearError, loadFailed, loadStarted, loadSucceeded } from "./actions";
import { INITIAL_STATE, IRegistrationActionContext, IRegistrationStateContext, RegistrationActionContext, RegistrationStateContext } from "./context";
import { registrationReducer } from "./reducer";
import { adminGovernanceService } from "@/services/admin-governance/adminGovernanceService";

export function RegistrationProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
    const [state, dispatch] = useReducer(registrationReducer, INITIAL_STATE);

    const actions: IRegistrationActionContext = {
        loadFacilities: async () => {
            dispatch(loadStarted());
            try {
                const facilities = await adminGovernanceService.getActiveFacilities();
                dispatch(loadSucceeded(facilities));
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
