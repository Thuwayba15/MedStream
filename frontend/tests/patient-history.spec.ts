import { expect, test } from "@playwright/test";

const roleClaimKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

function encodeBase64Url(value: string): string {
    return Buffer.from(value, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function createJwt(payload: Record<string, unknown>): string {
    return [encodeBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" })), encodeBase64Url(JSON.stringify(payload)), "signature"].join(".");
}

function createPatientToken(): string {
    return createJwt({
        [roleClaimKey]: "Patient",
        "medstream:approval_state": "approved",
        "medstream:requested_registration_role": "Patient",
    });
}

const persistedQueueVisit = {
    visitId: 101,
    facilityName: "Assigned Facility",
    selectedFacilityId: 11,
    startedAt: new Date().toISOString(),
    pathwayKey: "unassigned",
};

test.describe("patient history", () => {
    test("opens history from patient intake nav and shows patient-safe visit summaries", async ({ page, context }) => {
        await installPatientPageMocks(page);
        await page.route("**/api/patient/history", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    isClinicianView: false,
                    patient: {
                        patientUserId: 5101,
                        patientName: "Patient Two",
                        totalVisits: 2,
                        mostRecentVisitAt: new Date().toISOString(),
                    },
                    visits: [
                        {
                            visitId: 4101,
                            visitDate: "2025-10-14T09:15:00.000Z",
                            visitStatus: "completed",
                            facilityName: "Khayelitsha CHC",
                            title: "Consultation",
                            chiefComplaint: "Chest pain",
                            summary: "Seen for chest pain and shortness of breath. You were advised on warning signs and follow-up.",
                            summarySource: "encounter_note_patient_summary",
                        },
                        {
                            visitId: 3992,
                            visitDate: "2025-03-22T10:00:00.000Z",
                            visitStatus: "completed",
                            facilityName: "Tygerberg Hospital",
                            title: "Specialist Referral",
                            chiefComplaint: "Further imaging",
                            summary: "Referred for additional imaging and follow-up at specialist care.",
                            summarySource: "encounter_note_patient_summary",
                        },
                        {
                            visitId: 4999,
                            visitDate: "2025-11-02T08:00:00.000Z",
                            visitStatus: "IntakeInProgress",
                            facilityName: "Khayelitsha CHC",
                            title: "Visit",
                            chiefComplaint: "",
                            summary: "",
                            summarySource: "derived_fallback",
                        },
                    ],
                    timeline: [],
                    conditions: [],
                    allergies: [],
                    medications: [],
                }),
            });
        });

        await context.addCookies([{ name: "medstream_access_token", value: createPatientToken(), url: "http://localhost:3000" }]);

        await page.goto("/patient", { waitUntil: "domcontentloaded" });
        await expect(page.getByText("Step 1 of 5")).toBeVisible();

        await page.getByTestId("patient-nav-history").click();
        await expect(page).toHaveURL(/\/patient\/history$/);
        await expect(page.getByRole("heading", { name: "Visit History" })).toBeVisible();
        await expect(page.getByText("Khayelitsha CHC")).toBeVisible();
        await expect(page.getByText("Tygerberg Hospital")).toBeVisible();
        await expect(page.getByText("Seen for chest pain and shortness of breath. You were advised on warning signs and follow-up.")).toBeVisible();
        await expect(page.getByText("Referred for additional imaging and follow-up at specialist care.")).toBeVisible();
        await expect(page.getByText("Summary unavailable for this visit.")).toHaveCount(0);

        await page.getByTestId("patient-nav-new-visit").click();
        await expect(page).toHaveURL(/\/patient$/);
    });

    test("shows empty state in history and navigation remains usable on mobile", async ({ page, context }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await installPatientPageMocks(page);
        await page.route("**/api/patient/history", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    isClinicianView: false,
                    patient: {
                        patientUserId: 5101,
                        patientName: "Patient Two",
                        totalVisits: 0,
                        mostRecentVisitAt: null,
                    },
                    visits: [],
                    timeline: [],
                    conditions: [],
                    allergies: [],
                    medications: [],
                }),
            });
        });

        await context.addCookies([{ name: "medstream_access_token", value: createPatientToken(), url: "http://localhost:3000" }]);

        await page.goto("/patient/history", { waitUntil: "domcontentloaded" });
        await expect(page.getByText("No finalized visit summaries yet. Completed visits with patient summaries will appear here.")).toBeVisible();

        await page.getByTestId("patient-nav-new-visit").click();
        await expect(page).toHaveURL(/\/patient$/);
        await expect(page.getByText("Step 1 of 5")).toBeVisible();
    });

    test("keeps my queue available from history when a queue session is persisted", async ({ page, context }) => {
        await installPatientPageMocks(page);
        await page.route("**/api/patient/history", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    isClinicianView: false,
                    patient: {
                        patientUserId: 5101,
                        patientName: "Patient Two",
                        totalVisits: 0,
                        mostRecentVisitAt: null,
                    },
                    visits: [],
                    timeline: [],
                    conditions: [],
                    allergies: [],
                    medications: [],
                }),
            });
        });

        await page.route("**/api/patient-intake/queue-status?visitId=101", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    triage: {
                        urgencyLevel: "Priority",
                        explanation: "Priority triage based on symptom severity profile.",
                        redFlags: [],
                    },
                    queue: {
                        positionPending: true,
                        message: "You have been marked as priority. Queue position is being prepared.",
                        lastUpdatedAt: new Date().toISOString(),
                    },
                }),
            });
        });

        await context.addCookies([{ name: "medstream_access_token", value: createPatientToken(), url: "http://localhost:3000" }]);

        await page.addInitScript((queuedVisit) => {
            window.localStorage.setItem("medstream.patient.queue", JSON.stringify(queuedVisit));
        }, persistedQueueVisit);

        await page.goto("/patient/history", { waitUntil: "domcontentloaded" });
        await expect(page.getByTestId("patient-nav-my-queue")).toBeEnabled();
        await page.getByTestId("patient-nav-my-queue").click();
        await expect(page).toHaveURL(/\/patient$/);
        await expect(page.getByText("Step 5 of 5")).toBeVisible();
    });
});

async function installPatientPageMocks(page: import("@playwright/test").Page): Promise<void> {
    await page.route("**/api/auth/facilities/active", async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
                facilities: [
                    { id: 11, name: "Chris Hani Baragwanath Hospital" },
                    { id: 12, name: "Thembisa Hospital" },
                ],
            }),
        });
    });

    await page.route("**/api/patient-intake/check-in", async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
                visitId: 101,
                facilityName: "Assigned Facility",
                startedAt: new Date().toISOString(),
                pathwayKey: "unassigned",
            }),
        });
    });
}
