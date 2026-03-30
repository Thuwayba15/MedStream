"use client";

import { createContext } from "react";
import type { IClinicianQueueReview, IOverrideQueueUrgencyResponse, IUpdateQueueStatusResponse, TQueueStatus, TUrgencyLevel } from "@/services/queue-operations/types";

export interface IClinicianQueueReviewStateContext {
    review: IClinicianQueueReview | null;
    isLoadingReview: boolean;
    isUpdatingStatus: boolean;
    errorMessage?: string;
    successMessage?: string;
}

export interface IClinicianQueueReviewActionContext {
    loadReview: (queueTicketId: number) => Promise<void>;
    updateQueueStatus: (queueTicketId: number, newStatus: TQueueStatus, note?: string) => Promise<IUpdateQueueStatusResponse | null>;
    overrideUrgency: (queueTicketId: number, urgencyLevel: TUrgencyLevel, note?: string) => Promise<IOverrideQueueUrgencyResponse | null>;
    clearMessages: () => void;
}

export const INITIAL_STATE: IClinicianQueueReviewStateContext = {
    review: null,
    isLoadingReview: false,
    isUpdatingStatus: false,
    errorMessage: undefined,
    successMessage: undefined,
};

export const INITIAL_ACTION_STATE: IClinicianQueueReviewActionContext = {
    loadReview: async () => Promise.resolve(),
    updateQueueStatus: async () => null,
    overrideUrgency: async () => null,
    clearMessages: () => undefined,
};

export const ClinicianQueueReviewStateContext = createContext<IClinicianQueueReviewStateContext>(INITIAL_STATE);
export const ClinicianQueueReviewActionContext = createContext<IClinicianQueueReviewActionContext | undefined>(undefined);
