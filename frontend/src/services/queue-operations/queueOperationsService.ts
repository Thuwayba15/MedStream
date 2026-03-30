import { API } from "@/constants/api";
import { unwrapAbpResponse } from "@/lib/api/abp";
import { apiClient } from "@/lib/api/client";
import type { IClinicianQueueResponse, IGetClinicianQueueRequest } from "./types";

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

export const queueOperationsService = {
    getClinicianQueue,
};
