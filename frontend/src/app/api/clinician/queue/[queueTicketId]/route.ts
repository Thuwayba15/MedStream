import { API } from "@/constants/api";
import { getAbpErrorMessage, unwrapAbpResponse } from "@/lib/api/abp";
import { apiClient } from "@/lib/api/client";
import { requireClinicianAccessToken } from "@/lib/server/clinicianAuthGuard";
import { NextResponse } from "next/server";

interface IRouteContext {
    params: Promise<{
        queueTicketId: string;
    }>;
}

export const GET = async (_request: Request, context: IRouteContext): Promise<Response> => {
    try {
        const guardResult = await requireClinicianAccessToken();
        if (guardResult.errorResponse || !guardResult.accessToken) {
            return guardResult.errorResponse ?? NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
        }

        const { queueTicketId } = await context.params;
        const parsedQueueTicketId = Number(queueTicketId);
        if (!Number.isInteger(parsedQueueTicketId) || parsedQueueTicketId <= 0) {
            return NextResponse.json({ message: "Queue ticket id is invalid." }, { status: 400 });
        }

        const response = await apiClient.get(API.QUEUE_OPERATIONS_GET_QUEUE_REVIEW_ENDPOINT, {
            params: { id: parsedQueueTicketId },
            headers: { Authorization: `Bearer ${guardResult.accessToken}` },
        });

        return NextResponse.json(unwrapAbpResponse(response.data));
    } catch (error) {
        return NextResponse.json({ message: getAbpErrorMessage(error, "Unable to load queue review context.") }, { status: 400 });
    }
};
