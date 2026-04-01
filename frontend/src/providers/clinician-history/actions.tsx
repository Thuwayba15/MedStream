import { createAction } from "redux-actions";
import type { IPatientTimeline } from "@/services/patient-timeline/types";
import type { IClinicianHistoryStateContext } from "./context";

export enum ClinicianHistoryActionEnums {
    loadTimelineStarted = "CLINICIAN_HISTORY_LOAD_STARTED",
    loadTimelineSucceeded = "CLINICIAN_HISTORY_LOAD_SUCCEEDED",
    loadTimelineFailed = "CLINICIAN_HISTORY_LOAD_FAILED",
    clearTimeline = "CLINICIAN_HISTORY_CLEAR",
}

export interface IClinicianHistoryStateAction {
    type: ClinicianHistoryActionEnums;
    payload: IClinicianHistoryStatePayload;
}

export type IClinicianHistoryStatePayload = Partial<IClinicianHistoryStateContext>;

export const loadTimelineStarted = createAction<IClinicianHistoryStatePayload, number>(ClinicianHistoryActionEnums.loadTimelineStarted, (patientUserId) => ({
    patientUserId,
    isLoadingTimeline: true,
    errorMessage: undefined,
}));

export const loadTimelineSucceeded = createAction<IClinicianHistoryStatePayload, number, IPatientTimeline>(
    ClinicianHistoryActionEnums.loadTimelineSucceeded,
    (patientUserId, timeline) => ({
        patientUserId,
        timeline,
        isLoadingTimeline: false,
        errorMessage: undefined,
    })
);

export const loadTimelineFailed = createAction<IClinicianHistoryStatePayload, number, string>(ClinicianHistoryActionEnums.loadTimelineFailed, (patientUserId, errorMessage) => ({
    patientUserId,
    timeline: null,
    isLoadingTimeline: false,
    errorMessage,
}));

export const clearTimeline = createAction<IClinicianHistoryStatePayload>(ClinicianHistoryActionEnums.clearTimeline, () => ({
    patientUserId: undefined,
    timeline: null,
    isLoadingTimeline: false,
    errorMessage: undefined,
}));
