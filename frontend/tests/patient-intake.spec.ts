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
        await expect(page.getByTestId("patient-nav-my-queue")).toBeDisabled();
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
        await expect(page.getByText("Follow-up page 1 of 2")).toBeVisible();
        await page.getByRole("spinbutton", { name: "How many days have these symptoms been present?" }).fill("4");
        await page.getByRole("radiogroup", { name: "Have you had a fever?" }).getByLabel("Yes").check();
        await page.getByRole("button", { name: "Continue" }).click();

        await expect(page.getByText("Fever details")).toBeVisible();
        await expect(page.getByText("Follow-up page 2 of 2")).toBeVisible();
        await page.getByLabel("Please describe your main concern in one sentence.").fill("Fever and cough for four days.");
        await page.getByRole("button", { name: "Generate Status" }).click();

        await expect(page.getByText("Step 5 of 5")).toBeVisible();
        await expect(page.getByTestId("patient-nav-my-queue")).toBeEnabled();
        await expect(page.getByText("Queue", { exact: true })).toBeVisible();
        await expect(page.getByText("Last updated: 14:00")).toBeVisible();
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
        await expect(page.getByRole("heading", { name: "Urgent" })).toBeVisible();
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

    test("keeps the describe symptoms step usable on mobile", async ({ page, context }) => {
        await installPatientIntakeMocks(page, { mode: "approved-json" });
        await page.setViewportSize({ width: 390, height: 844 });
        await context.addCookies([{ name: "medstream_access_token", value: createPatientToken(), url: "http://localhost:3000" }]);

        await page.goto("/patient");
        await selectHospital(page);
        await page.getByRole("button", { name: "Continue" }).click();
        await page.getByRole("radiogroup", { name: "Are you struggling to breathe right now?" }).getByLabel("No").check();
        await page.getByRole("radiogroup", { name: "Do you have severe chest pain right now?" }).getByLabel("No").check();
        await page.getByRole("radiogroup", { name: "Do you have heavy bleeding that is not stopping?" }).getByLabel("No").check();
        await page.getByRole("radiogroup", { name: "Did you faint, collapse, or lose consciousness today?" }).getByLabel("No").check();
        await page.getByRole("radiogroup", { name: "Are you currently confused, unusually sleepy, or difficult to wake?" }).getByLabel("No").check();
        await page.getByRole("button", { name: "Continue" }).click();

        await expect(page.getByText("Step 3 of 5")).toBeVisible();
        await expect(page.getByText("Tell us what is going on in your own words")).toBeVisible();
        await expect(page.getByRole("button", { name: "Tap to speak your symptoms" })).toBeVisible();
        await expect(page.getByPlaceholder("Describe your symptoms in your own words...")).toBeVisible();
        await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();
    });

    test("walks through multiple follow-up pages for multiple extracted symptoms", async ({ page, context }) => {
        let triagePayload: Record<string, unknown> | null = null;
        await installPatientIntakeMocks(page, {
            mode: "multi-pathway",
            onTriagePayload: (payload) => {
                triagePayload = payload;
            },
        });
        await context.addCookies([{ name: "medstream_access_token", value: createPatientToken(), url: "http://localhost:3000" }]);

        await page.goto("/patient");
        await selectHospital(page);
        await page.getByRole("button", { name: "Continue" }).click();
        await page.getByRole("radiogroup", { name: "Are you struggling to breathe right now?" }).getByLabel("No").check();
        await page.getByRole("radiogroup", { name: "Do you have severe chest pain right now?" }).getByLabel("No").check();
        await page.getByRole("radiogroup", { name: "Do you have heavy bleeding that is not stopping?" }).getByLabel("No").check();
        await page.getByRole("radiogroup", { name: "Did you faint, collapse, or lose consciousness today?" }).getByLabel("No").check();
        await page.getByRole("radiogroup", { name: "Are you currently confused, unusually sleepy, or difficult to wake?" }).getByLabel("No").check();
        await page.getByRole("button", { name: "Continue" }).click();

        await page.getByPlaceholder("Describe your symptoms in your own words...").fill("I have an injury and a headache.");
        await page.getByRole("button", { name: "Continue" }).click();

        await expect(page.getByText("Hand or Upper Limb Injury")).toBeVisible();
        await expect(page.getByText("Follow-up page 1 of 2")).toBeVisible();
        await page.getByRole("radiogroup", { name: "Did this start after a fall or direct injury?" }).getByLabel("No").check();
        await page.getByRole("radiogroup", { name: "Do you see any deformity or severe swelling?" }).getByLabel("No").check();
        await page.getByLabel("Can you move your fingers normally?").click();
        await page.getByTitle("Yes").click();
        await page.getByRole("button", { name: "Continue" }).click();

        await expect(page.getByText("Headache details")).toBeVisible();
        await expect(page.getByText("Follow-up page 2 of 2")).toBeVisible();
        await page.getByLabel("Please describe your main concern in one sentence.").fill("Headache after injury.");
        await page.getByRole("button", { name: "Generate Status" }).click();

        await expect(page.getByText("Step 5 of 5")).toBeVisible();
        expect(triagePayload).toMatchObject({
            followUpPlans: [
                { pathwayKey: "hand_or_upper_limb_injury", intakeMode: "approved_json" },
                { pathwayKey: "general_unspecified_complaint", intakeMode: "apc_fallback" },
            ],
        });
        const followUpQuestions = (triagePayload as { followUpQuestions?: Array<Record<string, unknown>> } | null)?.followUpQuestions ?? [];
        expect(followUpQuestions.length).toBeGreaterThanOrEqual(4);
    });
});

