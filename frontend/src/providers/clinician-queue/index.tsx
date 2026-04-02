"use client";

import axios from "axios";
import { useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import { API } from "@/constants/api";
import { subscribeToQueueRealtime } from "@/services/realtime/queueRealtimeClient";
import { clearError, loadFailed, loadStarted, loadSucceeded, setPage, setQueueStatusFilter, setSearchText, setUrgencyTabFilter } from "./actions";
import { ClinicianQueueActionContext, ClinicianQueueStateContext, INITIAL_STATE, type IClinicianQueueActionContext, type IClinicianQueueStateContext, type TQueueTabFilter } from "./context";
import { clinicianQueueReducer } from "./reducer";
import type { IClinicianQueueResponse, TQueueStatus, TUrgencyLevel } from "@/services/queue-operations/types";

interface IMessageResponse {
    message?: string;
}

const parseRouteError = (error: unknown, fallbackMessage: string): Error => {
    if (axios.isAxiosError<IMessageResponse>(error)) {
        return new Error(error.response?.data?.message ?? fallbackMessage);
    }

    return error instanceof Error ? error : new Error(fallbackMessage);
};

const getUrgencyLevels = (urgencyFilter: TQueueTabFilter): TUrgencyLevel[] => {
    if (urgencyFilter === "urgent") {
        return ["Urgent"];
    }

    if (urgencyFilter === "priority") {
        return ["Priority"];
    }

    if (urgencyFilter === "routine") {
        return ["Routine"];
    }

    return [];
};

const getQueueStatuses = (queueStatusFilter: IClinicianQueueStateContext["queueStatusFilter"]): TQueueStatus[] => {
    if (queueStatusFilter === "all") {
        return [];
    }

    return [queueStatusFilter];
};

export const ClinicianQueueProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, dispatch] = useReducer(clinicianQueueReducer, INITIAL_STATE);
    const hasInitializedRef = useRef(false);
    const stateRef = useRef(state);

    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    const loadQueueByFilters = useCallback(
        async (
            searchText: string,
            queueStatusFilter: IClinicianQueueStateContext["queueStatusFilter"],
            urgencyTabFilter: TQueueTabFilter,
            page: number,
            pageSize: number,
            mode: "initial" | "refresh"
        ): Promise<void> => {
            dispatch(loadStarted(mode));

            try {
                const query = new URLSearchParams();
                const trimmedSearchText = searchText.trim();
                if (trimmedSearchText.length > 0) {
                    query.set("searchText", trimmedSearchText);
                }

                getQueueStatuses(queueStatusFilter).forEach((status) => {
                    query.append("queueStatus", status);
                });
                getUrgencyLevels(urgencyTabFilter).forEach((urgency) => {
                    query.append("urgencyLevel", urgency);
                });
                query.set("skipCount", String(Math.max(0, (page - 1) * pageSize)));
                query.set("maxResultCount", String(pageSize));

                // Get Clinician Queue
                // GET /api/clinician/queue
                const response = await axios.get<IClinicianQueueResponse>(`${API.CLINICIAN_QUEUE_ROUTE}?${query.toString()}`);
                dispatch(loadSucceeded(response.data.items ?? [], response.data.totalCount ?? 0, response.data.summary ?? INITIAL_STATE.summary));
            } catch (error) {
                dispatch(loadFailed(parseRouteError(error, "Unable to load clinician queue.").message));
            }
        },
        []
    );

    const loadQueue = useCallback(
        async (mode: "initial" | "refresh" = "refresh"): Promise<void> => {
            await loadQueueByFilters(state.searchText, state.queueStatusFilter, state.urgencyTabFilter, state.page, state.pageSize, mode);
        },
        [loadQueueByFilters, state.page, state.pageSize, state.queueStatusFilter, state.searchText, state.urgencyTabFilter]
    );

    useEffect(() => {
        if (hasInitializedRef.current) {
            return;
        }

        hasInitializedRef.current = true;
        void loadQueue("initial");
    }, [loadQueue]);

    useEffect(() => {
        if (!hasInitializedRef.current) {
            return;
        }

        const timeout = setTimeout(() => {
            void loadQueueByFilters(state.searchText, state.queueStatusFilter, state.urgencyTabFilter, state.page, state.pageSize, "refresh");
        }, 250);

        return () => clearTimeout(timeout);
    }, [loadQueueByFilters, state.page, state.pageSize, state.queueStatusFilter, state.searchText, state.urgencyTabFilter]);

    useEffect(() => {
        const unsubscribe = subscribeToQueueRealtime(() => {
            const currentState = stateRef.current;
            void loadQueueByFilters(currentState.searchText, currentState.queueStatusFilter, currentState.urgencyTabFilter, currentState.page, currentState.pageSize, "refresh");
        });

        return unsubscribe;
    }, [loadQueueByFilters]);

    const actions: IClinicianQueueActionContext = useMemo(
        () => ({
            loadQueue,
            setSearchText: (value) => dispatch(setSearchText(value)),
            setQueueStatusFilter: (value) => dispatch(setQueueStatusFilter(value)),
            setUrgencyTabFilter: (value) => dispatch(setUrgencyTabFilter(value)),
            setPage: (page, pageSize) => dispatch(setPage(page, pageSize)),
            clearError: () => dispatch(clearError()),
        }),
        [loadQueue]
    );

    return (
        <ClinicianQueueStateContext.Provider value={state}>
            <ClinicianQueueActionContext.Provider value={actions}>{children}</ClinicianQueueActionContext.Provider>
        </ClinicianQueueStateContext.Provider>
    );
};

export const useClinicianQueueState = (): IClinicianQueueStateContext => {
    return useContext(ClinicianQueueStateContext);
};

export const useClinicianQueueActions = (): IClinicianQueueActionContext => {
    const context = useContext(ClinicianQueueActionContext);
    if (!context) {
        throw new Error("useClinicianQueueActions must be used within a ClinicianQueueProvider.");
    }

    return context;
};
