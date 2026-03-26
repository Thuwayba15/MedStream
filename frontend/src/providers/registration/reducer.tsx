import { handleActions } from "redux-actions";
import { IRegistrationStatePayload, RegistrationActionEnums } from "./actions";
import { INITIAL_STATE, IRegistrationStateContext } from "./context";

export const registrationReducer = handleActions<IRegistrationStateContext, IRegistrationStatePayload>(
    {
        [RegistrationActionEnums.loadStarted]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [RegistrationActionEnums.loadSucceeded]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [RegistrationActionEnums.loadFailed]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [RegistrationActionEnums.clearError]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
    },
    INITIAL_STATE
);
