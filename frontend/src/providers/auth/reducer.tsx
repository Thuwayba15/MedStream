import { handleActions } from "redux-actions";
import { AuthActionEnums, type IAuthStatePayload } from "./actions";
import { INITIAL_STATE, type IAuthStateContext } from "./context";

export const authReducer = handleActions<IAuthStateContext, IAuthStatePayload>(
    {
        [AuthActionEnums.requestPending]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [AuthActionEnums.requestSuccess]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [AuthActionEnums.requestError]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [AuthActionEnums.clearError]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
    },
    INITIAL_STATE
);
