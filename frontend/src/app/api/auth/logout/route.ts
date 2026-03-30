import { ACCESS_TOKEN_COOKIE_NAME, AUTH_STATE_COOKIE_NAME, SIGNALR_TOKEN_COOKIE_NAME } from "@/lib/auth/constants";
import { NextResponse } from "next/server";

export const POST = async (): Promise<Response> => {
    const response = NextResponse.json({ success: true });
    const cookieNames = [ACCESS_TOKEN_COOKIE_NAME, AUTH_STATE_COOKIE_NAME, SIGNALR_TOKEN_COOKIE_NAME, "Abp.AuthToken", "XSRF-TOKEN"];

    cookieNames.forEach((cookieName) => {
        response.cookies.set({
            name: cookieName,
            value: "",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 0,
            expires: new Date(0),
        });
    });

    return response;
};
