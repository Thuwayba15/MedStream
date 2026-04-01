import { createAction } from "redux-actions";
import type { IPatientTimeline } from "@/services/patient-timeline/types";
import type { IPatientHistoryStateContext } from "./context";

export enum PatientHistoryActionEnums {
    loadTimelineStarted = "PATIENT_HISTORY_LOAD_STARTED",
    loadTimelineSucceeded = "PATIENT_HISTORY_LOAD_SUCCEEDED",
    loadTimelineFailed = "PATIENT_HISTORY_LOAD_FAILED",
}

export interface IPatientHistoryStateAction {
    type: PatientHistoryActionEnums;
    payload: IPatientHistoryStatePayload;
}

export type IPatientHistoryStatePayload = Partial<IPatientHistoryStateContext>;

export const loadTimelineStarted = createAction<IPatientHistoryStatePayload>(PatientHistoryActionEnums.loadTimelineStarted, () => ({
    isLoadingTimeline: true,
    errorMessage: undefined,
}));

export const loadTimelineSucceeded = createAction<IPatientHistoryStatePayload, IPatientTimeline>(PatientHistoryActionEnums.loadTimelineSucceeded, (timeline) => ({
    timeline,
    isLoadingTimeline: false,
    errorMessage: undefined,
}));

export const loadTimelineFailed = createAction<IPatientHistoryStatePayload, string>(PatientHistoryActionEnums.loadTimelineFailed, (errorMessage) => ({
    timeline: null,
    isLoadingTimeline: false,
    errorMessage,
}));
