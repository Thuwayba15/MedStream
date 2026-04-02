"use client";

import axios from "axios";
import { useCallback, useContext, useMemo, useReducer } from "react";
import { API } from "@/constants/api";
import { loadTimelineFailed, loadTimelineStarted, loadTimelineSucceeded, clearTimeline } from "./actions";
import { ClinicianHistoryActionContext, ClinicianHistoryStateContext, INITIAL_STATE, type IClinicianHistoryActionContext, type IClinicianHistoryStateContext } from "./context";
import { clinicianHistoryReducer } from "./reducer";
import type { IPatientTimeline } from "@/services/patient-timeline/types";

interface IMessageResponse {
    message?: string;
}

const parseRouteError = (error: unknown, fallbackMessage: string): Error => {
    if (axios.isAxiosError<IMessageResponse>(error)) {
        return new Error(error.response?.data?.message ?? fallbackMessage);
    }

    return error instanceof Error ? error : new Error(fallbackMessage);
};

export const ClinicianHistoryProvider = ({ children }: { children: React.ReactNode }): React.JSX.Element => {
    const [state, dispatch] = useReducer(clinicianHistoryReducer, INITIAL_STATE);

    const loadTimeline = useCallback(async (patientUserId: number): Promise<void> => {
        dispatch(loadTimelineStarted(patientUserId));
        try {
            const query = new URLSearchParams({
                patientUserId: String(patientUserId),
            });

            // Get Patient Timeline
            // GET /api/clinician/history
            const response = await axios.get<IPatientTimeline>(`${API.CLINICIAN_HISTORY_ROUTE}?${query.toString()}`);
            dispatch(loadTimelineSucceeded(patientUserId, response.data));
        } catch (error) {
            dispatch(loadTimelineFailed(patientUserId, parseRouteError(error, "Unable to load patient timeline.").message));
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
