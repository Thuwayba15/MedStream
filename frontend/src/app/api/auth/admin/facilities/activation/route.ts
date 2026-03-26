import { getAbpErrorMessage } from "@/lib/api/abp";
import { requireAdminAccessToken } from "@/lib/server/adminAuthGuard";
import { adminAuthService } from "@/services/auth/adminAuthService";
import { NextResponse } from "next/server";

interface ActivationBody {
    id: number;
    isActive: boolean;
}

export async function POST(request: Request): Promise<Response> {
    try {
        const guardResult = await requireAdminAccessToken();
        if (guardResult.errorResponse || !guardResult.accessToken) {
            return guardResult.errorResponse ?? NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
        }

        const body = (await request.json()) as ActivationBody;
        if (!body.id || body.id <= 0) {
            return NextResponse.json({ message: "Valid facility id is required." }, { status: 400 });
        }

        const facility = await adminAuthService.setFacilityActivation(body.id, body.isActive, guardResult.accessToken);
        return NextResponse.json({ facility });
    } catch (error) {
        return NextResponse.json({ message: getAbpErrorMessage(error, "Failed to update facility activation.") }, { status: 400 });
    }
}
