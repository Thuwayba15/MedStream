import { getAbpErrorMessage } from "@/lib/api/abp";
import { requireAdminAccessToken } from "@/lib/server/adminAuthGuard";
import { decideClinicianApplicant } from "@/lib/server/authApi";
import { NextResponse } from "next/server";

interface ApproveRequestBody {
    userId: number;
    decisionReason: string;
}

export const POST = async (request: Request): Promise<Response> => {
    try {
        const guardResult = await requireAdminAccessToken();
        if (guardResult.errorResponse || !guardResult.accessToken) {
            return guardResult.errorResponse ?? NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
        }

        const body = (await request.json()) as ApproveRequestBody;
        if (!body.userId || body.userId <= 0 || !body.decisionReason?.trim()) {
            return NextResponse.json({ message: "Valid userId and decisionReason are required." }, { status: 400 });
        }

        const approvedUser = await decideClinicianApplicant(body.userId, body.decisionReason, true, guardResult.accessToken);

        return NextResponse.json({ user: approvedUser });
    } catch (error) {
        return NextResponse.json({ message: getAbpErrorMessage(error, "Failed to approve clinician.") }, { status: 400 });
    }
};
