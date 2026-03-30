import { getAbpErrorMessage } from "@/lib/api/abp";
import { requireClinicianAccessToken } from "@/lib/server/clinicianAuthGuard";
import { queueOperationsService } from "@/services/queue-operations/queueOperationsService";
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

        const review = await queueOperationsService.getQueueTicketForReview(parsedQueueTicketId, guardResult.accessToken);
        return NextResponse.json(review);
    } catch (error) {
        return NextResponse.json({ message: getAbpErrorMessage(error, "Unable to load queue review context.") }, { status: 400 });
    }
};
