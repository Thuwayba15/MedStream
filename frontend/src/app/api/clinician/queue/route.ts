import { getAbpErrorMessage } from "@/lib/api/abp";
import { requireClinicianAccessToken } from "@/lib/server/clinicianAuthGuard";
import { queueOperationsService } from "@/services/queue-operations/queueOperationsService";
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
    const queueStatuses = getListParamValues(searchParams, "queueStatus") as TQueueStatus[];
    const urgencyLevels = getListParamValues(searchParams, "urgencyLevel") as TUrgencyLevel[];

    return {
        searchText,
        queueStatuses,
        urgencyLevels,
        skipCount: 0,
        maxResultCount: 200,
    };
};

export const GET = async (request: Request): Promise<Response> => {
    try {
        const guardResult = await requireClinicianAccessToken();
        if (guardResult.errorResponse || !guardResult.accessToken) {
            return guardResult.errorResponse ?? NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
        }

        const payload = parseQueueRequest(request);
        const queue = await queueOperationsService.getClinicianQueue(payload, guardResult.accessToken);

        return NextResponse.json(queue);
    } catch (error) {
        return NextResponse.json({ message: getAbpErrorMessage(error, "Unable to load clinician queue.") }, { status: 400 });
    }
};
