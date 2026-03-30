import { ACCESS_TOKEN_COOKIE_NAME } from "@/lib/auth/constants";
import { deriveAuthInfoFromAccessToken } from "@/lib/server/tokenState";
import { cookies } from "next/headers";

interface IClinicianAuthGuardResult {
    accessToken: string | null;
    errorResponse: Response | null;
}

/**
 * Resolves and validates an approved clinician access token for clinician-only route handlers.
 */
export const requireClinicianAccessToken = async (): Promise<IClinicianAuthGuardResult> => {
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
        if (authInfo.authState !== "clinician_approved") {
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
};
