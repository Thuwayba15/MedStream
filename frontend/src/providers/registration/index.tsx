"use client";

import axios from "axios";
import { useContext, useReducer } from "react";
import { API } from "@/constants/api";
import { clearError, loadFailed, loadStarted, loadSucceeded } from "./actions";
import { INITIAL_STATE, IRegistrationActionContext, IRegistrationStateContext, RegistrationActionContext, RegistrationStateContext } from "./context";
import { registrationReducer } from "./reducer";

interface IActiveFacilitiesResponse {
    facilities: Array<{ id: number; name: string }>;
}

export const RegistrationProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, dispatch] = useReducer(registrationReducer, INITIAL_STATE);

    const actions: IRegistrationActionContext = {
        // Get Active Facilities
        // GET /api/auth/facilities/active
        loadFacilities: async () => {
            dispatch(loadStarted());
            try {
                const response = await axios.get<IActiveFacilitiesResponse>(API.ACTIVE_FACILITIES_ROUTE);
                dispatch(loadSucceeded(response.data.facilities ?? []));
            } catch (error) {
                const message = axios.isAxiosError<{ message?: string }>(error)
                    ? error.response?.data?.message ?? error.message
                    : error instanceof Error
                      ? error.message
                      : "Unable to load facilities.";
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
};

export const useRegistrationState = (): IRegistrationStateContext => {
    return useContext(RegistrationStateContext);
};

export const useRegistrationActions = (): IRegistrationActionContext => {
    const context = useContext(RegistrationActionContext);
    if (!context) {
        throw new Error("useRegistrationActions must be used within a RegistrationProvider.");
    }

    return context;
};
