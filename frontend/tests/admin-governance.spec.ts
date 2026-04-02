import { expect, test } from "@playwright/test";

const roleClaimKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

function encodeBase64Url(value: string): string {
    return Buffer.from(value, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function createJwt(payload: Record<string, unknown>): string {
    return [encodeBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" })), encodeBase64Url(JSON.stringify(payload)), "signature"].join(".");
}

const buildAdminUser = (
    overrides: Partial<{
        id: number;
        name: string;
        surname: string;
        emailAddress: string;
        requestedFacility: string;
        approvalStatus: "PendingApproval" | "Approved" | "Rejected";
        isClinicianApprovalPending: boolean;
        clinicianApprovedAt: string | null;
        clinicianDeclinedAt: string | null;
        approvalDecisionReason: string | null;
    }> = {}
) => ({
    id: overrides.id ?? 101,
    userName: `clinician-${overrides.id ?? 101}`,
    name: overrides.name ?? "Pending",
    surname: overrides.surname ?? "Clinician",
    emailAddress: overrides.emailAddress ?? `clinician-${overrides.id ?? 101}@medstream.test`,
    roleNames: [],
    requestedRegistrationRole: "Clinician",
    isClinicianApprovalPending: overrides.isClinicianApprovalPending ?? true,
    accountType: "Clinician",
    professionType: "Doctor",
    regulatoryBody: "HPCSA",
    registrationNumber: `HPCSA-${overrides.id ?? 101}`,
    requestedFacility: overrides.requestedFacility ?? "Thembisa Hospital",
    clinicianFacilityId: 1,
    approvalStatus: overrides.approvalStatus ?? "PendingApproval",
    approvalDecisionReason: overrides.approvalDecisionReason ?? null,
    idNumber: "9001015009087",
    phoneNumber: "0634113456",
    clinicianSubmittedAt: "2026-03-26T08:00:00Z",
    clinicianApprovedAt: overrides.clinicianApprovedAt ?? null,
    clinicianApprovedByUserId: null,
    clinicianDeclinedAt: overrides.clinicianDeclinedAt ?? null,
    clinicianDeclinedByUserId: null,
    authState: "clinician_pending_approval",
    isActive: true,
});

test.describe("admin governance", () => {
    test.beforeEach(async ({ context }) => {
        const adminToken = createJwt({
            [roleClaimKey]: "Admin",
            "medstream:approval_state": "approved",
        });

        await context.addCookies([
            {
                name: "medstream_access_token",
                value: adminToken,
                url: "http://localhost:3000",
            },
            {
                name: "medstream_auth_state",
                value: "admin",
                url: "http://localhost:3000",
            },
        ]);
    });

    test("shows approval stats and updates them after approving a clinician", async ({ page }) => {
        let users = [
            buildAdminUser({ id: 101, name: "Nomsa", surname: "Dlamini", approvalStatus: "PendingApproval", isClinicianApprovalPending: true }),
            buildAdminUser({ id: 102, name: "Sipho", surname: "Mokoena", approvalStatus: "Approved", isClinicianApprovalPending: false, clinicianApprovedAt: "2026-03-21T14:30:00Z" }),
            buildAdminUser({
                id: 103,
                name: "Thandi",
                surname: "Khumalo",
                approvalStatus: "Rejected",
                isClinicianApprovalPending: false,
                clinicianDeclinedAt: "2026-03-22T10:15:00Z",
                approvalDecisionReason: "Missing verification documents.",
            }),
        ];

        const facilities = [
            {
                id: 1,
                name: "Thembisa Hospital",
                code: "THB",
                facilityType: "DistrictHospital",
                province: "Gauteng",
                district: "Ekurhuleni",
                address: "Thembisa",
                isActive: true,
            },
        ];

        let approveRequestBody: { userId?: number; decisionReason?: string } | null = null;

        await page.route("**/api/auth/admin/users", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ users }),
            });
        });

        await page.route("**/api/auth/admin/facilities", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ facilities }),
            });
        });

        await page.route("**/api/auth/admin/approve", async (route) => {
            approveRequestBody = route.request().postDataJSON() as { userId?: number; decisionReason?: string };
            users = users.map((user) =>
                user.id === approveRequestBody?.userId
                    ? {
                          ...user,
                          approvalStatus: "Approved" as const,
                          isClinicianApprovalPending: false,
                          clinicianApprovedAt: "2026-03-27T09:15:00Z",
                          approvalDecisionReason: approveRequestBody?.decisionReason ?? null,
                      }
                    : user
            );

            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ user: { id: approveRequestBody?.userId } }),
            });
        });

        await page.goto("/admin", { waitUntil: "domcontentloaded" });

        await expect(page.getByRole("heading", { level: 1, name: "Admin Governance" })).toBeVisible();
        await expect(page.getByText("Nomsa Dlamini")).toBeVisible();
        await expect(page.getByLabel("Governance stats")).toContainText("Pending");
        await expect(page.getByLabel("Governance stats")).toContainText("1");
        await expect(page.getByText("1 pending requests")).toBeVisible();
        await expect(page.getByText("pending").first()).toBeVisible();

        await page.getByRole("button", { name: "Approve" }).first().click();
        await page.getByLabel("Decision reason").fill("Credentials verified.");
        await page.getByRole("button", { name: "Approve Clinician" }).click();

        expect(approveRequestBody).toEqual({
            userId: 101,
            decisionReason: "Credentials verified.",
        });

        await expect(page.getByText("0 pending requests")).toBeVisible();
        await expect(page.getByText("No clinician applications found")).toBeVisible();
        await expect(page.getByText("Clinician approved successfully.")).toBeVisible();
    });

    test.skip("renders facility governance as cards on mobile", async ({ page }) => {
        await page.setViewportSize({ width: 700, height: 900 });

        await page.route("**/api/auth/admin/users", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    users: [buildAdminUser()],
                }),
            });
        });

        await page.route("**/api/auth/admin/facilities", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    facilities: [
                        {
                            id: 1,
                            name: "Thembisa Hospital",
                            code: "THB",
                            facilityType: "DistrictHospital",
                            province: "Gauteng",
                            district: "Ekurhuleni",
                            address: "Thembisa",
                            isActive: true,
                        },
                    ],
                }),
            });
        });

        await page.goto("/admin", { waitUntil: "domcontentloaded" });
        await page.getByRole("tab", { name: /Facility Governance/i }).click();

        await expect(page.getByRole("button", { name: "Add Facility" })).toBeVisible();
        await expect(page.getByRole("heading", { name: "Thembisa Hospital" })).toBeVisible();
        await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
        await expect(page.getByRole("button", { name: "Deactivate" })).toBeVisible();
    });
});
