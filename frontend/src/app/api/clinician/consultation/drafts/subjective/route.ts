import { API } from "@/constants/api";
import { getAbpErrorMessage, unwrapAbpResponse } from "@/lib/api/abp";
import { apiClient } from "@/lib/api/client";
import { requireClinicianAccessToken } from "@/lib/server/clinicianAuthGuard";
import { NextResponse } from "next/server";

interface IDraftBody {
    visitId: number;
}

export const POST = async (request: Request): Promise<Response> => {
    try {
        const guardResult = await requireClinicianAccessToken();
        if (guardResult.errorResponse || !guardResult.accessToken) {
            return guardResult.errorResponse ?? NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
        }

        const body = (await request.json()) as IDraftBody;
        if (!body.visitId) {
            return NextResponse.json({ message: "Visit id is required." }, { status: 400 });
        }

        const response = await apiClient.post(
            API.CONSULTATION_GENERATE_SUBJECTIVE_ENDPOINT,
            { visitId: body.visitId },
            { headers: { Authorization: `Bearer ${guardResult.accessToken}` } }
        );
        return NextResponse.json(unwrapAbpResponse(response.data));
    } catch (error) {
        return NextResponse.json({ message: getAbpErrorMessage(error, "Unable to generate subjective draft.") }, { status: 400 });
    }
};
