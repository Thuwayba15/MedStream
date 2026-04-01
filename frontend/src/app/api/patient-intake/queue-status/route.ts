import { API } from "@/constants/api";
import { getAbpErrorMessage, unwrapAbpResponse } from "@/lib/api/abp";
import { apiClient } from "@/lib/api/client";
import { requirePatientAccessToken } from "@/lib/server/patientAuthGuard";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (request: NextRequest): Promise<Response> => {
    const guardResult = await requirePatientAccessToken();
    if (guardResult.errorResponse) {
        return guardResult.errorResponse;
    }

    if (!guardResult.accessToken) {
        return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    }

    const visitId = Number(request.nextUrl.searchParams.get("visitId"));
    if (!visitId) {
        return NextResponse.json({ message: "Visit id is required." }, { status: 400 });
    }

    try {
        const response = await apiClient.get(API.PATIENT_INTAKE_CURRENT_QUEUE_STATUS_ENDPOINT, {
            params: { visitId },
            headers: { Authorization: `Bearer ${guardResult.accessToken}` },
        });
        return NextResponse.json(unwrapAbpResponse(response.data));
    } catch (error) {
        return NextResponse.json({ message: getAbpErrorMessage(error, "Unable to load current queue status.") }, { status: 400 });
    }
};
