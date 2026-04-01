import { API } from "@/constants/api";
import { getAbpErrorMessage, unwrapAbpResponse } from "@/lib/api/abp";
import { apiClient } from "@/lib/api/client";
import { requirePatientAccessToken } from "@/lib/server/patientAuthGuard";
import { NextResponse } from "next/server";

export const POST = async (): Promise<Response> => {
    const guardResult = await requirePatientAccessToken();
    if (guardResult.errorResponse) {
        return guardResult.errorResponse;
    }
    if (!guardResult.accessToken) {
        return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    }

    try {
        const response = await apiClient.post(API.PATIENT_INTAKE_CHECKIN_ENDPOINT, {}, { headers: { Authorization: `Bearer ${guardResult.accessToken}` } });
        return NextResponse.json(unwrapAbpResponse(response.data));
    } catch (error) {
        return NextResponse.json({ message: getAbpErrorMessage(error, "Unable to start patient check-in.") }, { status: 400 });
    }
};
