import { requirePatientAccessToken } from "@/lib/server/patientAuthGuard";
import { patientIntakeService } from "@/services/patient-intake/patientIntakeService";
import type { IUrgentCheckRequest } from "@/services/patient-intake/types";
import { NextResponse } from "next/server";

export const POST = async (request: Request): Promise<Response> => {
    const guardResult = await requirePatientAccessToken();
    if (guardResult.errorResponse) {
        return guardResult.errorResponse;
    }
    if (!guardResult.accessToken) {
        return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    }

    const payload = (await request.json()) as IUrgentCheckRequest;
    if (!payload?.visitId) {
        return NextResponse.json({ message: "Visit context is required for urgent check." }, { status: 400 });
    }

    if (!payload.pathwayKey?.trim()) {
        return NextResponse.json({ message: "Pathway key is required for urgent check." }, { status: 400 });
    }

    try {
        const result = await patientIntakeService.urgentCheck(
            {
                visitId: payload.visitId,
                pathwayKey: payload.pathwayKey,
                intakeMode: payload.intakeMode,
                freeText: payload.freeText ?? "",
                selectedSymptoms: payload.selectedSymptoms ?? [],
                extractedPrimarySymptoms: payload.extractedPrimarySymptoms ?? [],
                fallbackSummaryIds: payload.fallbackSummaryIds ?? [],
                answers: payload.answers ?? {},
            },
            guardResult.accessToken
        );

        return NextResponse.json(result);
    } catch {
        return NextResponse.json({ message: "Unable to run urgent check." }, { status: 400 });
    }
};
