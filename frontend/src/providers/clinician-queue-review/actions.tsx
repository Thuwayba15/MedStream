import { createAction } from "redux-actions";
import type { IClinicianQueueReviewStateContext } from "./context";
import type { IClinicianQueueReview, TQueueStatus } from "@/services/queue-operations/types";

export enum ClinicianQueueReviewActionEnums {
    loadReviewStarted = "CLINICIAN_QUEUE_REVIEW_LOAD_STARTED",
    loadReviewSucceeded = "CLINICIAN_QUEUE_REVIEW_LOAD_SUCCEEDED",
    loadReviewFailed = "CLINICIAN_QUEUE_REVIEW_LOAD_FAILED",
    updateStatusStarted = "CLINICIAN_QUEUE_REVIEW_UPDATE_STARTED",
    updateStatusSucceeded = "CLINICIAN_QUEUE_REVIEW_UPDATE_SUCCEEDED",
    updateStatusFailed = "CLINICIAN_QUEUE_REVIEW_UPDATE_FAILED",
    overrideUrgencyStarted = "CLINICIAN_QUEUE_REVIEW_OVERRIDE_URGENCY_STARTED",
    overrideUrgencySucceeded = "CLINICIAN_QUEUE_REVIEW_OVERRIDE_URGENCY_SUCCEEDED",
    overrideUrgencyFailed = "CLINICIAN_QUEUE_REVIEW_OVERRIDE_URGENCY_FAILED",
    clearMessages = "CLINICIAN_QUEUE_REVIEW_CLEAR_MESSAGES",
}

export interface IClinicianQueueReviewStateAction {
    type: ClinicianQueueReviewActionEnums;
    payload: IClinicianQueueReviewStatePayload;
}

export type IClinicianQueueReviewStatePayload = Partial<IClinicianQueueReviewStateContext>;

export const loadReviewStarted = createAction<IClinicianQueueReviewStatePayload>(ClinicianQueueReviewActionEnums.loadReviewStarted, () => ({
    isLoadingReview: true,
    errorMessage: undefined,
    successMessage: undefined,
}));

export const loadReviewSucceeded = createAction<IClinicianQueueReviewStatePayload, IClinicianQueueReview>(ClinicianQueueReviewActionEnums.loadReviewSucceeded, (review) => ({
    review,
    isLoadingReview: false,
    errorMessage: undefined,
}));

export const loadReviewFailed = createAction<IClinicianQueueReviewStatePayload, string>(ClinicianQueueReviewActionEnums.loadReviewFailed, (message) => ({
    isLoadingReview: false,
    errorMessage: message,
}));

export const updateStatusStarted = createAction<IClinicianQueueReviewStatePayload>(ClinicianQueueReviewActionEnums.updateStatusStarted, () => ({
    isUpdatingStatus: true,
    errorMessage: undefined,
    successMessage: undefined,
}));

export const updateStatusSucceeded = createAction<IClinicianQueueReviewStatePayload, TQueueStatus, string>(
    ClinicianQueueReviewActionEnums.updateStatusSucceeded,
    (newStatus, currentStage) => ({
        isUpdatingStatus: false,
        successMessage: `Queue status updated to ${newStatus.replace("_", " ")} (${currentStage}).`,
    })
);

export const updateStatusFailed = createAction<IClinicianQueueReviewStatePayload, string>(ClinicianQueueReviewActionEnums.updateStatusFailed, (message) => ({
    isUpdatingStatus: false,
    errorMessage: message,
}));

export const overrideUrgencyStarted = createAction<IClinicianQueueReviewStatePayload>(ClinicianQueueReviewActionEnums.overrideUrgencyStarted, () => ({
    isUpdatingStatus: true,
    errorMessage: undefined,
    successMessage: undefined,
}));

export const overrideUrgencySucceeded = createAction<IClinicianQueueReviewStatePayload, string>(ClinicianQueueReviewActionEnums.overrideUrgencySucceeded, (urgencyLevel) => ({
    isUpdatingStatus: false,
    successMessage: `Urgency updated to ${urgencyLevel}.`,
}));

export const overrideUrgencyFailed = createAction<IClinicianQueueReviewStatePayload, string>(ClinicianQueueReviewActionEnums.overrideUrgencyFailed, (message) => ({
    isUpdatingStatus: false,
    errorMessage: message,
}));

export const clearMessages = createAction<IClinicianQueueReviewStatePayload>(ClinicianQueueReviewActionEnums.clearMessages, () => ({
    errorMessage: undefined,
    successMessage: undefined,
}));
