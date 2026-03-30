import { createAction } from "redux-actions";
import type { IClinicianQueueItem } from "@/services/queue-operations/types";
import type { IClinicianQueueStateContext, TQueueTabFilter } from "./context";

export enum ClinicianQueueActionEnums {
    loadStarted = "CLINICIAN_QUEUE_LOAD_STARTED",
    loadSucceeded = "CLINICIAN_QUEUE_LOAD_SUCCEEDED",
    loadFailed = "CLINICIAN_QUEUE_LOAD_FAILED",
    setSearchText = "CLINICIAN_QUEUE_SET_SEARCH_TEXT",
    setQueueStatusFilter = "CLINICIAN_QUEUE_SET_STATUS_FILTER",
    setUrgencyTabFilter = "CLINICIAN_QUEUE_SET_URGENCY_FILTER",
    clearError = "CLINICIAN_QUEUE_CLEAR_ERROR",
}

export interface IClinicianQueueStateAction {
    type: ClinicianQueueActionEnums;
    payload: IClinicianQueueStatePayload;
}

export type IClinicianQueueStatePayload = Partial<IClinicianQueueStateContext>;

export const loadStarted = createAction<IClinicianQueueStatePayload, "initial" | "refresh">(ClinicianQueueActionEnums.loadStarted, (mode) => ({
    isLoading: mode === "initial",
    isRefreshing: mode === "refresh",
    errorMessage: undefined,
}));

export const loadSucceeded = createAction<IClinicianQueueStatePayload, IClinicianQueueItem[], number>(ClinicianQueueActionEnums.loadSucceeded, (items, totalCount) => ({
    items,
    totalCount,
    isLoading: false,
    isRefreshing: false,
    errorMessage: undefined,
    lastLoadedAt: new Date().toISOString(),
}));

export const loadFailed = createAction<IClinicianQueueStatePayload, string>(ClinicianQueueActionEnums.loadFailed, (message) => ({
    isLoading: false,
    isRefreshing: false,
    errorMessage: message,
}));

export const setSearchText = createAction<IClinicianQueueStatePayload, string>(ClinicianQueueActionEnums.setSearchText, (value) => ({
    searchText: value,
}));

export const setQueueStatusFilter = createAction<IClinicianQueueStatePayload, IClinicianQueueStateContext["queueStatusFilter"]>(ClinicianQueueActionEnums.setQueueStatusFilter, (value) => ({
    queueStatusFilter: value,
}));

export const setUrgencyTabFilter = createAction<IClinicianQueueStatePayload, TQueueTabFilter>(ClinicianQueueActionEnums.setUrgencyTabFilter, (value) => ({
    urgencyTabFilter: value,
}));

export const clearError = createAction<IClinicianQueueStatePayload>(ClinicianQueueActionEnums.clearError, () => ({
    errorMessage: undefined,
}));
