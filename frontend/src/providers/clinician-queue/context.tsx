"use client";

import { createContext } from "react";
import type { IClinicianQueueItem, IClinicianQueueSummary } from "@/services/queue-operations/types";

export type TQueueTabFilter = "all" | "urgent" | "priority" | "routine";

export interface IClinicianQueueStateContext {
    items: IClinicianQueueItem[];
    totalCount: number;
    summary: IClinicianQueueSummary;
    searchText: string;
    queueStatusFilter: "all" | "waiting" | "called" | "in_consultation";
    urgencyTabFilter: TQueueTabFilter;
    page: number;
    pageSize: number;
    isLoading: boolean;
    isRefreshing: boolean;
    errorMessage?: string;
    lastLoadedAt: string | null;
}

export interface IClinicianQueueActionContext {
    loadQueue: (mode?: "initial" | "refresh") => Promise<void>;
    setSearchText: (value: string) => void;
    setQueueStatusFilter: (value: IClinicianQueueStateContext["queueStatusFilter"]) => void;
    setUrgencyTabFilter: (value: TQueueTabFilter) => void;
    setPage: (page: number, pageSize?: number) => void;
    clearError: () => void;
}

export const INITIAL_STATE: IClinicianQueueStateContext = {
    items: [],
    totalCount: 0,
    summary: {
        waitingCount: 0,
        averageWaitingMinutes: 0,
        urgentCount: 0,
        seenTodayCount: 0,
        calledCount: 0,
        inConsultationCount: 0,
    },
    searchText: "",
    queueStatusFilter: "all",
    urgencyTabFilter: "all",
    page: 1,
    pageSize: 8,
    isLoading: false,
    isRefreshing: false,
    errorMessage: undefined,
    lastLoadedAt: null,
};

export const INITIAL_ACTIONS: IClinicianQueueActionContext = {
    loadQueue: async () => Promise.resolve(),
    setSearchText: () => undefined,
    setQueueStatusFilter: () => undefined,
    setUrgencyTabFilter: () => undefined,
    setPage: () => undefined,
    clearError: () => undefined,
};

export const ClinicianQueueStateContext = createContext<IClinicianQueueStateContext>(INITIAL_STATE);
export const ClinicianQueueActionContext = createContext<IClinicianQueueActionContext | undefined>(undefined);
