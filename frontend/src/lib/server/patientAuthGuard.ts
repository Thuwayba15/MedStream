import { ACCESS_TOKEN_COOKIE_NAME } from "@/lib/auth/constants";
import { deriveAuthInfoFromAccessToken } from "@/lib/server/tokenState";
import { cookies } from "next/headers";

interface IPatientAuthGuardResult {
    accessToken: string | null;
    errorResponse: Response | null;
}

/**
 * Resolves and validates a patient-scoped access token for patient-only route handlers.
 */
export async function requirePatientAccessToken(): Promise<IPatientAuthGuardResult> {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
    if (!accessToken) {
        return {
            accessToken: null,
            errorResponse: Response.json({ message: "Unauthenticated." }, { status: 401 }),
        };
    }

    try {
        const authInfo = deriveAuthInfoFromAccessToken(accessToken);
        if (authInfo.authState !== "patient") {
            return {
                accessToken: null,
                errorResponse: Response.json({ message: "Forbidden." }, { status: 403 }),
            };
        }

        return {
            accessToken,
            errorResponse: null,
        };
    } catch {
        return {
            accessToken: null,
            errorResponse: Response.json({ message: "Invalid authentication token." }, { status: 401 }),
        };
    }
}
