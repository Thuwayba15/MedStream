import { createAction } from "redux-actions";
import type { IAuthStateContext } from "./context";

export enum AuthActionEnums {
    requestPending = "AUTH_REQUEST_PENDING",
    requestSuccess = "AUTH_REQUEST_SUCCESS",
    requestError = "AUTH_REQUEST_ERROR",
    clearError = "AUTH_CLEAR_ERROR",
}

export type IAuthStatePayload = Partial<IAuthStateContext>;

export const requestPending = createAction<IAuthStatePayload>(AuthActionEnums.requestPending, () => ({
    isPending: true,
    isSuccess: false,
    isError: false,
    errorMessage: undefined,
}));

export const requestSuccess = createAction<IAuthStatePayload>(AuthActionEnums.requestSuccess, () => ({
    isPending: false,
    isSuccess: true,
    isError: false,
    errorMessage: undefined,
}));

export const requestError = createAction<IAuthStatePayload, string>(AuthActionEnums.requestError, (errorMessage: string) => ({
    isPending: false,
    isSuccess: false,
    isError: true,
    errorMessage,
}));

export const clearError = createAction<IAuthStatePayload>(AuthActionEnums.clearError, () => ({
    isPending: false,
    isSuccess: false,
    isError: false,
    errorMessage: undefined,
}));

export type IAuthStateAction = {
    type: AuthActionEnums;
    payload: IAuthStatePayload;
};
