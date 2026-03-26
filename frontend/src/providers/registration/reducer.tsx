import { RegistrationActionEnums, IRegistrationStateAction } from "./actions";
import { IRegistrationStateContext } from "./context";

export function registrationReducer(state: IRegistrationStateContext, action: IRegistrationStateAction): IRegistrationStateContext {
    switch (action.type) {
        case RegistrationActionEnums.loadStarted:
        case RegistrationActionEnums.loadSucceeded:
        case RegistrationActionEnums.loadFailed:
        case RegistrationActionEnums.clearError:
            return {
                ...state,
                ...action.payload,
            };
        default:
            return state;
    }
}
