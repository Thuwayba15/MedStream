import { API } from "@/constants/api";
import { unwrapAbpResponse } from "@/lib/api/abp";
import { apiClient } from "@/lib/api/client";
import type {
    IClinicianQueueResponse,
    IClinicianQueueReview,
    IGetClinicianQueueRequest,
    IOverrideQueueUrgencyRequest,
    IOverrideQueueUrgencyResponse,
    IUpdateQueueStatusRequest,
    IUpdateQueueStatusResponse,
} from "./types";

const getAuthorizationHeader = (accessToken: string): { Authorization: string } => {
    return { Authorization: `Bearer ${accessToken}` };
};

const getClinicianQueue = async (payload: IGetClinicianQueueRequest, accessToken: string): Promise<IClinicianQueueResponse> => {
    const query = new URLSearchParams();
    if (payload.searchText?.trim()) {
        query.set("searchText", payload.searchText.trim());
    }

    (payload.queueStatuses ?? []).forEach((status) => query.append("queueStatuses", status));
    (payload.urgencyLevels ?? []).forEach((urgency) => query.append("urgencyLevels", urgency));
    query.set("skipCount", String(payload.skipCount ?? 0));
    query.set("maxResultCount", String(payload.maxResultCount ?? 200));

    const response = await apiClient.get(`${API.QUEUE_OPERATIONS_GET_CLINICIAN_QUEUE_ENDPOINT}?${query.toString()}`, {
        headers: getAuthorizationHeader(accessToken),
    });

    return unwrapAbpResponse<IClinicianQueueResponse>(response.data);
};

const getQueueTicketForReview = async (queueTicketId: number, accessToken: string): Promise<IClinicianQueueReview> => {
    const response = await apiClient.get(API.QUEUE_OPERATIONS_GET_QUEUE_REVIEW_ENDPOINT, {
        params: { id: queueTicketId },
        headers: getAuthorizationHeader(accessToken),
    });

    return unwrapAbpResponse<IClinicianQueueReview>(response.data);
};

const updateQueueTicketStatus = async (payload: IUpdateQueueStatusRequest, accessToken: string): Promise<IUpdateQueueStatusResponse> => {
    const response = await apiClient.put(
        API.QUEUE_OPERATIONS_UPDATE_QUEUE_STATUS_ENDPOINT,
        {
            queueTicketId: payload.queueTicketId,
            newStatus: payload.newStatus,
            note: payload.note ?? "",
        },
        {
            headers: getAuthorizationHeader(accessToken),
        }
    );

    return unwrapAbpResponse<IUpdateQueueStatusResponse>(response.data);
};

const overrideQueueTicketUrgency = async (payload: IOverrideQueueUrgencyRequest, accessToken: string): Promise<IOverrideQueueUrgencyResponse> => {
    const response = await apiClient.post(
        API.QUEUE_OPERATIONS_OVERRIDE_QUEUE_URGENCY_ENDPOINT,
        {
            queueTicketId: payload.queueTicketId,
            urgencyLevel: payload.urgencyLevel,
            note: payload.note ?? "",
        },
        {
            headers: getAuthorizationHeader(accessToken),
        }
    );

    return unwrapAbpResponse<IOverrideQueueUrgencyResponse>(response.data);
};

export const queueOperationsService = {
    getClinicianQueue,
    getQueueTicketForReview,
    updateQueueTicketStatus,
    overrideQueueTicketUrgency,
};
