import { getAbpErrorMessage } from "@/lib/api/abp";
import { requireClinicianAccessToken } from "@/lib/server/clinicianAuthGuard";
import { consultationService } from "@/services/consultation/consultationService";
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

        const result = await consultationService.saveVitals(body, guardResult.accessToken);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ message: getAbpErrorMessage(error, "Unable to save vitals.") }, { status: 400 });
    }
};
