import { handleActions } from "redux-actions";
import { ClinicianQueueReviewActionEnums, type IClinicianQueueReviewStatePayload } from "./actions";
import { INITIAL_STATE, type IClinicianQueueReviewStateContext } from "./context";

export const clinicianQueueReviewReducer = handleActions<IClinicianQueueReviewStateContext, IClinicianQueueReviewStatePayload>(
    {
        [ClinicianQueueReviewActionEnums.loadReviewStarted]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianQueueReviewActionEnums.loadReviewSucceeded]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianQueueReviewActionEnums.loadReviewFailed]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianQueueReviewActionEnums.updateStatusStarted]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianQueueReviewActionEnums.updateStatusSucceeded]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianQueueReviewActionEnums.updateStatusFailed]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianQueueReviewActionEnums.overrideUrgencyStarted]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianQueueReviewActionEnums.overrideUrgencySucceeded]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianQueueReviewActionEnums.overrideUrgencyFailed]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianQueueReviewActionEnums.clearMessages]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
    },
    INITIAL_STATE
);
