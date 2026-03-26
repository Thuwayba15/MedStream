import { ACCESS_TOKEN_COOKIE_NAME } from "@/lib/auth/constants";
import { getAbpErrorMessage } from "@/lib/api/abp";
import { deriveAuthState } from "@/lib/server/authProfile";
import { adminAuthService } from "@/services/auth/adminAuthService";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(): Promise<Response> {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
        if (!accessToken) {
            return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
        }

        const pagedUsers = await adminAuthService.getUsers(accessToken);

        const users = pagedUsers.items.map((user) => ({
            ...user,
            authState: deriveAuthState(
                user.roleNames ?? [],
                user.requestedRegistrationRole ?? null,
                user.isClinicianApprovalPending ?? false,
            ),
        }));

        return NextResponse.json({ users });
    } catch (error) {
        return NextResponse.json(
            { message: getAbpErrorMessage(error, "Failed to load users.") },
            { status: 400 },
        );
    }
}
