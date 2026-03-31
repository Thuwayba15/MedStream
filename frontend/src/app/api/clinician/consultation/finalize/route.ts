import { getAbpErrorMessage } from "@/lib/api/abp";
import { requireClinicianAccessToken } from "@/lib/server/clinicianAuthGuard";
import { consultationService } from "@/services/consultation/consultationService";
import { NextResponse } from "next/server";

interface IFinalizeBody {
    visitId: number;
}

export const POST = async (request: Request): Promise<Response> => {
    try {
        const guardResult = await requireClinicianAccessToken();
        if (guardResult.errorResponse || !guardResult.accessToken) {
            return guardResult.errorResponse ?? NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
        }

        const body = (await request.json()) as IFinalizeBody;
        if (!body.visitId) {
            return NextResponse.json({ message: "Visit id is required." }, { status: 400 });
        }

        const result = await consultationService.finalizeEncounterNote(body.visitId, guardResult.accessToken);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ message: getAbpErrorMessage(error, "Unable to finalize encounter note.") }, { status: 400 });
    }
};
