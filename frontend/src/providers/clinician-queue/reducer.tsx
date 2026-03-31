import { handleActions } from "redux-actions";
import { ClinicianQueueActionEnums, type IClinicianQueueStatePayload } from "./actions";
import { INITIAL_STATE, type IClinicianQueueStateContext } from "./context";

export const clinicianQueueReducer = handleActions<IClinicianQueueStateContext, IClinicianQueueStatePayload>(
    {
        [ClinicianQueueActionEnums.loadStarted]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianQueueActionEnums.loadSucceeded]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianQueueActionEnums.loadFailed]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianQueueActionEnums.setSearchText]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianQueueActionEnums.setQueueStatusFilter]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianQueueActionEnums.setUrgencyTabFilter]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianQueueActionEnums.setPage]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianQueueActionEnums.clearError]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
    },
    INITIAL_STATE
);
