import { expect, test } from "@playwright/test";

const roleClaimKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

function encodeBase64Url(value: string): string {
    return Buffer.from(value, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function createJwt(payload: Record<string, unknown>): string {
    return [encodeBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" })), encodeBase64Url(JSON.stringify(payload)), "signature"].join(".");
}

function createClinicianToken(): string {
    return createJwt({
        [roleClaimKey]: "Clinician",
        "medstream:approval_state": "approved",
        "medstream:requested_registration_role": "Clinician",
    });
}

test.describe("clinician queue dashboard", () => {
    test("loads queue rows and applies urgency filter without polling", async ({ context, page }) => {
        const requestUrls: string[] = [];

        await page.route("**/api/clinician/queue**", async (route) => {
            requestUrls.push(route.request().url());
            const requestUrl = new URL(route.request().url());
            const urgency = requestUrl.searchParams.getAll("urgencyLevel");

            const allItems = [
                {
                    queueTicketId: 901,
                    visitId: 3001,
                    patientUserId: 2001,
                    patientName: "Thabo Molefe",
                    queueNumber: 1042,
                    queueStatus: "waiting",
                    currentStage: "Waiting",
                    urgencyLevel: "Urgent",
                    priorityScore: 95,
                    enteredQueueAt: new Date().toISOString(),
                    waitingMinutes: 12,
                    isActive: true,
                },
                {
                    queueTicketId: 902,
                    visitId: 3002,
                    patientUserId: 2002,
                    patientName: "Nomsa Dlamini",
                    queueNumber: 1038,
                    queueStatus: "waiting",
                    currentStage: "Waiting",
                    urgencyLevel: "Priority",
                    priorityScore: 71,
                    enteredQueueAt: new Date().toISOString(),
                    waitingMinutes: 45,
                    isActive: true,
                },
            ];

            const filteredItems = urgency.includes("Urgent") ? allItems.filter((item) => item.urgencyLevel === "Urgent") : allItems;

            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    totalCount: filteredItems.length,
                    items: filteredItems,
                }),
            });
        });

        await context.addCookies([{ name: "medstream_access_token", value: createClinicianToken(), url: "http://localhost:3000" }]);

        await page.goto("/clinician");

        await expect(page.getByRole("main").getByText("Queue Dashboard", { exact: true })).toBeVisible();
        await expect(page.getByText("Thabo Molefe")).toBeVisible();
        await expect(page.getByRole("button", { name: "Review" }).first()).toBeVisible();

        await page.getByTestId("queue-urgency-filter").getByText("Urgent", { exact: true }).click();
        await expect(page.getByText("Nomsa Dlamini")).toHaveCount(0);
        await expect(page.getByText("Thabo Molefe")).toBeVisible();

        await page.getByRole("button", { name: "Review" }).first().click();
        await expect(page.getByText("Triage Review", { exact: true })).toBeVisible();
        await expect(page.getByText("Queue ticket #901 selected.", { exact: false })).toBeVisible();

        const urgentRequests = requestUrls.filter((url) => url.includes("urgencyLevel=Urgent"));
        expect(urgentRequests.length).toBeGreaterThan(0);
    });
});
