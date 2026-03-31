import { getAbpErrorMessage } from "@/lib/api/abp";
import { requireClinicianAccessToken } from "@/lib/server/clinicianAuthGuard";
import { consultationService } from "@/services/consultation/consultationService";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (request: NextRequest): Promise<Response> => {
    try {
        const guardResult = await requireClinicianAccessToken();
        if (guardResult.errorResponse || !guardResult.accessToken) {
            return guardResult.errorResponse ?? NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
        }

        const visitIdValue = request.nextUrl.searchParams.get("visitId");
        if (!visitIdValue) {
            const inbox = await consultationService.getConsultationInbox(guardResult.accessToken);
            return NextResponse.json(inbox);
        }

        const visitId = Number(visitIdValue);
        const queueTicketIdValue = request.nextUrl.searchParams.get("queueTicketId");
        const queueTicketId = queueTicketIdValue ? Number(queueTicketIdValue) : undefined;

        if (!Number.isInteger(visitId) || visitId <= 0) {
            return NextResponse.json({ message: "Visit id is invalid." }, { status: 400 });
        }

        const workspace = await consultationService.getConsultationWorkspace(
            {
                visitId,
                queueTicketId: Number.isInteger(queueTicketId) && queueTicketId && queueTicketId > 0 ? queueTicketId : undefined,
            },
            guardResult.accessToken
        );

        return NextResponse.json(workspace);
    } catch (error) {
        return NextResponse.json({ message: getAbpErrorMessage(error, "Unable to load consultation workspace.") }, { status: 400 });
    }
};
