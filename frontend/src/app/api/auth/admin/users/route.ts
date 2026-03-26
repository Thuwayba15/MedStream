import { getAbpErrorMessage } from "@/lib/api/abp";
import { deriveAuthState } from "@/lib/server/authProfile";
import { requireAdminAccessToken } from "@/lib/server/adminAuthGuard";
import { adminAuthService } from "@/services/auth/adminAuthService";
import { NextResponse } from "next/server";

export async function GET(): Promise<Response> {
    try {
        const guardResult = await requireAdminAccessToken();
        if (guardResult.errorResponse || !guardResult.accessToken) {
            return guardResult.errorResponse ?? NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
        }

        const pagedUsers = await adminAuthService.getUsers(guardResult.accessToken);

        const users = pagedUsers.items.map((user) => ({
            ...user,
            authState: deriveAuthState(user.roleNames ?? [], user.requestedRegistrationRole ?? null, user.isClinicianApprovalPending ?? false),
        }));

        return NextResponse.json({ users });
    } catch (error) {
        return NextResponse.json({ message: getAbpErrorMessage(error, "Failed to load users.") }, { status: 400 });
    }
}
