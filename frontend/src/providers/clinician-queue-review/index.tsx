"use client";

import axios from "axios";
import { useCallback, useContext, useMemo, useReducer } from "react";
import { API } from "@/constants/api";
import type { IClinicianQueueReview, IOverrideQueueUrgencyResponse, IUpdateQueueStatusResponse, TQueueStatus, TUrgencyLevel } from "@/services/queue-operations/types";
import {
    clearMessages,
    loadReviewFailed,
    loadReviewStarted,
    loadReviewSucceeded,
    overrideUrgencyFailed,
    overrideUrgencyStarted,
    overrideUrgencySucceeded,
    updateStatusFailed,
    updateStatusStarted,
    updateStatusSucceeded,
} from "./actions";
import { ClinicianQueueReviewActionContext, ClinicianQueueReviewStateContext, INITIAL_STATE, type IClinicianQueueReviewActionContext, type IClinicianQueueReviewStateContext } from "./context";
import { clinicianQueueReviewReducer } from "./reducer";

interface IMessageResponse {
    message?: string;
}

const parseRouteError = (error: unknown, fallbackMessage: string): Error => {
    if (axios.isAxiosError<IMessageResponse>(error)) {
        return new Error(error.response?.data?.message ?? fallbackMessage);
    }

    return error instanceof Error ? error : new Error(fallbackMessage);
};

export const ClinicianQueueReviewProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, dispatch] = useReducer(clinicianQueueReviewReducer, INITIAL_STATE);

    const loadReview = useCallback(async (queueTicketId: number): Promise<void> => {
        dispatch(loadReviewStarted());
        try {
            // Get Queue Review
            // GET /api/clinician/queue/{queueTicketId}
            const response = await axios.get<IClinicianQueueReview>(`${API.CLINICIAN_QUEUE_TICKET_ROUTE_PREFIX}/${queueTicketId}`);
            dispatch(loadReviewSucceeded(response.data));
        } catch (error) {
            dispatch(loadReviewFailed(parseRouteError(error, "Unable to load queue review.").message));
        }
    }, []);

    const updateQueueStatus = useCallback(
        async (queueTicketId: number, newStatus: TQueueStatus, note?: string): Promise<IUpdateQueueStatusResponse | null> => {
            dispatch(updateStatusStarted());
            try {
                // Update Queue Status
                // POST /api/clinician/queue/{queueTicketId}/status
                const response = await axios.post<IUpdateQueueStatusResponse>(`${API.CLINICIAN_QUEUE_TICKET_ROUTE_PREFIX}/${queueTicketId}/status`, {
                    newStatus,
                    note: note ?? "",
                });
                dispatch(updateStatusSucceeded(response.data.newStatus, response.data.currentStage));
                await loadReview(queueTicketId);
                return response.data;
            } catch (error) {
                dispatch(updateStatusFailed(parseRouteError(error, "Unable to update queue status.").message));
                return null;
            }
        },
        [loadReview]
    );

    const overrideUrgency = useCallback(
        async (queueTicketId: number, urgencyLevel: TUrgencyLevel, note?: string): Promise<IOverrideQueueUrgencyResponse | null> => {
            dispatch(overrideUrgencyStarted());
            try {
                // Override Queue Urgency
                // POST /api/clinician/queue/{queueTicketId}/urgency
                const response = await axios.post<IOverrideQueueUrgencyResponse>(`${API.CLINICIAN_QUEUE_TICKET_ROUTE_PREFIX}/${queueTicketId}/urgency`, {
                    urgencyLevel,
                    note: note ?? "",
                });
                dispatch(overrideUrgencySucceeded(response.data.urgencyLevel));
                await loadReview(queueTicketId);
                return response.data;
            } catch (error) {
                dispatch(overrideUrgencyFailed(parseRouteError(error, "Unable to override urgency.").message));
                return null;
            }
        },
        [loadReview]
    );

    const actions: IClinicianQueueReviewActionContext = useMemo(
        () => ({
            loadReview,
            updateQueueStatus,
            overrideUrgency,
            clearMessages: () => dispatch(clearMessages()),
        }),
        [loadReview, overrideUrgency, updateQueueStatus]
    );

    return (
        <ClinicianQueueReviewStateContext.Provider value={state}>
            <ClinicianQueueReviewActionContext.Provider value={actions}>{children}</ClinicianQueueReviewActionContext.Provider>
        </ClinicianQueueReviewStateContext.Provider>
    );
};

export const useClinicianQueueReviewState = (): IClinicianQueueReviewStateContext => {
    return useContext(ClinicianQueueReviewStateContext);
};

export const useClinicianQueueReviewActions = (): IClinicianQueueReviewActionContext => {
    const context = useContext(ClinicianQueueReviewActionContext);
    if (!context) {
        throw new Error("useClinicianQueueReviewActions must be used within a ClinicianQueueReviewProvider.");
    }

    return context;
};
