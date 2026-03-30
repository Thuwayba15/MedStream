import { getAbpErrorMessage } from "@/lib/api/abp";
import { requireClinicianAccessToken } from "@/lib/server/clinicianAuthGuard";
import { queueOperationsService } from "@/services/queue-operations/queueOperationsService";
import type { TQueueStatus } from "@/services/queue-operations/types";
import { NextResponse } from "next/server";

interface IRouteContext {
    params: Promise<{
        queueTicketId: string;
    }>;
}

interface IStatusUpdateBody {
    newStatus: TQueueStatus;
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

        const body = (await request.json()) as IStatusUpdateBody;
        if (!body.newStatus) {
            return NextResponse.json({ message: "New status is required." }, { status: 400 });
        }

        const result = await queueOperationsService.updateQueueTicketStatus(
            {
                queueTicketId: parsedQueueTicketId,
                newStatus: body.newStatus,
                note: body.note ?? "",
            },
            guardResult.accessToken
        );
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ message: getAbpErrorMessage(error, "Unable to update queue status.") }, { status: 400 });
    }
};
