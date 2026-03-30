import { requirePatientAccessToken } from "@/lib/server/patientAuthGuard";
import { patientIntakeService } from "@/services/patient-intake/patientIntakeService";
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
        const result = await patientIntakeService.getCurrentQueueStatus({ visitId }, guardResult.accessToken);
        return NextResponse.json(result);
    } catch {
        return NextResponse.json({ message: "Unable to load current queue status." }, { status: 400 });
    }
};
