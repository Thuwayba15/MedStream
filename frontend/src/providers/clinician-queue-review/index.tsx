"use client";

import { useCallback, useContext, useMemo, useReducer } from "react";
import { API } from "@/constants/api";
import type { IClinicianQueueReview, IUpdateQueueStatusResponse, TQueueStatus } from "@/services/queue-operations/types";
import { clearMessages, loadReviewFailed, loadReviewStarted, loadReviewSucceeded, updateStatusFailed, updateStatusStarted, updateStatusSucceeded } from "./actions";
import { ClinicianQueueReviewActionContext, ClinicianQueueReviewStateContext, INITIAL_STATE, type IClinicianQueueReviewActionContext, type IClinicianQueueReviewStateContext } from "./context";
import { clinicianQueueReviewReducer } from "./reducer";

interface IMessageResponse {
    message?: string;
}

const parseResponse = async <TResponse,>(response: Response, fallbackMessage: string): Promise<TResponse> => {
    const body = (await response.json()) as TResponse & IMessageResponse;
    if (!response.ok) {
        throw new Error(body.message ?? fallbackMessage);
    }

    return body;
};

export const ClinicianQueueReviewProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, dispatch] = useReducer(clinicianQueueReviewReducer, INITIAL_STATE);

    const loadReview = useCallback(async (queueTicketId: number): Promise<void> => {
        dispatch(loadReviewStarted());
        try {
            const response = await fetch(`${API.CLINICIAN_QUEUE_TICKET_ROUTE_PREFIX}/${queueTicketId}`);
            const review = await parseResponse<IClinicianQueueReview>(response, "Unable to load queue review.");
            dispatch(loadReviewSucceeded(review));
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to load queue review.";
            dispatch(loadReviewFailed(message));
        }
    }, []);

    const updateQueueStatus = useCallback(async (queueTicketId: number, newStatus: TQueueStatus, note?: string): Promise<IUpdateQueueStatusResponse | null> => {
        dispatch(updateStatusStarted());
        try {
            const response = await fetch(`${API.CLINICIAN_QUEUE_TICKET_ROUTE_PREFIX}/${queueTicketId}/status`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    newStatus,
                    note: note ?? "",
                }),
            });

            const updateResult = await parseResponse<IUpdateQueueStatusResponse>(response, "Unable to update queue status.");
            dispatch(updateStatusSucceeded(updateResult.newStatus, updateResult.currentStage));
            await loadReview(queueTicketId);
            return updateResult;
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to update queue status.";
            dispatch(updateStatusFailed(message));
            return null;
        }
    }, [loadReview]);

    const actions: IClinicianQueueReviewActionContext = useMemo(
        () => ({
            loadReview,
            updateQueueStatus,
            clearMessages: () => dispatch(clearMessages()),
        }),
        [loadReview, updateQueueStatus]
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
