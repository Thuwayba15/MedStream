import { handleActions } from "redux-actions";
import { ClinicianHistoryActionEnums, type IClinicianHistoryStatePayload } from "./actions";
import { INITIAL_STATE, type IClinicianHistoryStateContext } from "./context";

export const clinicianHistoryReducer = handleActions<IClinicianHistoryStateContext, IClinicianHistoryStatePayload>(
    {
        [ClinicianHistoryActionEnums.loadTimelineStarted]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianHistoryActionEnums.loadTimelineSucceeded]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianHistoryActionEnums.loadTimelineFailed]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianHistoryActionEnums.clearTimeline]: (_state, action) => ({
            ...INITIAL_STATE,
            ...action.payload,
        }),
    },
    INITIAL_STATE
);
