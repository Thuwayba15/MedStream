"use client";

import axios from "axios";
import { useCallback, useContext, useMemo, useReducer } from "react";
import { API } from "@/constants/api";
import type { IPatientTimeline } from "@/services/patient-timeline/types";
import { loadTimelineFailed, loadTimelineStarted, loadTimelineSucceeded } from "./actions";
import { INITIAL_STATE, PatientHistoryActionContext, PatientHistoryStateContext, type IPatientHistoryActionContext, type IPatientHistoryStateContext } from "./context";
import { patientHistoryReducer } from "./reducer";

interface IMessageResponse {
    message?: string;
}

const parseRouteError = (error: unknown, fallbackMessage: string): Error => {
    if (axios.isAxiosError<IMessageResponse>(error)) {
        return new Error(error.response?.data?.message ?? fallbackMessage);
    }

    return error instanceof Error ? error : new Error(fallbackMessage);
};

export const PatientHistoryProvider = ({ children }: { children: React.ReactNode }): React.JSX.Element => {
    const [state, dispatch] = useReducer(patientHistoryReducer, INITIAL_STATE);

    const loadTimeline = useCallback(async (): Promise<void> => {
        dispatch(loadTimelineStarted());
        try {
            // Get Patient Timeline
            // GET /api/patient/history
            const response = await axios.get<IPatientTimeline>(API.PATIENT_HISTORY_ROUTE);
            dispatch(loadTimelineSucceeded(response.data));
        } catch (error) {
            const message = parseRouteError(error, "Unable to load your visit history.").message;
            dispatch(loadTimelineFailed(message));
        }
    }, []);

    const actions: IPatientHistoryActionContext = useMemo(
        () => ({
            loadTimeline,
        }),
        [loadTimeline]
    );

    return (
        <PatientHistoryStateContext.Provider value={state}>
            <PatientHistoryActionContext.Provider value={actions}>{children}</PatientHistoryActionContext.Provider>
        </PatientHistoryStateContext.Provider>
    );
};

export const usePatientHistoryState = (): IPatientHistoryStateContext => {
    return useContext(PatientHistoryStateContext);
};

export const usePatientHistoryActions = (): IPatientHistoryActionContext => {
    const context = useContext(PatientHistoryActionContext);
    if (!context) {
        throw new Error("usePatientHistoryActions must be used within a PatientHistoryProvider.");
    }

    return context;
};
