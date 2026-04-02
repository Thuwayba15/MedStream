import { getAbpErrorMessage } from "@/lib/api/abp";
import type { IFacilityListItem } from "@/lib/auth/types";
import { requireAdminAccessToken } from "@/lib/server/adminAuthGuard";
import { createAdminFacility, getAdminFacilities, updateAdminFacility } from "@/lib/server/authApi";
import { NextResponse } from "next/server";

type FacilityBody = Omit<IFacilityListItem, "id">;

export const GET = async (): Promise<Response> => {
    try {
        const guardResult = await requireAdminAccessToken();
        if (guardResult.errorResponse || !guardResult.accessToken) {
            return guardResult.errorResponse ?? NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
        }

        const facilities = await getAdminFacilities(guardResult.accessToken);
        return NextResponse.json({ facilities });
    } catch (error) {
        return NextResponse.json({ message: getAbpErrorMessage(error, "Failed to load facilities.") }, { status: 400 });
    }
};

export const POST = async (request: Request): Promise<Response> => {
    try {
        const guardResult = await requireAdminAccessToken();
        if (guardResult.errorResponse || !guardResult.accessToken) {
            return guardResult.errorResponse ?? NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
        }

        const body = (await request.json()) as FacilityBody;
        if (!body.name?.trim()) {
            return NextResponse.json({ message: "Facility name is required." }, { status: 400 });
        }
        if (!body.facilityType?.trim()) {
            return NextResponse.json({ message: "Facility type is required." }, { status: 400 });
        }
        if (!body.province?.trim()) {
            return NextResponse.json({ message: "Province is required." }, { status: 400 });
        }

        const facility = await createAdminFacility(body, guardResult.accessToken);
        return NextResponse.json({ facility });
    } catch (error) {
        return NextResponse.json({ message: getAbpErrorMessage(error, "Failed to create facility.") }, { status: 400 });
    }
};

export const PUT = async (request: Request): Promise<Response> => {
    try {
        const guardResult = await requireAdminAccessToken();
        if (guardResult.errorResponse || !guardResult.accessToken) {
            return guardResult.errorResponse ?? NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
        }

        const body = (await request.json()) as IFacilityListItem;
        if (!body.id || !body.name?.trim()) {
            return NextResponse.json({ message: "Facility id and name are required." }, { status: 400 });
        }
        if (!body.facilityType?.trim()) {
            return NextResponse.json({ message: "Facility type is required." }, { status: 400 });
        }
        if (!body.province?.trim()) {
            return NextResponse.json({ message: "Province is required." }, { status: 400 });
        }

        const facility = await updateAdminFacility(body, guardResult.accessToken);
        return NextResponse.json({ facility });
    } catch (error) {
        return NextResponse.json({ message: getAbpErrorMessage(error, "Failed to update facility.") }, { status: 400 });
    }
};
