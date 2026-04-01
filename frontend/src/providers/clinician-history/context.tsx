"use client";

import { createContext } from "react";
import type { IPatientTimeline } from "@/services/patient-timeline/types";

export interface IClinicianHistoryStateContext {
    patientUserId?: number;
    timeline: IPatientTimeline | null;
    isLoadingTimeline: boolean;
    errorMessage?: string;
}

export interface IClinicianHistoryActionContext {
    loadTimeline: (patientUserId: number) => Promise<void>;
    clearTimeline: () => void;
}

export const INITIAL_STATE: IClinicianHistoryStateContext = {
    patientUserId: undefined,
    timeline: null,
    isLoadingTimeline: false,
    errorMessage: undefined,
};

export const INITIAL_ACTION_STATE: IClinicianHistoryActionContext = {
    loadTimeline: async () => Promise.resolve(),
    clearTimeline: () => undefined,
};

export const ClinicianHistoryStateContext = createContext<IClinicianHistoryStateContext>(INITIAL_STATE);
export const ClinicianHistoryActionContext = createContext<IClinicianHistoryActionContext | undefined>(undefined);
