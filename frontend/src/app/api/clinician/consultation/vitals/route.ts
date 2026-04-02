import { API } from "@/constants/api";
import { getAbpErrorMessage, unwrapAbpResponse } from "@/lib/api/abp";
import { apiClient } from "@/lib/api/client";
import { requireClinicianAccessToken } from "@/lib/server/clinicianAuthGuard";
import type { ISaveVitalsRequest } from "@/services/consultation/types";
import { NextResponse } from "next/server";

export const POST = async (request: Request): Promise<Response> => {
    try {
        const guardResult = await requireClinicianAccessToken();
        if (guardResult.errorResponse || !guardResult.accessToken) {
            return guardResult.errorResponse ?? NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
        }

        const body = (await request.json()) as ISaveVitalsRequest;
        if (!body.visitId) {
            return NextResponse.json({ message: "Visit id is required." }, { status: 400 });
        }

        const response = await apiClient.post(API.CONSULTATION_SAVE_VITALS_ENDPOINT, body, {
            headers: { Authorization: `Bearer ${guardResult.accessToken}` },
        });
        return NextResponse.json(unwrapAbpResponse(response.data));
    } catch (error) {
        return NextResponse.json({ message: getAbpErrorMessage(error, "Unable to save vitals.") }, { status: 400 });
    }
};
