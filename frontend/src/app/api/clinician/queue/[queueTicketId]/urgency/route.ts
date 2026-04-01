import { API } from "@/constants/api";
import { getAbpErrorMessage, unwrapAbpResponse } from "@/lib/api/abp";
import { apiClient } from "@/lib/api/client";
import { requireClinicianAccessToken } from "@/lib/server/clinicianAuthGuard";
import type { TUrgencyLevel } from "@/services/queue-operations/types";
import { NextResponse } from "next/server";

interface IRouteContext {
    params: Promise<{
        queueTicketId: string;
    }>;
}

interface IUrgencyOverrideBody {
    urgencyLevel: TUrgencyLevel;
    note?: string;
}

export const POST = async (request: Request, context: IRouteContext): Promise<Response> => {
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

        const body = (await request.json()) as IUrgencyOverrideBody;
        if (!body.urgencyLevel) {
            return NextResponse.json({ message: "Urgency level is required." }, { status: 400 });
        }

        const response = await apiClient.post(
            API.QUEUE_OPERATIONS_OVERRIDE_QUEUE_URGENCY_ENDPOINT,
            {
                queueTicketId: parsedQueueTicketId,
                urgencyLevel: body.urgencyLevel,
                note: body.note ?? "",
            },
            {
                headers: { Authorization: `Bearer ${guardResult.accessToken}` },
            }
        );

        return NextResponse.json(unwrapAbpResponse(response.data));
    } catch (error) {
        return NextResponse.json({ message: getAbpErrorMessage(error, "Unable to override urgency.") }, { status: 400 });
    }
};
