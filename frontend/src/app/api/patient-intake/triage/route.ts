import { requirePatientAccessToken } from "@/lib/server/patientAuthGuard";
import { patientIntakeService } from "@/services/patient-intake/patientIntakeService";
import type { ITriageAssessRequest } from "@/services/patient-intake/types";
import { NextResponse } from "next/server";

const hasGlobalUrgentPositiveAnswers = (answers: ITriageAssessRequest["answers"]): boolean => {
    if (!answers) {
        return false;
    }

    const keys = ["urgentSevereBreathing", "urgentSevereChestPain", "urgentUncontrolledBleeding", "urgentCollapse", "urgentConfusion"];
    return keys.some((key) => {
        const value = answers[key];
        if (typeof value === "boolean") {
            return value;
        }

        if (typeof value === "string") {
            const normalized = value.trim().toLowerCase();
            return normalized === "true" || normalized === "yes";
        }

        return false;
    });
};

export const POST = async (request: Request): Promise<Response> => {
    const guardResult = await requirePatientAccessToken();
    if (guardResult.errorResponse) {
        return guardResult.errorResponse;
    }
    if (!guardResult.accessToken) {
        return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    }

    const payload = (await request.json()) as ITriageAssessRequest;
    if (!payload.visitId) {
        return NextResponse.json(
            {
                message: "Visit context is required for triage.",
            },
            { status: 400 }
        );
    }

    if ((!payload.extractedPrimarySymptoms || payload.extractedPrimarySymptoms.length === 0) && !hasGlobalUrgentPositiveAnswers(payload.answers)) {
        return NextResponse.json(
            {
                message: "At least one extracted symptom is required before triage.",
            },
            { status: 400 }
        );
    }

    try {
        const result = await patientIntakeService.assessTriage(payload, guardResult.accessToken);
        return NextResponse.json(result);
    } catch {
        return NextResponse.json({ message: "Unable to assess triage." }, { status: 400 });
    }
};
