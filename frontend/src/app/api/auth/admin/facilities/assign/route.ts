import { getAbpErrorMessage } from "@/lib/api/abp";
import { requireAdminAccessToken } from "@/lib/server/adminAuthGuard";
import { adminAuthService } from "@/services/auth/adminAuthService";
import { NextResponse } from "next/server";

interface AssignBody {
    clinicianUserId: number;
    facilityId: number;
}

export const POST = async (request: Request): Promise<Response> => {
    try {
        const guardResult = await requireAdminAccessToken();
        if (guardResult.errorResponse || !guardResult.accessToken) {
            return guardResult.errorResponse ?? NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
        }

        const body = (await request.json()) as AssignBody;
        if (!body.clinicianUserId || !body.facilityId) {
            return NextResponse.json({ message: "clinicianUserId and facilityId are required." }, { status: 400 });
        }

        await adminAuthService.assignClinicianFacility(body.clinicianUserId, body.facilityId, guardResult.accessToken);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ message: getAbpErrorMessage(error, "Failed to assign clinician to facility.") }, { status: 400 });
    }
};
