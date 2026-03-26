import { createAction } from "redux-actions";
import { IRegistrationFacilityOption, IRegistrationStateContext } from "./context";

export enum RegistrationActionEnums {
    loadStarted = "REGISTRATION_LOAD_STARTED",
    loadSucceeded = "REGISTRATION_LOAD_SUCCEEDED",
    loadFailed = "REGISTRATION_LOAD_FAILED",
    clearError = "REGISTRATION_CLEAR_ERROR",
}

export interface IRegistrationStateAction {
    type: RegistrationActionEnums;
    payload: IRegistrationStatePayload;
}

export type IRegistrationStatePayload = Partial<IRegistrationStateContext>;

export const loadStarted = createAction<IRegistrationStatePayload>(RegistrationActionEnums.loadStarted, () => ({
    isLoading: true,
    errorMessage: undefined,
}));

export const loadSucceeded = createAction<IRegistrationStatePayload, IRegistrationFacilityOption[]>(RegistrationActionEnums.loadSucceeded, (facilities: IRegistrationFacilityOption[]) => ({
    isLoading: false,
    facilities,
    errorMessage: undefined,
}));

export const loadFailed = createAction<IRegistrationStatePayload, string>(RegistrationActionEnums.loadFailed, (errorMessage: string) => ({
    isLoading: false,
    errorMessage,
}));

export const clearError = createAction<IRegistrationStatePayload>(RegistrationActionEnums.clearError, () => ({
    errorMessage: undefined,
}));
