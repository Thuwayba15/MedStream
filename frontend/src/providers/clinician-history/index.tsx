"use client";

import { useCallback, useContext, useMemo, useReducer } from "react";
import { API } from "@/constants/api";
import { loadTimelineFailed, loadTimelineStarted, loadTimelineSucceeded, clearTimeline } from "./actions";
import { ClinicianHistoryActionContext, ClinicianHistoryStateContext, INITIAL_STATE, type IClinicianHistoryActionContext, type IClinicianHistoryStateContext } from "./context";
import { clinicianHistoryReducer } from "./reducer";
import type { IPatientTimeline } from "@/services/patient-timeline/types";

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

export const ClinicianHistoryProvider = ({ children }: { children: React.ReactNode }): React.JSX.Element => {
    const [state, dispatch] = useReducer(clinicianHistoryReducer, INITIAL_STATE);

    const loadTimeline = useCallback(async (patientUserId: number): Promise<void> => {
        dispatch(loadTimelineStarted(patientUserId));
        try {
            const query = new URLSearchParams({
                patientUserId: String(patientUserId),
            });

            const response = await fetch(`${API.CLINICIAN_HISTORY_ROUTE}?${query.toString()}`);
            const timeline = await parseResponse<IPatientTimeline>(response, "Unable to load patient timeline.");
            dispatch(loadTimelineSucceeded(patientUserId, timeline));
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to load patient timeline.";
            dispatch(loadTimelineFailed(patientUserId, message));
        }
    }, []);

    const actions: IClinicianHistoryActionContext = useMemo(
        () => ({
            loadTimeline,
            clearTimeline: () => dispatch(clearTimeline()),
        }),
        [loadTimeline]
    );

    return (
        <ClinicianHistoryStateContext.Provider value={state}>
            <ClinicianHistoryActionContext.Provider value={actions}>{children}</ClinicianHistoryActionContext.Provider>
        </ClinicianHistoryStateContext.Provider>
    );
};

export const useClinicianHistoryState = (): IClinicianHistoryStateContext => {
    return useContext(ClinicianHistoryStateContext);
};

export const useClinicianHistoryActions = (): IClinicianHistoryActionContext => {
    const context = useContext(ClinicianHistoryActionContext);
    if (!context) {
        throw new Error("useClinicianHistoryActions must be used within a ClinicianHistoryProvider.");
    }

    return context;
};
