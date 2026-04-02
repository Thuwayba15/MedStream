import { getAbpErrorMessage } from "@/lib/api/abp";
import { getRegistrationFacilities } from "@/lib/server/authApi";
import { NextResponse } from "next/server";

export const GET = async (): Promise<Response> => {
    try {
        const facilities = await getRegistrationFacilities();
        return NextResponse.json({ facilities });
    } catch (error) {
        return NextResponse.json({ message: getAbpErrorMessage(error, "Failed to load active facilities.") }, { status: 400 });
    }
};
