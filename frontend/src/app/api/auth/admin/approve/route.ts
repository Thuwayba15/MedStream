import { getAbpErrorMessage } from "@/lib/api/abp";
import { requireAdminAccessToken } from "@/lib/server/adminAuthGuard";
import { adminAuthService } from "@/services/auth/adminAuthService";
import { NextResponse } from "next/server";

interface ApproveRequestBody {
    userId: number;
    decisionReason: string;
}

export async function POST(request: Request): Promise<Response> {
    try {
        const guardResult = await requireAdminAccessToken();
        if (guardResult.errorResponse || !guardResult.accessToken) {
            return guardResult.errorResponse ?? NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
        }

        const body = (await request.json()) as ApproveRequestBody;
        if (!body.userId || body.userId <= 0 || !body.decisionReason?.trim()) {
            return NextResponse.json({ message: "Valid userId and decisionReason are required." }, { status: 400 });
        }

        const approvedUser = await adminAuthService.decideClinician(body.userId, body.decisionReason, true, guardResult.accessToken);

        return NextResponse.json({ user: approvedUser });
    } catch (error) {
        return NextResponse.json({ message: getAbpErrorMessage(error, "Failed to approve clinician.") }, { status: 400 });
    }
}
