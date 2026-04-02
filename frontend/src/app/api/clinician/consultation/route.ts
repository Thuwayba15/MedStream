import { API } from "@/constants/api";
import { getAbpErrorMessage, unwrapAbpResponse } from "@/lib/api/abp";
import { apiClient } from "@/lib/api/client";
import { requireClinicianAccessToken } from "@/lib/server/clinicianAuthGuard";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (request: NextRequest): Promise<Response> => {
    try {
        const guardResult = await requireClinicianAccessToken();
        if (guardResult.errorResponse || !guardResult.accessToken) {
            return guardResult.errorResponse ?? NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
        }

        const visitIdValue = request.nextUrl.searchParams.get("visitId");
        if (!visitIdValue) {
            const response = await apiClient.get(API.CONSULTATION_GET_INBOX_ENDPOINT, {
                headers: { Authorization: `Bearer ${guardResult.accessToken}` },
            });
            return NextResponse.json(unwrapAbpResponse(response.data));
        }

        const visitId = Number(visitIdValue);
        const queueTicketIdValue = request.nextUrl.searchParams.get("queueTicketId");
        const queueTicketId = queueTicketIdValue ? Number(queueTicketIdValue) : undefined;

        if (!Number.isInteger(visitId) || visitId <= 0) {
            return NextResponse.json({ message: "Visit id is invalid." }, { status: 400 });
        }

        const response = await apiClient.get(API.CONSULTATION_GET_WORKSPACE_ENDPOINT, {
            params: {
                visitId,
                queueTicketId: Number.isInteger(queueTicketId) && queueTicketId && queueTicketId > 0 ? queueTicketId : undefined,
            },
            headers: { Authorization: `Bearer ${guardResult.accessToken}` },
        });

        return NextResponse.json(unwrapAbpResponse(response.data));
    } catch (error) {
        return NextResponse.json({ message: getAbpErrorMessage(error, "Unable to load consultation workspace.") }, { status: 400 });
    }
};
