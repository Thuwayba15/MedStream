import { ACCESS_TOKEN_COOKIE_NAME, AUTH_STATE_COOKIE_NAME } from "@/lib/auth/constants";
import { deriveAuthInfoFromAccessToken } from "@/lib/server/tokenState";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(): Promise<Response> {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
        if (!accessToken) {
            return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
        }

        const authInfo = deriveAuthInfoFromAccessToken(accessToken);
        const response = NextResponse.json({
            user: {
                authState: authInfo.authState,
                homePath: authInfo.homePath,
            },
        });

        response.cookies.set({
            name: AUTH_STATE_COOKIE_NAME,
            value: authInfo.authState,
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
        });

        return response;
    } catch (error) {
        return NextResponse.json(
            { message: error instanceof Error ? error.message : "Failed to load current user." },
            { status: 401 },
        );
    }
}
