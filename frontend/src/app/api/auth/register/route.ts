import { ACCESS_TOKEN_COOKIE_NAME, AUTH_STATE_COOKIE_NAME } from "@/lib/auth/constants";
import { getAbpErrorMessage } from "@/lib/api/abp";
import { deriveAuthInfoFromAccessToken } from "@/lib/server/tokenState";
import { authService } from "@/services/auth/authService";
import { NextResponse } from "next/server";

interface RegisterRequestBody {
    firstName: string;
    lastName: string;
    emailAddress: string;
    phoneNumber: string;
    password: string;
    confirmPassword: string;
    idNumber?: string;
    dateOfBirth?: string;
    accountType: "Patient" | "Clinician";
    professionType?: "Doctor" | "Nurse" | "AlliedHealth" | "Other";
    regulatoryBody?: "HPCSA" | "SANC" | "Other";
    registrationNumber?: string;
    requestedFacility?: string;
}

export async function POST(request: Request): Promise<Response> {
    try {
        const body = (await request.json()) as RegisterRequestBody;
        if (!body.firstName || !body.lastName || !body.emailAddress || !body.phoneNumber || !body.password || !body.confirmPassword || !body.accountType) {
            return NextResponse.json({ message: "All registration fields are required." }, { status: 400 });
        }

        const registerResult = await authService.register({
            firstName: body.firstName,
            lastName: body.lastName,
            emailAddress: body.emailAddress,
            phoneNumber: body.phoneNumber,
            password: body.password,
            confirmPassword: body.confirmPassword,
            idNumber: body.idNumber || null,
            dateOfBirth: body.dateOfBirth || null,
            accountType: body.accountType,
            professionType: body.professionType || null,
            regulatoryBody: body.regulatoryBody || null,
            registrationNumber: body.registrationNumber || null,
            requestedFacility: body.requestedFacility || null,
        });

        if (!registerResult.canLogin) {
            return NextResponse.json({ message: "Registration succeeded but automatic login is unavailable." }, { status: 400 });
        }

        const authResult = await authService.login({
            userNameOrEmailAddress: body.emailAddress,
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
        const rawMessage = getAbpErrorMessage(error, "Registration failed.");
        const debugCode = `REG-${Date.now()}`;
        console.error(`[${debugCode}] /api/auth/register failed: ${rawMessage}`);

        return NextResponse.json(
            {
                message: sanitizeRegistrationErrorMessage(rawMessage, debugCode),
                debugCode,
                rawMessage: process.env.NODE_ENV !== "production" ? rawMessage : undefined,
            },
            { status: 400 }
        );
    }
}

function sanitizeRegistrationErrorMessage(message: string, debugCode: string): string {
    if (!message) {
        return `Registration failed. Please review your details and try again. (${debugCode})`;
    }

    if (message.includes("There is no entity User with id")) {
        return `Registration failed due to inconsistent server user references. Ask an admin to run DB migration/seed repair. (${debugCode})`;
    }

    if (message.includes("internal error") || message.includes("InternalServerError")) {
        return `Registration failed due to an unexpected backend error. See backend logs with code ${debugCode}.`;
    }

    return message;
}
