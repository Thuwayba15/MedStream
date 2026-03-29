import { requirePatientAccessToken } from "@/lib/server/patientAuthGuard";
import { patientIntakeService } from "@/services/patient-intake/patientIntakeService";
import type { ISymptomCaptureRequest } from "@/services/patient-intake/types";
import { NextResponse } from "next/server";

export const POST = async (request: Request): Promise<Response> => {
    const guardResult = await requirePatientAccessToken();
    if (guardResult.errorResponse) {
        return guardResult.errorResponse;
    }
    if (!guardResult.accessToken) {
        return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    }

    const payload = (await request.json()) as ISymptomCaptureRequest;
    if (!payload.visitId || (!payload.freeText?.trim() && (payload.selectedSymptoms?.length ?? 0) === 0)) {
        return NextResponse.json(
            {
                message: "Please provide symptom text or select at least one symptom.",
            },
            { status: 400 }
        );
    }

    try {
        const result = await patientIntakeService.captureSymptoms(
            {
                visitId: payload.visitId,
                freeText: payload.freeText ?? "",
                selectedSymptoms: payload.selectedSymptoms ?? [],
            },
            guardResult.accessToken
        );

        return NextResponse.json(result);
    } catch {
        return NextResponse.json({ message: "Unable to save symptoms." }, { status: 400 });
    }
};
