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

test.describe("patient intake flow", () => {
    test("completes approved-json flow with urgent-check stage and status", async ({ page, context }) => {
        await installPatientIntakeMocks(page, { mode: "approved-json" });
        await context.addCookies([{ name: "medstream_access_token", value: createPatientToken(), url: "http://localhost:3000" }]);

        await page.goto("/patient");
        await expect(page.getByText("Step 1 of 5")).toBeVisible();
        await selectHospital(page);

        await page.getByRole("button", { name: "Continue" }).click();
        await expect(page.getByText("Step 2 of 5")).toBeVisible();
        await page.getByRole("radiogroup", { name: "Are you struggling to breathe right now?" }).getByLabel("No").check();
        await page.getByRole("radiogroup", { name: "Do you have severe chest pain right now?" }).getByLabel("No").check();
        await page.getByRole("radiogroup", { name: "Do you have heavy bleeding that is not stopping?" }).getByLabel("No").check();
        await page.getByRole("radiogroup", { name: "Did you faint, collapse, or lose consciousness today?" }).getByLabel("No").check();
        await page.getByRole("radiogroup", { name: "Are you currently confused, unusually sleepy, or difficult to wake?" }).getByLabel("No").check();
        await page.getByRole("button", { name: "Continue" }).click();

        await expect(page.getByText("Step 3 of 5")).toBeVisible();
        await page.getByPlaceholder("Describe your symptoms in your own words...").fill("I have cough and fever for four days.");
        await page.getByRole("button", { name: "Continue" }).click();

        await expect(page.getByText("Step 4 of 5")).toBeVisible();
        await page.getByRole("spinbutton", { name: "How many days have these symptoms been present?" }).fill("4");
        await page.getByRole("radiogroup", { name: "Have you had a fever?" }).getByLabel("Yes").check();
        await page.getByRole("button", { name: "Generate Status" }).click();

        await expect(page.getByText("Step 5 of 5")).toBeVisible();
        await expect(page.getByText("Queue Status", { exact: true })).toBeVisible();
        await expect(page.getByText("Priority score:")).toHaveCount(0);
    });

    test("urgent-check fast-tracks directly to status", async ({ page, context }) => {
        await installPatientIntakeMocks(page, { mode: "urgent-fast-track" });
        await context.addCookies([{ name: "medstream_access_token", value: createPatientToken(), url: "http://localhost:3000" }]);

        await page.goto("/patient");
        await selectHospital(page);
        await page.getByRole("button", { name: "Continue" }).click();
        await expect(page.getByText("Step 2 of 5")).toBeVisible();
        await page.getByRole("radiogroup", { name: "Are you struggling to breathe right now?" }).getByLabel("Yes").check();
        await page.getByRole("radiogroup", { name: "Do you have severe chest pain right now?" }).getByLabel("Yes").check();
        await page.getByRole("radiogroup", { name: "Do you have heavy bleeding that is not stopping?" }).getByLabel("No").check();
        await page.getByRole("radiogroup", { name: "Did you faint, collapse, or lose consciousness today?" }).getByLabel("No").check();
        await page.getByRole("radiogroup", { name: "Are you currently confused, unusually sleepy, or difficult to wake?" }).getByLabel("No").check();
        await page.getByRole("button", { name: "Continue" }).click();

        await expect(page.getByText("Step 5 of 5")).toBeVisible();
        await expect(page.getByText("Urgent", { exact: true })).toBeVisible();
    });

    test("fallback mode posts APC fallback flag and summary ids to questions endpoint", async ({ page, context }) => {
        let questionsPayload: Record<string, unknown> | null = null;
        await installPatientIntakeMocks(page, {
            mode: "apc-fallback",
            onQuestionsPayload: (payload) => {
                questionsPayload = payload;
            },
        });
        await context.addCookies([{ name: "medstream_access_token", value: createPatientToken(), url: "http://localhost:3000" }]);

        await page.goto("/patient");
        await selectHospital(page);
        await page.getByRole("button", { name: "Continue" }).click();
        await expect(page.getByText("Step 2 of 5")).toBeVisible();
        await page.getByRole("radiogroup", { name: "Are you struggling to breathe right now?" }).getByLabel("No").check();
        await page.getByRole("radiogroup", { name: "Do you have severe chest pain right now?" }).getByLabel("No").check();
        await page.getByRole("radiogroup", { name: "Do you have heavy bleeding that is not stopping?" }).getByLabel("No").check();
        await page.getByRole("radiogroup", { name: "Did you faint, collapse, or lose consciousness today?" }).getByLabel("No").check();
        await page.getByRole("radiogroup", { name: "Are you currently confused, unusually sleepy, or difficult to wake?" }).getByLabel("No").check();
        await page.getByRole("button", { name: "Continue" }).click();
        await expect(page.getByText("Step 3 of 5")).toBeVisible();
        await page.getByPlaceholder("Describe your symptoms in your own words...").fill("My symptoms are weird and unclear.");
        await page.getByRole("button", { name: "Continue" }).click();

        await expect(page.getByText("Step 4 of 5")).toBeVisible();
        expect(questionsPayload).toMatchObject({
            useApcFallback: true,
            fallbackSummaryIds: ["fever"],
        });
    });

    test("keeps continue actions visible on mobile through urgent-check stage", async ({ page, context }) => {
        await installPatientIntakeMocks(page, { mode: "approved-json" });
        await page.setViewportSize({ width: 390, height: 844 });
        await context.addCookies([{ name: "medstream_access_token", value: createPatientToken(), url: "http://localhost:3000" }]);

        await page.goto("/patient");
        await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();
        await selectHospital(page);
        await page.getByRole("button", { name: "Continue" }).click();
        await expect(page.getByText("Step 2 of 5")).toBeVisible();
        await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();
    });
});

