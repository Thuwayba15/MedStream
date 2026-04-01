import { API } from "@/constants/api";
import { getAbpErrorMessage, unwrapAbpResponse } from "@/lib/api/abp";
import { apiClient } from "@/lib/api/client";
import { requireClinicianAccessToken } from "@/lib/server/clinicianAuthGuard";
import type { IGetClinicianQueueRequest, TQueueStatus, TUrgencyLevel } from "@/services/queue-operations/types";
import { NextResponse } from "next/server";

const getListParamValues = (searchParams: URLSearchParams, key: string): string[] => {
    return searchParams
        .getAll(key)
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
};

const parseQueueRequest = (request: Request): IGetClinicianQueueRequest => {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    const searchText = (searchParams.get("searchText") ?? "").trim();
    const queueStatuses = [...getListParamValues(searchParams, "queueStatus"), ...getListParamValues(searchParams, "queueStatuses")] as TQueueStatus[];
    const urgencyLevels = [...getListParamValues(searchParams, "urgencyLevel"), ...getListParamValues(searchParams, "urgencyLevels")] as TUrgencyLevel[];
    const skipCount = Number(searchParams.get("skipCount") ?? "0");
    const maxResultCount = Number(searchParams.get("maxResultCount") ?? "20");

    return {
        searchText,
        queueStatuses,
        urgencyLevels,
        skipCount: Number.isFinite(skipCount) && skipCount >= 0 ? skipCount : 0,
        maxResultCount: Number.isFinite(maxResultCount) && maxResultCount > 0 ? maxResultCount : 20,
    };
};

export const GET = async (request: Request): Promise<Response> => {
    try {
        const guardResult = await requireClinicianAccessToken();
        if (guardResult.errorResponse || !guardResult.accessToken) {
            return guardResult.errorResponse ?? NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
        }

        const payload = parseQueueRequest(request);
        const query = new URLSearchParams();
        if (payload.searchText?.trim()) {
            query.set("searchText", payload.searchText.trim());
        }

        (payload.queueStatuses ?? []).forEach((status) => query.append("queueStatuses", status));
        (payload.urgencyLevels ?? []).forEach((urgency) => query.append("urgencyLevels", urgency));
        query.set("skipCount", String(payload.skipCount ?? 0));
        query.set("maxResultCount", String(payload.maxResultCount ?? 20));

        const response = await apiClient.get(`${API.QUEUE_OPERATIONS_GET_CLINICIAN_QUEUE_ENDPOINT}?${query.toString()}`, {
            headers: { Authorization: `Bearer ${guardResult.accessToken}` },
        });
        const queue = unwrapAbpResponse(response.data);

        return NextResponse.json(queue);
    } catch (error) {
        return NextResponse.json({ message: getAbpErrorMessage(error, "Unable to load clinician queue.") }, { status: 400 });
    }
};
