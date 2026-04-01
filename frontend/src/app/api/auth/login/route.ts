import { ACCESS_TOKEN_COOKIE_NAME, AUTH_STATE_COOKIE_NAME, SIGNALR_TOKEN_COOKIE_NAME } from "@/lib/auth/constants";
import type { IAuthFieldError } from "@/lib/auth/types";
import { getAbpErrorDetails } from "@/lib/api/abp";
import { authenticateUser } from "@/lib/server/authApi";
import { deriveAuthInfoFromAccessToken } from "@/lib/server/tokenState";
import { NextResponse } from "next/server";

interface LoginRequestBody {
    userNameOrEmailAddress: string;
    password: string;
}

export const POST = async (request: Request): Promise<Response> => {
    try {
        const body = (await request.json()) as LoginRequestBody;
        if (!body.userNameOrEmailAddress || !body.password) {
            const fieldErrors: IAuthFieldError[] = [
                !body.userNameOrEmailAddress ? { field: "userNameOrEmailAddress", message: "Enter your email address." } : null,
                !body.password ? { field: "password", message: "Enter your password." } : null,
            ].filter((item): item is IAuthFieldError => item !== null);

            return NextResponse.json({ message: "Username/email and password are required.", fieldErrors }, { status: 400 });
        }

        const authResult = await authenticateUser({
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
        response.cookies.set({
            name: SIGNALR_TOKEN_COOKIE_NAME,
            value: authResult.encryptedAccessToken,
            httpOnly: false,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: authResult.expireInSeconds,
        });

        return response;
    } catch (error) {
        const authError = getAbpErrorDetails(error, "Incorrect email or password.");
        const message = normalizeLoginErrorMessage(authError.message);

        return NextResponse.json(
            {
                message,
                fieldErrors: [{ field: "password", message }],
            },
            { status: 401 }
        );
    }
};

const normalizeLoginErrorMessage = (message: string): string => {
    if (!message) {
        return "Incorrect email or password.";
    }

    const normalizedMessage = message.toLowerCase();
    if (normalizedMessage.includes("invalid username or password") || normalizedMessage.includes("login failed")) {
        return "Incorrect email or password.";
    }

    return message;
};
