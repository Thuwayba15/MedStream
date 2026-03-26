import { AdminGovernanceActionEnums, IAdminGovernanceStateAction } from "./actions";
import { IAdminGovernanceStateContext } from "./context";

export function adminGovernanceReducer(
    state: IAdminGovernanceStateContext,
    action: IAdminGovernanceStateAction
): IAdminGovernanceStateContext {
    switch (action.type) {
        case AdminGovernanceActionEnums.loadStarted:
        case AdminGovernanceActionEnums.loadSucceeded:
        case AdminGovernanceActionEnums.loadFailed:
        case AdminGovernanceActionEnums.mutationStarted:
        case AdminGovernanceActionEnums.mutationSucceeded:
        case AdminGovernanceActionEnums.mutationFailed:
        case AdminGovernanceActionEnums.setSearchText:
        case AdminGovernanceActionEnums.setApprovalFilter:
        case AdminGovernanceActionEnums.clearMessages:
            return {
                ...state,
                ...action.payload,
            };
        default:
            return state;
    }
}
