import { ACCESS_TOKEN_COOKIE_NAME } from "@/lib/auth/constants";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const GET = async (): Promise<Response> => {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value;

    if (!accessToken) {
        return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    }

    return NextResponse.json({ accessToken });
};
