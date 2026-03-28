import { requirePatientAccessToken } from "@/lib/server/patientAuthGuard";
import { patientIntakeService } from "@/services/patient-intake/patientIntakeService";
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
        const response = await patientIntakeService.checkIn(guardResult.accessToken);
        return NextResponse.json(response);
    } catch {
        return NextResponse.json({ message: "Unable to start patient check-in." }, { status: 400 });
    }
};
