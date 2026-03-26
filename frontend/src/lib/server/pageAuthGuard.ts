import { ACCESS_TOKEN_COOKIE_NAME, AuthState } from "@/lib/auth/constants";
import { getHomePathForAuthState } from "@/lib/auth/state";
import { deriveAuthInfoFromAccessToken } from "@/lib/server/tokenState";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Resolves the current authenticated auth-state from the access token cookie.
 * Redirects to login if no valid token exists.
 */
export async function requireAuthenticatedState(): Promise<AuthState> {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value;

    if (!accessToken) {
        redirect("/login");
    }

    try {
        return deriveAuthInfoFromAccessToken(accessToken).authState;
    } catch {
        redirect("/login");
    }
}

/**
 * Ensures the current request is in one of the allowed auth-states.
 * If authenticated but wrong state, redirects to the correct home for that state.
 */
export async function requireRouteAuthState(allowedStates: AuthState[]): Promise<void> {
    const authState = await requireAuthenticatedState();
    if (!allowedStates.includes(authState)) {
        redirect(getHomePathForAuthState(authState));
    }
}

/**
 * Ensures the current route remains guest-only.
 * Authenticated users are redirected to their home path.
 */
export async function requireGuestRoute(): Promise<void> {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
    if (!accessToken) {
        return;
    }

    try {
        const authInfo = deriveAuthInfoFromAccessToken(accessToken);
        redirect(authInfo.homePath);
    } catch {
        return;
    }
}
