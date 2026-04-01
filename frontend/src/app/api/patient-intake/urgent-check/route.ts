import { API } from "@/constants/api";
import { getAbpErrorMessage, unwrapAbpResponse } from "@/lib/api/abp";
import { apiClient } from "@/lib/api/client";
import { requirePatientAccessToken } from "@/lib/server/patientAuthGuard";
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
        const response = await apiClient.post(
            API.PATIENT_INTAKE_URGENT_CHECK_ENDPOINT,
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
            { headers: { Authorization: `Bearer ${guardResult.accessToken}` } }
        );

        return NextResponse.json(unwrapAbpResponse(response.data));
    } catch (error) {
        return NextResponse.json({ message: getAbpErrorMessage(error, "Unable to run urgent check.") }, { status: 400 });
    }
};
