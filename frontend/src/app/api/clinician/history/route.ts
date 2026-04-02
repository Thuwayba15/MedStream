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

        const patientUserIdValue = request.nextUrl.searchParams.get("patientUserId");
        const patientUserId = Number(patientUserIdValue);
        if (!Number.isInteger(patientUserId) || patientUserId <= 0) {
            return NextResponse.json({ message: "Patient user id is invalid." }, { status: 400 });
        }

        const response = await apiClient.get(API.PATIENT_TIMELINE_GET_ENDPOINT, {
            params: { patientUserId },
            headers: { Authorization: `Bearer ${guardResult.accessToken}` },
        });

        return NextResponse.json(unwrapAbpResponse(response.data));
    } catch (error) {
        return NextResponse.json({ message: getAbpErrorMessage(error, "Unable to load patient timeline.") }, { status: 400 });
    }
};
