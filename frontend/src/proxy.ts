import { NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE_NAME, AUTH_STATE_COOKIE_NAME, AuthState } from "@/lib/auth/constants";
import { decodeJwtPayload, deriveAuthStateFromJwtPayload, getHomePathForAuthState } from "@/lib/auth/state";

const authPages = ["/login", "/registration"];

const isProtectedPath = (pathname: string): boolean => {
    return (
        pathname === "/patient" ||
        pathname.startsWith("/patient/") ||
        pathname === "/clinician" ||
        pathname.startsWith("/clinician/") ||
        pathname === "/admin" ||
        pathname.startsWith("/admin/") ||
        pathname === "/awaiting-approval" ||
        pathname.startsWith("/awaiting-approval/")
    );
};

export const proxy = (request: NextRequest): NextResponse => {
    const { pathname } = request.nextUrl;

    if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname === "/favicon.ico") {
        return NextResponse.next();
    }

    const token = request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
    const isAuthPage = authPages.some((authPath) => pathname === authPath || pathname.startsWith(`${authPath}/`));

    if (!token) {
        if (isProtectedPath(pathname)) {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        return NextResponse.next();
    }

    const authStateCookieValue = request.cookies.get(AUTH_STATE_COOKIE_NAME)?.value;
    const authStateFromCookie = parseAuthStateCookie(authStateCookieValue);

    let authState: AuthState;
    if (authStateFromCookie) {
        authState = authStateFromCookie;
    } else {
        const jwtPayload = decodeJwtPayload(token);
        if (!jwtPayload) {
            const response = NextResponse.redirect(new URL("/login", request.url));
            response.cookies.delete(ACCESS_TOKEN_COOKIE_NAME);
            response.cookies.delete(AUTH_STATE_COOKIE_NAME);
            return response;
        }

        authState = deriveAuthStateFromJwtPayload(jwtPayload);
    }

    const homePath = getHomePathForAuthState(authState);

    if (isAuthPage) {
        return NextResponse.redirect(new URL(homePath, request.url));
    }

    if (isProtectedPath(pathname) && !pathname.startsWith(homePath)) {
        return NextResponse.redirect(new URL(homePath, request.url));
    }

    return NextResponse.next();
};

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

const parseAuthStateCookie = (value: string | undefined): AuthState | null => {
    if (value === "admin" || value === "clinician_approved" || value === "clinician_pending_approval" || value === "patient") {
        return value;
    }

    return null;
};
