import { IRegistrationFacilityOption, IRegistrationStateContext } from "./context";

export enum RegistrationActionEnums {
    loadStarted = "REGISTRATION_LOAD_STARTED",
    loadSucceeded = "REGISTRATION_LOAD_SUCCEEDED",
    loadFailed = "REGISTRATION_LOAD_FAILED",
    clearError = "REGISTRATION_CLEAR_ERROR",
}

export interface IRegistrationStateAction {
    type: RegistrationActionEnums;
    payload: Partial<IRegistrationStateContext>;
}

export const loadStarted = (): IRegistrationStateAction => ({
    type: RegistrationActionEnums.loadStarted,
    payload: {
        isLoading: true,
        errorMessage: undefined,
    },
});

export const loadSucceeded = (facilities: IRegistrationFacilityOption[]): IRegistrationStateAction => ({
    type: RegistrationActionEnums.loadSucceeded,
    payload: {
        isLoading: false,
        facilities,
        errorMessage: undefined,
    },
});

export const loadFailed = (errorMessage: string): IRegistrationStateAction => ({
    type: RegistrationActionEnums.loadFailed,
    payload: {
        isLoading: false,
        errorMessage,
    },
});

export const clearError = (): IRegistrationStateAction => ({
    type: RegistrationActionEnums.clearError,
    payload: {
        errorMessage: undefined,
    },
});
