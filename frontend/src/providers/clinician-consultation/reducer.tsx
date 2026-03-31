import { handleActions } from "redux-actions";
import { ClinicianConsultationActionEnums, type IClinicianConsultationStatePayload } from "./actions";
import { INITIAL_STATE, type IClinicianConsultationStateContext } from "./context";

export const clinicianConsultationReducer = handleActions<IClinicianConsultationStateContext, IClinicianConsultationStatePayload>(
    {
        [ClinicianConsultationActionEnums.loadInboxStarted]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianConsultationActionEnums.loadInboxSucceeded]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianConsultationActionEnums.loadInboxFailed]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianConsultationActionEnums.loadWorkspaceStarted]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianConsultationActionEnums.loadWorkspaceSucceeded]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianConsultationActionEnums.loadWorkspaceFailed]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianConsultationActionEnums.saveDraftStarted]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianConsultationActionEnums.saveDraftSucceeded]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianConsultationActionEnums.saveDraftFailed]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianConsultationActionEnums.saveVitalsStarted]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianConsultationActionEnums.saveVitalsSucceeded]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianConsultationActionEnums.saveVitalsFailed]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianConsultationActionEnums.attachTranscriptStarted]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianConsultationActionEnums.attachTranscriptSucceeded]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianConsultationActionEnums.attachTranscriptFailed]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianConsultationActionEnums.generateSubjectiveStarted]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianConsultationActionEnums.generateSubjectiveSucceeded]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianConsultationActionEnums.generateSubjectiveFailed]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianConsultationActionEnums.generateAssessmentPlanStarted]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianConsultationActionEnums.generateAssessmentPlanSucceeded]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianConsultationActionEnums.generateAssessmentPlanFailed]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianConsultationActionEnums.finalizeStarted]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianConsultationActionEnums.finalizeSucceeded]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianConsultationActionEnums.finalizeFailed]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianConsultationActionEnums.completeVisitStarted]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianConsultationActionEnums.completeVisitSucceeded]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianConsultationActionEnums.completeVisitFailed]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
        [ClinicianConsultationActionEnums.clearMessages]: (state, action) => ({
            ...state,
            ...action.payload,
        }),
    },
    INITIAL_STATE
);