type TMockMode = "approved-json" | "apc-fallback" | "urgent-fast-track" | "multi-pathway";

async function selectHospital(page: import("@playwright/test").Page): Promise<void> {
    await page.getByTestId("patient-hospital-select").click();
    await page.getByTitle("Chris Hani Baragwanath Hospital").click();
}

async function installPatientIntakeMocks(
    page: import("@playwright/test").Page,
    options: {
        mode: TMockMode;
        onQuestionsPayload?: (payload: Record<string, unknown>) => void;
        onTriagePayload?: (payload: Record<string, unknown>) => void;
    }
): Promise<void> {
    const { mode, onQuestionsPayload, onTriagePayload } = options;
    let checkInCounter = 0;

    await page.route("**/api/patient-intake/check-in", async (route) => {
        const payload = JSON.parse(route.request().postData() || "{}") as { selectedFacilityId?: number };
        checkInCounter += 1;
        expect(payload.selectedFacilityId).toBe(11);
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
                visitId: 100 + checkInCounter,
                facilityId: 11,
                facilityName: "Chris Hani Baragwanath Hospital",
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
        const isMultiPathway = mode === "multi-pathway";
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
                extractedPrimarySymptoms: isFallback ? ["General Illness"] : isMultiPathway ? ["Injury", "Headache"] : ["Cough", "Fever"],
                extractionSource: "deterministic_fallback",
                likelyPathwayIds: isFallback ? ["general_unspecified_complaint"] : isMultiPathway ? ["hand_or_upper_limb_injury"] : ["cough_or_difficulty_breathing"],
                selectedPathwayKey: isFallback ? "general_unspecified_complaint" : isMultiPathway ? "hand_or_upper_limb_injury" : "cough_or_difficulty_breathing",
                intakeMode: isFallback ? "apc_fallback" : "approved_json",
                fallbackSectionIds: isFallback ? ["fever"] : [],
                fallbackSummaryIds: isFallback ? ["fever"] : [],
                mappedInputValues: {},
                followUpPlans: isFallback
                    ? [
                          {
                              planKey: "apc_fallback_primary",
                              title: "Tell us more about your symptoms",
                              pathwayKey: "general_unspecified_complaint",
                              primarySymptom: "General Illness",
                              intakeMode: "apc_fallback",
                              fallbackSummaryIds: ["fever"],
                          },
                      ]
                    : isMultiPathway
                      ? [
                            {
                                planKey: "hand_or_upper_limb_injury",
                                title: "Hand or Upper Limb Injury",
                                pathwayKey: "hand_or_upper_limb_injury",
                                primarySymptom: "Injury",
                                intakeMode: "approved_json",
                                fallbackSummaryIds: [],
                            },
                            {
                                planKey: "apc_headache",
                                title: "Headache details",
                                pathwayKey: "general_unspecified_complaint",
                                primarySymptom: "Headache",
                                intakeMode: "apc_fallback",
                                fallbackSummaryIds: ["headache"],
                            },
                        ]
                      : [
                            {
                                planKey: "cough_or_difficulty_breathing",
                                title: "Cough or Difficulty Breathing",
                                pathwayKey: "cough_or_difficulty_breathing",
                                primarySymptom: "Cough",
                                intakeMode: "approved_json",
                                fallbackSummaryIds: [],
                            },
                            {
                                planKey: "apc_fever",
                                title: "Fever details",
                                pathwayKey: "general_unspecified_complaint",
                                primarySymptom: "Fever",
                                intakeMode: "apc_fallback",
                                fallbackSummaryIds: ["fever"],
                            },
                        ],
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

        if (mode === "apc-fallback" || payload.useApcFallback === true) {
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

        if (payload.pathwayKey === "hand_or_upper_limb_injury") {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    questionSet: [
                        {
                            questionKey: "injuryFromFall",
                            questionText: "Did this start after a fall or direct injury?",
                            inputType: "Boolean",
                            displayOrder: 1,
                            isRequired: true,
                            answerOptions: [],
                            showWhenExpression: null,
                        },
                        {
                            questionKey: "visibleDeformity",
                            questionText: "Do you see any deformity or severe swelling?",
                            inputType: "Boolean",
                            displayOrder: 2,
                            isRequired: true,
                            answerOptions: [],
                            showWhenExpression: null,
                        },
                        {
                            questionKey: "cannotMoveFingers",
                            questionText: "Can you move your fingers normally?",
                            inputType: "SingleSelect",
                            displayOrder: 3,
                            isRequired: true,
                            answerOptions: [
                                { value: "yes", label: "Yes" },
                                { value: "limited", label: "Limited movement" },
                                { value: "no", label: "No" },
                            ],
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
        const payload = JSON.parse(route.request().postData() || "{}") as Record<string, unknown>;
        onTriagePayload?.(payload);
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
                    lastUpdatedAt: "2026-04-02T12:00:00.000Z",
                },
            }),
        });
    });
}
