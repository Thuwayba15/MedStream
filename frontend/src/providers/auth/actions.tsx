import type { IAuthStateContext } from "./context";

export enum AuthActionEnums {
    requestPending = "AUTH_REQUEST_PENDING",
    requestSuccess = "AUTH_REQUEST_SUCCESS",
    requestError = "AUTH_REQUEST_ERROR",
    clearError = "AUTH_CLEAR_ERROR",
}

export interface IAuthStateAction {
    type: AuthActionEnums;
    payload: IAuthStateContext;
}

export const requestPending = (): IAuthStateAction => ({
    type: AuthActionEnums.requestPending,
    payload: {
        isPending: true,
        isSuccess: false,
        isError: false,
        errorMessage: undefined,
    },
});

export const requestSuccess = (): IAuthStateAction => ({
    type: AuthActionEnums.requestSuccess,
    payload: {
        isPending: false,
        isSuccess: true,
        isError: false,
        errorMessage: undefined,
    },
});

export const requestError = (errorMessage: string): IAuthStateAction => ({
    type: AuthActionEnums.requestError,
    payload: {
        isPending: false,
        isSuccess: false,
        isError: true,
        errorMessage,
    },
});

export const clearError = (): IAuthStateAction => ({
    type: AuthActionEnums.clearError,
    payload: {
        isPending: false,
        isSuccess: false,
        isError: false,
        errorMessage: undefined,
    },
});
