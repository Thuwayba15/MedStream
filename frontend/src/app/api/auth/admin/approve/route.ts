import { ACCESS_TOKEN_COOKIE_NAME } from "@/lib/auth/constants";
import { getAbpErrorMessage } from "@/lib/api/abp";
import { adminAuthService } from "@/services/auth/adminAuthService";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

interface ApproveRequestBody {
    userId: number;
}

export async function POST(request: Request): Promise<Response> {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
        if (!accessToken) {
            return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
        }

        const body = (await request.json()) as ApproveRequestBody;
        if (!body.userId || body.userId <= 0) {
            return NextResponse.json({ message: "Valid userId is required." }, { status: 400 });
        }

        const approvedUser = await adminAuthService.approveClinician(body.userId, accessToken);

        return NextResponse.json({ user: approvedUser });
    } catch (error) {
        return NextResponse.json(
            { message: getAbpErrorMessage(error, "Failed to approve clinician.") },
            { status: 400 },
        );
    }
}
