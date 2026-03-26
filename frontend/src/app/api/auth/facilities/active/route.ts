import { getAbpErrorMessage } from "@/lib/api/abp";
import { adminAuthService } from "@/services/auth/adminAuthService";
import { NextResponse } from "next/server";

export async function GET(): Promise<Response> {
    try {
        const facilities = await adminAuthService.getActiveFacilitiesForRegistration();
        return NextResponse.json({ facilities });
    } catch (error) {
        return NextResponse.json({ message: getAbpErrorMessage(error, "Failed to load active facilities.") }, { status: 400 });
    }
}
