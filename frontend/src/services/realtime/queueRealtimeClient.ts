"use client";

import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { API } from "@/constants/api";

export interface IQueueUpdatedEvent {
    scope: "facility" | "patient";
    facilityId?: number;
    patientUserId?: number;
    visitId?: number;
    queueTicketId?: number;
}

type QueueUpdatedListener = (event: IQueueUpdatedEvent) => void;

let connectionPromise: Promise<HubConnection | null> | null = null;
let connection: HubConnection | null = null;
const listeners = new Set<QueueUpdatedListener>();
let accessTokenPromise: Promise<string | null> | null = null;

const getApiBaseUrl = (): string => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseUrl) {
        throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured.");
    }

    return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
};

const getSignalRAccessToken = async (): Promise<string | null> => {
    if (accessTokenPromise) {
        return accessTokenPromise;
    }

    accessTokenPromise = (async () => {
        try {
            const response = await fetch(API.AUTH_SIGNALR_TOKEN_ROUTE, {
                method: "GET",
                cache: "no-store",
                credentials: "same-origin",
            });
            if (!response.ok) {
                return null;
            }

            const body = (await response.json()) as { accessToken?: string };
            return body.accessToken ?? null;
        } catch {
            return null;
        } finally {
            accessTokenPromise = null;
        }
    })();

    return accessTokenPromise;
};

const ensureConnection = async (): Promise<HubConnection | null> => {
    if (connection && connection.state !== HubConnectionState.Disconnected) {
        return connection;
    }

    if (connectionPromise) {
        return connectionPromise;
    }

    connectionPromise = (async () => {
        try {
            const accessToken = await getSignalRAccessToken();
            if (!accessToken) {
                connectionPromise = null;
                return null;
            }

            const hubConnection = new HubConnectionBuilder()
                .withUrl(`${getApiBaseUrl()}${API.QUEUE_SIGNALR_HUB_PATH}`, {
                    accessTokenFactory: async () => (await getSignalRAccessToken()) ?? "",
                })
                .withAutomaticReconnect()
                .configureLogging(process.env.NODE_ENV === "production" ? LogLevel.Error : LogLevel.Warning)
                .build();

            hubConnection.on("queueUpdated", (event: IQueueUpdatedEvent) => {
                listeners.forEach((listener) => listener(event));
            });

            hubConnection.onclose(() => {
                connection = null;
                connectionPromise = null;
            });

            await hubConnection.start();
            connection = hubConnection;
            connectionPromise = null;
            return hubConnection;
        } catch {
            connection = null;
            connectionPromise = null;
            return null;
        }
    })();

    return connectionPromise;
};

export const subscribeToQueueRealtime = (listener: QueueUpdatedListener): (() => void) => {
    listeners.add(listener);
    void ensureConnection();

    return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && connection && connection.state !== HubConnectionState.Disconnected) {
            void connection.stop();
            connection = null;
            connectionPromise = null;
        }
    };
};
