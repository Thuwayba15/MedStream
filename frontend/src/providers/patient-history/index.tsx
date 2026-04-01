"use client";

import { useCallback, useContext, useMemo, useReducer } from "react";
import { API } from "@/constants/api";
import type { IPatientTimeline } from "@/services/patient-timeline/types";
import { loadTimelineFailed, loadTimelineStarted, loadTimelineSucceeded } from "./actions";
import { INITIAL_STATE, PatientHistoryActionContext, PatientHistoryStateContext, type IPatientHistoryActionContext, type IPatientHistoryStateContext } from "./context";
import { patientHistoryReducer } from "./reducer";

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

export const PatientHistoryProvider = ({ children }: { children: React.ReactNode }): React.JSX.Element => {
    const [state, dispatch] = useReducer(patientHistoryReducer, INITIAL_STATE);

    const loadTimeline = useCallback(async (): Promise<void> => {
        dispatch(loadTimelineStarted());
        try {
            const response = await fetch(API.PATIENT_HISTORY_ROUTE);
            const timeline = await parseResponse<IPatientTimeline>(response, "Unable to load your visit history.");
            dispatch(loadTimelineSucceeded(timeline));
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to load your visit history.";
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
