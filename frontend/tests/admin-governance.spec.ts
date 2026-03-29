import { expect, test } from "@playwright/test";

const roleClaimKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

function encodeBase64Url(value: string): string {
    return Buffer.from(value, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function createJwt(payload: Record<string, unknown>): string {
    return [encodeBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" })), encodeBase64Url(JSON.stringify(payload)), "signature"].join(".");
}

test.describe("admin governance", () => {
    test.skip("supports clinician approval with decision reason and facility tab rendering", async ({ page, context }) => {
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

        await page.route("**/api/auth/admin/users", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    users: [
                        {
                            id: 101,
                            userName: "clinician.pending",
                            name: "Pending",
                            surname: "Clinician",
                            emailAddress: "pending@medstream.test",
                            roleNames: [],
                            requestedRegistrationRole: "Clinician",
                            isClinicianApprovalPending: true,
                            accountType: "Clinician",
                            professionType: "Doctor",
                            regulatoryBody: "HPCSA",
                            registrationNumber: "HPCSA-111",
                            requestedFacility: "Thembisa Hospital",
                            approvalStatus: "PendingApproval",
                            approvalDecisionReason: null,
                            idNumber: "9001015009087",
                            phoneNumber: "0634113456",
                            clinicianSubmittedAt: "2026-03-26T08:00:00Z",
                            clinicianApprovedAt: null,
                            clinicianApprovedByUserId: null,
                            clinicianDeclinedAt: null,
                            clinicianDeclinedByUserId: null,
                            authState: "clinician_pending_approval",
                            isActive: true,
                        },
                    ],
                }),
            });
        });

        let createFacilityBody: Record<string, unknown> | null = null;
        let updateFacilityBody: Record<string, unknown> | null = null;
        await page.route("**/api/auth/admin/facilities", async (route) => {
            if (route.request().method() === "GET") {
                await route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify({
                        facilities: [
                            {
                                id: 1,
                                name: "Thembisa Hospital",
                                code: "THB",
                                facilityType: "Hospital",
                                province: "Eastern Cape",
                                district: "Ekurhuleni",
                                address: "Thembisa",
                                isActive: true,
                            },
                        ],
                    }),
                });
                return;
            }

            if (route.request().method() === "POST") {
                createFacilityBody = route.request().postDataJSON() as Record<string, unknown>;
            }

            if (route.request().method() === "PUT") {
                updateFacilityBody = route.request().postDataJSON() as Record<string, unknown>;
            }

            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ facility: { id: 2 } }),
            });
        });

        let activationBody: { id?: number; isActive?: boolean } | null = null;
        await page.route("**/api/auth/admin/facilities/activation", async (route) => {
            activationBody = route.request().postDataJSON() as { id?: number; isActive?: boolean };
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ facility: { id: 1, isActive: false } }),
            });
        });

        let assignBody: { clinicianUserId?: number; facilityId?: number } | null = null;
        await page.route("**/api/auth/admin/facilities/assign", async (route) => {
            assignBody = route.request().postDataJSON() as { clinicianUserId?: number; facilityId?: number };
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ success: true }),
            });
        });

        let approveRequestBody: { userId?: number; decisionReason?: string } | null = null;
        await page.route("**/api/auth/admin/approve", async (route) => {
            approveRequestBody = route.request().postDataJSON() as { userId?: number; decisionReason?: string };
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ user: { id: 101 } }),
            });
        });

        await page.goto("/admin");
        await expect(page.getByText("pending requests")).toBeVisible();

        await page.getByRole("button", { name: "Approve" }).click();
        await page.getByLabel("Decision reason").fill("Credentials verified.");
        await page.getByRole("button", { name: "Approve Clinician" }).click();

        expect(approveRequestBody).toEqual({
            userId: 101,
            decisionReason: "Credentials verified.",
        });

        await page.getByRole("tab", { name: "Facility Governance" }).click();
        await expect(page.getByRole("button", { name: "Add Facility" })).toBeVisible();
        await page.getByLabel("Facility name").fill("Alexandra Clinic");
        await selectAntdByLabel(page, page, "Type", "Clinic");
        await selectAntdByLabel(page, page, "Province", "Gauteng");
        await page.getByRole("button", { name: "Add Facility" }).click();

        expect(createFacilityBody).toMatchObject({
            name: "Alexandra Clinic",
            facilityType: "Clinic",
            province: "Gauteng",
        });

        await page.getByRole("button", { name: "Edit" }).click();
        const editDialog = page.getByRole("dialog", { name: "Edit Facility" });
        await expect(editDialog).toBeVisible();
        await selectAntdByLabel(page, editDialog, "Facility type", "Regional Hospital");
        await selectAntdByLabel(page, editDialog, "Province", "Western Cape");
        await editDialog.getByRole("button", { name: "Save" }).click();

        expect(updateFacilityBody).toMatchObject({
            id: 1,
            facilityType: "RegionalHospital",
            province: "Western Cape",
        });

        await page.getByRole("button", { name: "Deactivate" }).click();
        expect(activationBody).toEqual({
            id: 1,
            isActive: false,
        });

        await page.getByRole("tab", { name: "Clinician Approvals" }).click();
        const assignFacilitySelect = page.getByPlaceholder("Assign facility");
        await assignFacilitySelect.click();
        await assignFacilitySelect.press("Enter");
        await page.getByRole("button", { name: "Assign" }).click();
        expect(assignBody).toEqual({
            clinicianUserId: 101,
            facilityId: 1,
        });
    });
});

async function selectAntdByLabel(page: import("@playwright/test").Page, scope: import("@playwright/test").Locator | import("@playwright/test").Page, label: string, option: string): Promise<void> {
    const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const combobox = scope.getByRole("combobox", { name: new RegExp(`\\b${escapedLabel}\\b`, "i") }).first();

    if (await combobox.count()) {
        await combobox.click();
        await combobox.fill(option);
    } else {
        const fallbackSelect = scope
            .locator(".ant-form-item")
            .filter({
                has: scope.locator(".ant-form-item-label label", { hasText: label }),
            })
            .locator(".ant-select-selector")
            .first();
        await fallbackSelect.click();
        await page.keyboard.type(option);
    }

    await page.keyboard.press("Enter");
}
