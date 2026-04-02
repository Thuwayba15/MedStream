import { API } from "@/constants/api";
import { getAbpErrorMessage, unwrapAbpResponse } from "@/lib/api/abp";
import { apiClient } from "@/lib/api/client";
import { requirePatientAccessToken } from "@/lib/server/patientAuthGuard";
import { NextResponse } from "next/server";

interface ICheckInRouteRequest {
    selectedFacilityId?: number;
}

export const POST = async (request: Request): Promise<Response> => {
    const guardResult = await requirePatientAccessToken();
    if (guardResult.errorResponse) {
        return guardResult.errorResponse;
    }
    if (!guardResult.accessToken) {
        return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    }

    try {
        const payload = (await request.json().catch(() => ({}))) as ICheckInRouteRequest;
        const response = await apiClient.post(
            API.PATIENT_INTAKE_CHECKIN_ENDPOINT,
            {
                selectedFacilityId: payload.selectedFacilityId ?? 0,
            },
            { headers: { Authorization: `Bearer ${guardResult.accessToken}` } }
        );
        return NextResponse.json(unwrapAbpResponse(response.data));
    } catch (error) {
        return NextResponse.json({ message: getAbpErrorMessage(error, "Unable to start patient check-in.") }, { status: 400 });
    }
};
