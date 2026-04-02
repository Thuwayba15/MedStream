import { API } from "@/constants/api";
import { getAbpErrorMessage, unwrapAbpResponse } from "@/lib/api/abp";
import { apiClient } from "@/lib/api/client";
import { requirePatientAccessToken } from "@/lib/server/patientAuthGuard";
import type { IGetQuestionsRequest, IQuestionsResponse } from "@/services/patient-intake/types";
import { NextResponse } from "next/server";

export const POST = async (request: Request): Promise<Response> => {
    const guardResult = await requirePatientAccessToken();
    if (guardResult.errorResponse) {
        return guardResult.errorResponse;
    }
    if (!guardResult.accessToken) {
        return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    }

    const payload = (await request.json()) as IGetQuestionsRequest;
    if (!payload?.visitId) {
        return NextResponse.json({ message: "Visit context is required." }, { status: 400 });
    }

    if (!payload.pathwayKey?.trim()) {
        return NextResponse.json(
            {
                message: "Pathway key is required.",
            },
            { status: 400 }
        );
    }

    try {
        const response = await apiClient.post(
            API.PATIENT_INTAKE_GET_QUESTIONS_ENDPOINT,
            {
                visitId: payload.visitId,
                pathwayKey: payload.pathwayKey,
                primarySymptom: payload.primarySymptom ?? null,
                freeText: payload.freeText ?? "",
                selectedSymptoms: payload.selectedSymptoms ?? [],
                extractedPrimarySymptoms: payload.extractedPrimarySymptoms ?? [],
                fallbackSummaryIds: payload.fallbackSummaryIds ?? [],
                useApcFallback: payload.useApcFallback ?? false,
                answers: payload.answers ?? {},
            },
            { headers: { Authorization: `Bearer ${guardResult.accessToken}` } }
        );
        const result = unwrapAbpResponse<IQuestionsResponse>(response.data);
        const questionSet = result.questionSet ?? [];
        return NextResponse.json({ questionSet });
    } catch (error) {
        const debugMessage = getAbpErrorMessage(error, "Unable to load follow-up questions.");
        return NextResponse.json(
            {
                message: "Unable to load follow-up questions.",
                ...(process.env.NODE_ENV !== "production" ? { debugMessage } : {}),
            },
            { status: 400 }
        );
    }
};
