import { API } from "@/constants/api";
import { getAbpErrorMessage, unwrapAbpResponse } from "@/lib/api/abp";
import { apiClient } from "@/lib/api/client";
import { requirePatientAccessToken } from "@/lib/server/patientAuthGuard";
import { NextResponse } from "next/server";

export const GET = async (): Promise<Response> => {
    try {
        const guardResult = await requirePatientAccessToken();
        if (guardResult.errorResponse || !guardResult.accessToken) {
            return guardResult.errorResponse ?? NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
        }

        const response = await apiClient.get(API.PATIENT_TIMELINE_GET_MY_ENDPOINT, {
            headers: { Authorization: `Bearer ${guardResult.accessToken}` },
        });
        return NextResponse.json(unwrapAbpResponse(response.data));
    } catch (error) {
        return NextResponse.json({ message: getAbpErrorMessage(error, "Unable to load patient visit history.") }, { status: 400 });
    }
};
