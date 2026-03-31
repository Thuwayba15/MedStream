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
    setPage = "CLINICIAN_QUEUE_SET_PAGE",
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

export const loadSucceeded = createAction<IClinicianQueueStatePayload, IClinicianQueueItem[], number, IClinicianQueueStateContext["summary"]>(
    ClinicianQueueActionEnums.loadSucceeded,
    (items, totalCount, summary) => ({
        items,
        totalCount,
        summary,
        isLoading: false,
        isRefreshing: false,
        errorMessage: undefined,
        lastLoadedAt: new Date().toISOString(),
    })
);

export const loadFailed = createAction<IClinicianQueueStatePayload, string>(ClinicianQueueActionEnums.loadFailed, (message) => ({
    isLoading: false,
    isRefreshing: false,
    errorMessage: message,
}));

export const setSearchText = createAction<IClinicianQueueStatePayload, string>(ClinicianQueueActionEnums.setSearchText, (value) => ({
    searchText: value,
    page: 1,
}));

export const setQueueStatusFilter = createAction<IClinicianQueueStatePayload, IClinicianQueueStateContext["queueStatusFilter"]>(ClinicianQueueActionEnums.setQueueStatusFilter, (value) => ({
    queueStatusFilter: value,
    page: 1,
}));

export const setUrgencyTabFilter = createAction<IClinicianQueueStatePayload, TQueueTabFilter>(ClinicianQueueActionEnums.setUrgencyTabFilter, (value) => ({
    urgencyTabFilter: value,
    page: 1,
}));

export const setPage = createAction<IClinicianQueueStatePayload, number, number | undefined>(ClinicianQueueActionEnums.setPage, (page, pageSize) => ({
    page,
    pageSize: pageSize && pageSize > 0 ? pageSize : undefined,
}));

export const clearError = createAction<IClinicianQueueStatePayload>(ClinicianQueueActionEnums.clearError, () => ({
    errorMessage: undefined,
}));
