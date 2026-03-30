import { handleActions } from "redux-actions";
import { INITIAL_STATE, type IPatientIntakeStateContext } from "./context";
import { IPatientIntakeStatePayload, PatientIntakeActionEnums } from "./actions";

export const patientIntakeReducer = handleActions<IPatientIntakeStateContext, IPatientIntakeStatePayload>(
    {
        [PatientIntakeActionEnums.initializeStarted]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [PatientIntakeActionEnums.initializeSucceeded]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [PatientIntakeActionEnums.processingStarted]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [PatientIntakeActionEnums.setStep]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [PatientIntakeActionEnums.setFreeText]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [PatientIntakeActionEnums.setSelectedFacilityId]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [PatientIntakeActionEnums.toggleSymptom]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [PatientIntakeActionEnums.setAnswer]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [PatientIntakeActionEnums.symptomProcessingSucceeded]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [PatientIntakeActionEnums.urgentCheckSucceeded]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [PatientIntakeActionEnums.followUpQuestionsLoaded]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [PatientIntakeActionEnums.triageSucceeded]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [PatientIntakeActionEnums.queuedVisitRestored]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [PatientIntakeActionEnums.actionFailed]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [PatientIntakeActionEnums.clearError]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
    },
    INITIAL_STATE
);
