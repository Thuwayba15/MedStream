import { handleActions } from "redux-actions";
import { AdminGovernanceActionEnums, IAdminGovernanceStatePayload } from "./actions";
import { IAdminGovernanceStateContext, INITIAL_STATE } from "./context";

export const adminGovernanceReducer = handleActions<IAdminGovernanceStateContext, IAdminGovernanceStatePayload>(
    {
        [AdminGovernanceActionEnums.loadStarted]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [AdminGovernanceActionEnums.loadSucceeded]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [AdminGovernanceActionEnums.loadFailed]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [AdminGovernanceActionEnums.mutationStarted]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [AdminGovernanceActionEnums.mutationSucceeded]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [AdminGovernanceActionEnums.mutationFailed]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [AdminGovernanceActionEnums.setSearchText]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [AdminGovernanceActionEnums.setApprovalFilter]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [AdminGovernanceActionEnums.clearMessages]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
    },
    INITIAL_STATE
);
