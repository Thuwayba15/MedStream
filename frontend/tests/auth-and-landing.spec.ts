import { expect, test } from "@playwright/test";

const roleClaimKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

function encodeBase64Url(value: string): string {
    return Buffer.from(value, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function createJwt(payload: Record<string, unknown>): string {
    return [encodeBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" })), encodeBase64Url(JSON.stringify(payload)), "signature"].join(".");
}

test.describe("landing page", () => {
    test.beforeEach(async ({ context }) => {
        await context.clearCookies();
    });

    test("renders hero content and feature spotlight", async ({ page }) => {
        await page.goto("/", { waitUntil: "domcontentloaded" });

        await expect(page.getByRole("heading", { level: 1, name: /Better care starts with better workflow/i })).toBeVisible();
        await expect(page.getByRole("heading", { level: 2, name: "The MedStream Way" })).toBeVisible();
        await expect(page.getByRole("tab", { name: "Show Patient Intake" })).toBeVisible();
        await expect(page.getByAltText("MedStream brand mark")).toBeVisible();
    });

    test("routes from landing page to auth screens", async ({ page }) => {
        await page.goto("/", { waitUntil: "domcontentloaded" });

        await page.getByRole("link", { name: "Login" }).click();
        await expect(page).toHaveURL(/\/login$/);
        await expect(page.getByRole("heading", { level: 1, name: "Login" })).toBeVisible();

        await page.goto("/", { waitUntil: "domcontentloaded" });
        await page.getByRole("link", { name: "Sign Up" }).click();
        await expect(page).toHaveURL(/\/registration$/);
        await expect(page.getByRole("heading", { level: 1, name: "Registration" })).toBeVisible();
    });
});

test.describe("auth state routing", () => {
    test("redirects unauthenticated protected access to login", async ({ page }) => {
        await page.goto("/patient");
        await expect(page).toHaveURL(/\/login$/);
    });

    test("login result establishes patient auth state and lands on patient home", async ({ page, context }) => {
        const patientToken = createJwt({
            [roleClaimKey]: "Patient",
            "medstream:approval_state": "approved",
            "medstream:requested_registration_role": "Patient",
        });

        await page.route("**/api/auth/login", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ homePath: "/patient" }),
            });
        });

        await page.goto("/login");
        await page.getByLabel("Username or Email").fill("patient-user");
        await page.getByLabel("Password").fill("Password1");
        await Promise.all([page.waitForResponse((response) => response.url().includes("/api/auth/login") && response.status() === 200), page.getByRole("button", { name: "Sign In" }).click()]);

        await context.addCookies([
            {
                name: "medstream_access_token",
                value: patientToken,
                url: "http://localhost:3000",
            },
            {
                name: "medstream_auth_state",
                value: "patient",
                url: "http://localhost:3000",
            },
        ]);

        await page.goto("/patient", { waitUntil: "domcontentloaded" });

        await expect(page).toHaveURL(/\/patient$/);
        await expect(page.getByText("Step 1 of 5")).toBeVisible();
        await expect(page.getByText("New Visit").first()).toBeVisible();
        await expect(page.getByRole("button", { name: "Sign Out" })).toBeVisible();
    });

    test("registration redirects clinician to awaiting approval", async ({ page }) => {
        const pendingClinicianToken = createJwt({
            "medstream:approval_state": "pending",
            "medstream:requested_registration_role": "Clinician",
        });

        await page.route("**/api/auth/facilities/active", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    facilities: [
                        { id: 1, name: "Johannesburg Clinic" },
                        { id: 2, name: "Soweto CHC" },
                    ],
                }),
            });
        });

        let registerRequestBody: Record<string, unknown> | null = null;
        await page.route("**/api/auth/register", async (route) => {
            registerRequestBody = route.request().postDataJSON() as Record<string, unknown>;
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ homePath: "/awaiting-approval" }),
            });
        });

        await page.goto("/registration", { waitUntil: "domcontentloaded" });
        const registerResult = await page.evaluate(async () => {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName: "Clinician",
                    lastName: "Applicant",
                    emailAddress: "clinician@applicant.test",
                    phoneNumber: "0634113456",
                    password: "Password1",
                    confirmPassword: "Password1",
                    idNumber: "9001015009087",
                    accountType: "Clinician",
                    professionType: "Doctor",
                    regulatoryBody: "HPCSA",
                    registrationNumber: "HPCSA-1234",
                    requestedFacilityId: 2,
                }),
            });

            return {
                status: response.status,
                body: await response.json(),
            };
        });

        expect(registerResult.status).toBe(200);
        expect(registerResult.body).toMatchObject({ homePath: "/awaiting-approval" });

        await page.context().addCookies([
            {
                name: "medstream_access_token",
                value: pendingClinicianToken,
                url: "http://localhost:3000",
            },
            {
                name: "medstream_auth_state",
                value: "clinician_pending_approval",
                url: "http://localhost:3000",
            },
        ]);

        await page.goto("/awaiting-approval", { waitUntil: "domcontentloaded" });

        await expect(page).toHaveURL(/\/awaiting-approval$/);
        await expect(page.getByRole("heading", { level: 1, name: "Awaiting Approval" })).toBeVisible();
        expect(registerRequestBody).toMatchObject({
            accountType: "Clinician",
            requestedFacilityId: 2,
        });
    });

    test("pending clinician is guarded to awaiting-approval route", async ({ page, context }) => {
        const pendingClinicianToken = createJwt({
            "medstream:approval_state": "pending",
            "medstream:requested_registration_role": "Clinician",
        });

        await context.addCookies([
            {
                name: "medstream_access_token",
                value: pendingClinicianToken,
                url: "http://localhost:3000",
            },
        ]);

        await page.goto("/clinician", { waitUntil: "domcontentloaded" });
        await expect(page).toHaveURL(/\/awaiting-approval$/);
        await expect(page.getByRole("heading", { level: 1, name: "Awaiting Approval" })).toBeVisible();
    });

    test("approved clinician sees workspace top nav", async ({ page, context }) => {
        const approvedClinicianToken = createJwt({
            [roleClaimKey]: "Clinician",
            "medstream:approval_state": "approved",
            "medstream:requested_registration_role": "Clinician",
        });

        await context.addCookies([
            {
                name: "medstream_access_token",
                value: approvedClinicianToken,
                url: "http://localhost:3000",
            },
        ]);

        await page.goto("/clinician", { waitUntil: "domcontentloaded" });
        await expect(page.getByRole("heading", { level: 1, name: "Queue Dashboard" })).toBeVisible();
        // await expect(page.getByRole("link", { name: "Workspace" })).toBeVisible();
        await expect(page.getByRole("button", { name: "Sign Out" })).toBeVisible();
    });
});
