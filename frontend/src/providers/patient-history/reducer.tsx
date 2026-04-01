import { handleActions } from "redux-actions";
import { PatientHistoryActionEnums, type IPatientHistoryStatePayload } from "./actions";
import { INITIAL_STATE, type IPatientHistoryStateContext } from "./context";

export const patientHistoryReducer = handleActions<IPatientHistoryStateContext, IPatientHistoryStatePayload>(
    {
        [PatientHistoryActionEnums.loadTimelineStarted]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [PatientHistoryActionEnums.loadTimelineSucceeded]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [PatientHistoryActionEnums.loadTimelineFailed]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
    },
    INITIAL_STATE
);
