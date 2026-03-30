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
    test("loads queue rows, opens review, and transitions status", async ({ context, page }) => {
        const requestUrls: string[] = [];
        let queueStatus: "waiting" | "called" | "in_consultation" = "waiting";

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

        await page.route("**/api/clinician/queue/901", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    queueTicketId: 901,
                    visitId: 3001,
                    patientUserId: 2001,
                    patientName: "Thabo Molefe",
                    queueNumber: 1042,
                    queueStatus,
                    currentStage: queueStatus === "waiting" ? "Waiting" : queueStatus === "called" ? "Called" : "In Consultation",
                    waitingMinutes: 12,
                    enteredQueueAt: new Date().toISOString(),
                    urgencyLevel: "Urgent",
                    priorityScore: 95,
                    triageExplanation: "Urgent chest pain with shortness of breath and elevated risk score.",
                    redFlags: ["Chest pain + shortness of breath", "Heart rate > 100 bpm"],
                    reasoning: ["Urgent chest pain with shortness of breath and elevated risk score.", "Severe chest pain reported", "Severe difficulty breathing reported"],
                    chiefComplaint: "Severe chest pain, shortness of breath",
                    selectedSymptoms: ["Chest pain", "Shortness of breath"],
                    extractedPrimarySymptoms: ["Chest pain", "Shortness of breath"],
                    subjectiveSummary: "Patient reports severe crushing chest pain that started two hours ago.",
                    clinicianSummary: "Primary concern is severe chest pain with shortness of breath. Urgent safety features were reported and the case requires immediate clinician review.",
                    consultationPath: "/clinician/consultation?visitId=3001&queueTicketId=901",
                    patientHistoryPath: "/clinician/history?patientUserId=2001&visitId=3001",
                }),
            });
        });

        await page.route("**/api/clinician/queue/901/status", async (route) => {
            const body = route.request().postDataJSON() as { newStatus: "called" | "in_consultation" };
            queueStatus = body.newStatus;
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    queueTicketId: 901,
                    oldStatus: "waiting",
                    newStatus: body.newStatus,
                    currentStage: body.newStatus === "called" ? "Called" : "In Consultation",
                    changedAt: new Date().toISOString(),
                    visitId: 3001,
                    patientUserId: 2001,
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
        await expect(page.getByText("Thabo Molefe", { exact: true })).toBeVisible();
        await expect(page.getByRole("button", { name: "Start Consultation" })).toBeVisible();

        await page.getByRole("button", { name: "Start Consultation" }).click();
        await expect(page).toHaveURL(/\/clinician\/consultation\?visitId=3001&queueTicketId=901/);

        const urgentRequests = requestUrls.filter((url) => url.includes("urgencyLevel=Urgent"));
        expect(urgentRequests.length).toBeGreaterThan(0);
    });
});
