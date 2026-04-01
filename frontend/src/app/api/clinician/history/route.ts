import { getAbpErrorMessage } from "@/lib/api/abp";
import { requireClinicianAccessToken } from "@/lib/server/clinicianAuthGuard";
import { patientTimelineService } from "@/services/patient-timeline/patientTimelineService";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (request: NextRequest): Promise<Response> => {
    try {
        const guardResult = await requireClinicianAccessToken();
        if (guardResult.errorResponse || !guardResult.accessToken) {
            return guardResult.errorResponse ?? NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
        }

        const patientUserIdValue = request.nextUrl.searchParams.get("patientUserId");
        const patientUserId = Number(patientUserIdValue);
        if (!Number.isInteger(patientUserId) || patientUserId <= 0) {
            return NextResponse.json({ message: "Patient user id is invalid." }, { status: 400 });
        }

        const timeline = await patientTimelineService.getPatientTimeline({ patientUserId }, guardResult.accessToken);
        return NextResponse.json(timeline);
    } catch (error) {
        return NextResponse.json({ message: getAbpErrorMessage(error, "Unable to load patient timeline.") }, { status: 400 });
    }
};
