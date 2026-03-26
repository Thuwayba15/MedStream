import { expect, test } from "@playwright/test";

const roleClaimKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

function encodeBase64Url(value: string): string {
    return Buffer.from(value, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function createJwt(payload: Record<string, unknown>): string {
    return [
        encodeBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" })),
        encodeBase64Url(JSON.stringify(payload)),
        "signature",
    ].join(".");
}

test.describe("landing page", () => {
    test.beforeEach(async ({ context }) => {
        await context.clearCookies();
    });

    test("renders hero content and feature spotlight", async ({ page }) => {
        await page.goto("/");

        await expect(page.getByRole("heading", { level: 1, name: /Better care starts with better workflow/i })).toBeVisible();
        await expect(page.getByRole("heading", { level: 2, name: "The MedStream Way" })).toBeVisible();
        await expect(page.getByRole("tab", { name: "Show Patient Intake" })).toBeVisible();
        await expect(page.getByAltText("MedStream brand mark")).toBeVisible();
    });

    test("routes from landing page to auth screens", async ({ page }) => {
        await page.goto("/");

        await page.getByRole("link", { name: "Login" }).click();
        await expect(page).toHaveURL(/\/login$/);
        await expect(page.getByRole("heading", { level: 1, name: "Login" })).toBeVisible();

        await page.goto("/");
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

    test("login redirects to patient home for patient role", async ({ page }) => {
        const patientToken = createJwt({
            [roleClaimKey]: "Patient",
            "medstream:approval_state": "approved",
            "medstream:requested_registration_role": "Patient",
        });

        await page.route("**/api/auth/login", async (route) => {
            await route.fulfill({
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Set-Cookie": `medstream_access_token=${patientToken}; Path=/;`,
                },
                body: JSON.stringify({ homePath: "/patient" }),
            });
        });

        await page.goto("/login");
        await page.getByLabel("Username or Email").fill("patient-user");
        await page.getByLabel("Password").fill("Password1");
        await page.getByRole("button", { name: "Sign In" }).click();

        await expect(page).toHaveURL(/\/patient$/);
        await expect(page.getByRole("heading", { level: 1, name: "Patient Portal" })).toBeVisible();
    });

    test("registration redirects clinician to awaiting approval", async ({ page }) => {
        const pendingClinicianToken = createJwt({
            "medstream:approval_state": "pending",
            "medstream:requested_registration_role": "Clinician",
        });

        await page.route("**/api/auth/register", async (route) => {
            await route.fulfill({
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Set-Cookie": `medstream_access_token=${pendingClinicianToken}; Path=/;`,
                },
                body: JSON.stringify({ homePath: "/awaiting-approval" }),
            });
        });

        await page.goto("/registration");
        await page.getByRole("radio", { name: "Clinician" }).check();
        await page.getByLabel("First name").fill("Clinician");
        await page.getByLabel("Last name").fill("Applicant");
        await page.getByLabel("Email").fill("clinician@applicant.test");
        await page.getByLabel("Phone number").fill("0634113456");
        await page.getByLabel("Password", { exact: true }).fill("Password1");
        await page.getByLabel("Confirm password", { exact: true }).fill("Password1");
        await page.getByLabel("ID number").fill("9001015009087");
        await page.getByRole("radio", { name: "Doctor" }).check();
        await page.getByRole("radio", { name: "HPCSA" }).check();
        await page.getByLabel("Registration number").fill("HPCSA-1234");
        await page.getByLabel("Requested facility").fill("Johannesburg Clinic");
        await page.getByRole("button", { name: "Create Account" }).click();

        await expect(page).toHaveURL(/\/awaiting-approval$/);
        await expect(page.getByRole("heading", { level: 1, name: "Awaiting Approval" })).toBeVisible();
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

        await page.goto("/clinician");
        await expect(page).toHaveURL(/\/awaiting-approval$/);
        await expect(page.getByRole("heading", { level: 1, name: "Awaiting Approval" })).toBeVisible();
    });
});
