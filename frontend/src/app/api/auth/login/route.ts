import { ACCESS_TOKEN_COOKIE_NAME, AUTH_STATE_COOKIE_NAME } from "@/lib/auth/constants";
import { getAbpErrorMessage } from "@/lib/api/abp";
import { deriveAuthInfoFromAccessToken } from "@/lib/server/tokenState";
import { authService } from "@/services/auth/authService";
import { NextResponse } from "next/server";

interface LoginRequestBody {
    userNameOrEmailAddress: string;
    password: string;
}

export async function POST(request: Request): Promise<Response> {
    try {
        const body = (await request.json()) as LoginRequestBody;
        if (!body.userNameOrEmailAddress || !body.password) {
            return NextResponse.json({ message: "Username/email and password are required." }, { status: 400 });
        }

        const authResult = await authService.login({
            userNameOrEmailAddress: body.userNameOrEmailAddress,
            password: body.password,
        });

        const authInfo = deriveAuthInfoFromAccessToken(authResult.accessToken);
        const response = NextResponse.json({
            homePath: authInfo.homePath,
        });

        response.cookies.set({
            name: ACCESS_TOKEN_COOKIE_NAME,
            value: authResult.accessToken,
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: authResult.expireInSeconds,
        });
        response.cookies.set({
            name: AUTH_STATE_COOKIE_NAME,
            value: authInfo.authState,
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: authResult.expireInSeconds,
        });

        return response;
    } catch (error) {
        return NextResponse.json(
            { message: getAbpErrorMessage(error, "Login failed.") },
            { status: 401 },
        );
    }
}
