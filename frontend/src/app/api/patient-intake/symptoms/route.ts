import { API } from "@/constants/api";
import { getAbpErrorMessage, unwrapAbpResponse } from "@/lib/api/abp";
import { apiClient } from "@/lib/api/client";
import { requirePatientAccessToken } from "@/lib/server/patientAuthGuard";
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
        const response = await apiClient.post(
            API.PATIENT_INTAKE_CAPTURE_SYMPTOMS_ENDPOINT,
            {
                visitId: payload.visitId,
                freeText: payload.freeText ?? "",
                selectedSymptoms: payload.selectedSymptoms ?? [],
            },
            { headers: { Authorization: `Bearer ${guardResult.accessToken}` } }
        );

        return NextResponse.json(unwrapAbpResponse(response.data));
    } catch (error) {
        return NextResponse.json({ message: getAbpErrorMessage(error, "Unable to save symptoms.") }, { status: 400 });
    }
};