type TMockMode = "approved-json" | "apc-fallback" | "urgent-fast-track";

async function selectHospital(page: import("@playwright/test").Page): Promise<void> {
    const hospitalSelect = page.getByRole("combobox", { name: "Hospital" }).first();
    await hospitalSelect.click();
    await hospitalSelect.fill("Chris Hani");
    await page.keyboard.press("Enter");
}

async function installPatientIntakeMocks(page: import("@playwright/test").Page, options: { mode: TMockMode; onQuestionsPayload?: (payload: Record<string, unknown>) => void }): Promise<void> {
    const { mode, onQuestionsPayload } = options;

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

    await page.route("**/api/patient-intake/symptoms", async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ capturedAt: new Date().toISOString() }),
        });
    });

    await page.route("**/api/patient-intake/extract", async (route) => {
        const isFallback = mode === "apc-fallback";
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
                extractedPrimarySymptoms: isFallback ? ["General Illness"] : ["Cough", "Fever"],
                extractionSource: "deterministic_fallback",
                likelyPathwayIds: isFallback ? ["general_unspecified_complaint"] : ["cough_or_difficulty_breathing"],
                selectedPathwayKey: isFallback ? "general_unspecified_complaint" : "cough_or_difficulty_breathing",
                intakeMode: isFallback ? "apc_fallback" : "approved_json",
                fallbackSectionIds: isFallback ? ["fever"] : [],
                fallbackSummaryIds: isFallback ? ["fever"] : [],
                mappedInputValues: {},
            }),
        });
    });

    await page.route("**/api/patient-intake/urgent-check", async (route) => {
        const body = JSON.parse(route.request().postData() || "{}") as { answers?: Record<string, unknown> };
        const urgentTriggered = mode === "urgent-fast-track" && Boolean(body.answers?.urgentSevereBreathing);
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
                questionSet: [
                    { questionKey: "urgentSevereBreathing", questionText: "Are you struggling to breathe right now?", inputType: "Boolean", displayOrder: 1, isRequired: true, answerOptions: [] },
                    { questionKey: "urgentSevereChestPain", questionText: "Do you have severe chest pain right now?", inputType: "Boolean", displayOrder: 2, isRequired: true, answerOptions: [] },
                    {
                        questionKey: "urgentUncontrolledBleeding",
                        questionText: "Do you have heavy bleeding that is not stopping?",
                        inputType: "Boolean",
                        displayOrder: 3,
                        isRequired: true,
                        answerOptions: [],
                    },
                    {
                        questionKey: "urgentCollapse",
                        questionText: "Did you faint, collapse, or lose consciousness today?",
                        inputType: "Boolean",
                        displayOrder: 4,
                        isRequired: true,
                        answerOptions: [],
                    },
                    {
                        questionKey: "urgentConfusion",
                        questionText: "Are you currently confused, unusually sleepy, or difficult to wake?",
                        inputType: "Boolean",
                        displayOrder: 5,
                        isRequired: true,
                        answerOptions: [],
                    },
                ],
                isUrgent: urgentTriggered,
                shouldFastTrack: urgentTriggered,
                triggerReasons: urgentTriggered ? ["global_urgent_check_positive"] : [],
                intakeMode: mode === "apc-fallback" ? "apc_fallback" : "approved_json",
                fallbackSummaryIds: mode === "apc-fallback" ? ["fever"] : [],
                message: urgentTriggered ? "Urgent signs detected. We are fast-tracking your intake." : "Urgent check completed. Continue to follow-up questions.",
            }),
        });
    });

    await page.route("**/api/patient-intake/questions", async (route) => {
        const payload = JSON.parse(route.request().postData() || "{}") as Record<string, unknown>;
        onQuestionsPayload?.(payload);

        if (mode === "apc-fallback") {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    questionSet: [
                        {
                            questionKey: "subjective_main_concern",
                            questionText: "Please describe your main concern in one sentence.",
                            inputType: "Text",
                            displayOrder: 1,
                            isRequired: true,
                            answerOptions: [],
                            showWhenExpression: null,
                        },
                    ],
                }),
            });
            return;
        }

        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
                questionSet: [
                    {
                        questionKey: "durationDays",
                        questionText: "How many days have these symptoms been present?",
                        inputType: "Number",
                        displayOrder: 1,
                        isRequired: true,
                        answerOptions: [],
                        showWhenExpression: null,
                    },
                    {
                        questionKey: "hasFever",
                        questionText: "Have you had a fever?",
                        inputType: "Boolean",
                        displayOrder: 2,
                        isRequired: true,
                        answerOptions: [],
                        showWhenExpression: null,
                    },
                ],
            }),
        });
    });

    await page.route("**/api/patient-intake/triage", async (route) => {
        const urgent = mode === "urgent-fast-track";
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
                triage: {
                    urgencyLevel: urgent ? "Urgent" : "Priority",
                    priorityScore: urgent ? 88 : 62,
                    explanation: urgent ? "Urgent triage based on danger signs." : "Priority triage based on symptom severity profile.",
                    redFlags: urgent ? ["urgent_global_red_flag"] : [],
                },
                queue: {
                    positionPending: true,
                    message: urgent
                        ? "You have been flagged for immediate clinical attention. Queue position will be assigned shortly."
                        : "You have been marked as priority. Queue position is being prepared.",
                    lastUpdatedAt: new Date().toISOString(),
                },
            }),
        });
    });
}
