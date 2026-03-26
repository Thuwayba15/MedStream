import { IClinicianApplicant, IFacility, IFacilityUpsertRequest } from "./types";

interface IMessageResponse {
    message?: string;
}

async function parseResponse<TResponse>(response: Response, fallbackMessage: string): Promise<TResponse> {
    const body = (await response.json()) as TResponse & IMessageResponse;
    if (!response.ok) {
        throw new Error(body.message ?? fallbackMessage);
    }

    return body;
}

async function getApplicants(): Promise<IClinicianApplicant[]> {
    const response = await fetch("/api/auth/admin/users");
    const body = await parseResponse<{ users: IClinicianApplicant[] }>(response, "Unable to load clinician applicants.");
    return body.users;
}

async function decideClinician(userId: number, decisionReason: string, mode: "approve" | "decline"): Promise<void> {
    const endpoint = mode === "approve" ? "/api/auth/admin/approve" : "/api/auth/admin/decline";
    const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            userId,
            decisionReason: decisionReason.trim(),
        }),
    });

    await parseResponse(response, "Unable to submit clinician decision.");
}

async function getFacilities(): Promise<IFacility[]> {
    const response = await fetch("/api/auth/admin/facilities");
    const body = await parseResponse<{ facilities: IFacility[] }>(response, "Unable to load facilities.");
    return body.facilities;
}

async function createFacility(payload: IFacilityUpsertRequest): Promise<void> {
    const response = await fetch("/api/auth/admin/facilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    await parseResponse(response, "Unable to create facility.");
}

async function updateFacility(payload: IFacilityUpsertRequest): Promise<void> {
    const response = await fetch("/api/auth/admin/facilities", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    await parseResponse(response, "Unable to update facility.");
}

async function setActivation(id: number, isActive: boolean): Promise<void> {
    const response = await fetch("/api/auth/admin/facilities/activation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive }),
    });

    await parseResponse(response, "Unable to update facility activation.");
}

async function assignClinicianFacility(clinicianUserId: number, facilityId: number): Promise<void> {
    const response = await fetch("/api/auth/admin/facilities/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicianUserId, facilityId }),
    });

    await parseResponse(response, "Unable to assign clinician facility.");
}

async function getActiveFacilities(): Promise<Array<{ id: number; name: string }>> {
    const response = await fetch("/api/auth/facilities/active");
    const body = await parseResponse<{ facilities: Array<{ id: number; name: string }> }>(response, "Unable to load active facilities.");
    return body.facilities;
}

export const adminGovernanceService = {
    getApplicants,
    decideClinician,
    getFacilities,
    createFacility,
    updateFacility,
    setActivation,
    assignClinicianFacility,
    getActiveFacilities,
};
