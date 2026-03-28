import { requirePatientAccessToken } from "@/lib/server/patientAuthGuard";
import { patientIntakeService } from "@/services/patient-intake/patientIntakeService";
import type { IGetQuestionsRequest } from "@/services/patient-intake/types";
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
        const questionSet = await patientIntakeService.getQuestions(
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
            guardResult.accessToken
        );
        return NextResponse.json({ questionSet });
    } catch (error) {
        console.error("[PatientIntake][Questions] Route failed.", error);
        const debugMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            {
                message: "Unable to load follow-up questions.",
                ...(process.env.NODE_ENV !== "production" ? { debugMessage } : {}),
            },
            { status: 400 }
        );
    }
};
