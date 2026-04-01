import { getAbpErrorMessage } from "@/lib/api/abp";
import { requirePatientAccessToken } from "@/lib/server/patientAuthGuard";
import { patientTimelineService } from "@/services/patient-timeline/patientTimelineService";
import { NextResponse } from "next/server";

export const GET = async (): Promise<Response> => {
    try {
        const guardResult = await requirePatientAccessToken();
        if (guardResult.errorResponse || !guardResult.accessToken) {
            return guardResult.errorResponse ?? NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
        }

        const timeline = await patientTimelineService.getMyTimeline(guardResult.accessToken);
        return NextResponse.json(timeline);
    } catch (error) {
        return NextResponse.json({ message: getAbpErrorMessage(error, "Unable to load patient visit history.") }, { status: 400 });
    }
};
