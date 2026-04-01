"use client";

import { createContext } from "react";
import type { IPatientTimeline } from "@/services/patient-timeline/types";

export interface IPatientHistoryStateContext {
    timeline: IPatientTimeline | null;
    isLoadingTimeline: boolean;
    errorMessage?: string;
}

export interface IPatientHistoryActionContext {
    loadTimeline: () => Promise<void>;
}

export const INITIAL_STATE: IPatientHistoryStateContext = {
    timeline: null,
    isLoadingTimeline: false,
    errorMessage: undefined,
};

export const INITIAL_ACTION_STATE: IPatientHistoryActionContext = {
    loadTimeline: async () => Promise.resolve(),
};

export const PatientHistoryStateContext = createContext<IPatientHistoryStateContext>(INITIAL_STATE);
export const PatientHistoryActionContext = createContext<IPatientHistoryActionContext | undefined>(undefined);
