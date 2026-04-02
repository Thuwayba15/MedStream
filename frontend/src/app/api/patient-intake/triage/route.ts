import { API } from "@/constants/api";
import { getAbpErrorMessage, unwrapAbpResponse } from "@/lib/api/abp";
import { apiClient } from "@/lib/api/client";
import { requirePatientAccessToken } from "@/lib/server/patientAuthGuard";
import type { ITriageAssessRequest, ITriageResponse } from "@/services/patient-intake/types";
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
        const response = await apiClient.post(
            API.PATIENT_INTAKE_ASSESS_TRIAGE_ENDPOINT,
            {
                visitId: payload.visitId,
                freeText: payload.freeText,
                selectedSymptoms: payload.selectedSymptoms,
                extractedPrimarySymptoms: payload.extractedPrimarySymptoms,
                answers: payload.answers,
            },
            { headers: { Authorization: `Bearer ${guardResult.accessToken}` } }
        );
        const result = unwrapAbpResponse<ITriageResponse>(response.data);
        return NextResponse.json({
            ...result,
            triage: {
                urgencyLevel: result.triage.urgencyLevel,
                explanation: result.triage.explanation,
                redFlags: result.triage.redFlags,
            },
        });
    } catch (error) {
        return NextResponse.json({ message: getAbpErrorMessage(error, "Unable to assess triage.") }, { status: 400 });
    }
};
