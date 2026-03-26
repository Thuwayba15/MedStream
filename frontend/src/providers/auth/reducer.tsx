import { AuthActionEnums, type IAuthStateAction } from "./actions";
import type { IAuthStateContext } from "./context";

export function authReducer(state: IAuthStateContext, action: IAuthStateAction): IAuthStateContext {
    switch (action.type) {
        case AuthActionEnums.requestPending:
        case AuthActionEnums.requestSuccess:
        case AuthActionEnums.requestError:
        case AuthActionEnums.clearError:
            return {
                ...state,
                ...action.payload,
            };
        default:
            return state;
    }
}
