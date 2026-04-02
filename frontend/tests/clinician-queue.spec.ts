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
        let transcriptAttached = false;
        const savedEncounterNoteDraftBodies: Array<{
            subjective?: string;
            objective?: string;
            assessment?: string;
            plan?: string;
            clinicianTimelineSummary?: string;
            patientTimelineSummary?: string;
        }> = [];
        let assessmentPlanDraftRequestCount = 0;
        let encounterNoteState = {
            id: 77,
            visitId: 3001,
            intakeSubjective: "Initial intake notes already captured chest pain and shortness of breath.",
            subjective: "Patient reports severe crushing chest pain that started two hours ago and now includes nausea.",
            objective: "Alert, speaking in full sentences, clutching chest intermittently.",
            assessment: "",
            plan: "",
            clinicianTimelineSummary: "",
            patientTimelineSummary: "",
            status: "draft",
            finalizedAt: null as string | null,
        };

        await page.addInitScript(() => {
            class MockMediaRecorder {
                public static isTypeSupported(): boolean {
                    return true;
                }

                public mimeType: string;

                public state: "inactive" | "recording" = "inactive";

                public ondataavailable: ((event: BlobEvent) => void) | null = null;

                public onstop: (() => void) | null = null;

                public onerror: (() => void) | null = null;

                public stream: MediaStream;

                public constructor(stream: MediaStream, options?: MediaRecorderOptions) {
                    this.stream = stream;
                    this.mimeType = options?.mimeType || "audio/webm";
                }

                public start(): void {
                    this.state = "recording";
                    window.setTimeout(() => {
                        this.ondataavailable?.({ data: new Blob(["mock consultation audio"], { type: this.mimeType }) } as BlobEvent);
                    }, 0);
                }

                public stop(): void {
                    this.state = "inactive";
                    this.onstop?.();
                }
            }

            Object.defineProperty(window, "MediaRecorder", {
                writable: true,
                value: MockMediaRecorder,
            });

            Object.defineProperty(navigator, "mediaDevices", {
                writable: true,
                value: {
                    getUserMedia: async () => ({
                        getTracks: () => [{ stop: () => undefined }],
                    }),
                },
            });
        });

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
                    summary: {
                        waitingCount: allItems.filter((item) => item.queueStatus === "waiting").length,
                        averageWaitingMinutes: 29,
                        urgentCount: allItems.filter((item) => item.urgencyLevel === "Urgent").length,
                        seenTodayCount: 4,
                        calledCount: 0,
                        inConsultationCount: 0,
                    },
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

        await page.route("**/api/clinician/consultation?**", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    visitId: 3001,
                    queueTicketId: 901,
                    visitStatus: "InConsultation",
                    patientContext: {
                        patientUserId: 2001,
                        patientName: "Thabo Molefe",
                        chiefComplaint: "Severe chest pain, shortness of breath",
                        subjectiveSummary: "Patient reports severe crushing chest pain that started two hours ago and has worsened with movement.",
                        urgencyLevel: "Urgent",
                        queueStatus: "in_consultation",
                        visitDate: new Date().toISOString(),
                    },
                    encounterNote: {
                        ...encounterNoteState,
                    },
                    latestVitals: {
                        id: 61,
                        visitId: 3001,
                        phase: "consultation",
                        bloodPressureSystolic: 150,
                        bloodPressureDiastolic: 95,
                        heartRate: 110,
                        respiratoryRate: 24,
                        temperatureCelsius: 37.2,
                        oxygenSaturation: 94,
                        bloodGlucose: null,
                        weightKg: null,
                        isLatest: true,
                        recordedAt: new Date().toISOString(),
                    },
                    transcripts: transcriptAttached
                        ? [
                              {
                                  id: 71,
                                  encounterNoteId: 77,
                                  inputMode: "audio_upload",
                                  rawTranscriptText: "Patient reports chest pain easing after rest and ongoing nausea.",
                                  translatedTranscriptText: null,
                                  languageDetected: "en",
                                  capturedAt: new Date().toISOString(),
                              },
                          ]
                        : [],
                }),
            });
        });

        await page.route("**/api/clinician/consultation/transcript", async (route) => {
            transcriptAttached = true;
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    id: 71,
                    encounterNoteId: 77,
                    inputMode: "audio_upload",
                    rawTranscriptText: "Patient reports chest pain easing after rest and ongoing nausea.",
                    translatedTranscriptText: null,
                    languageDetected: "en",
                    capturedAt: new Date().toISOString(),
                }),
            });
        });

        await page.route("**/api/clinician/consultation/note", async (route) => {
            const body = route.request().postDataJSON() as {
                subjective?: string;
                objective?: string;
                assessment?: string;
                plan?: string;
                clinicianTimelineSummary?: string;
                patientTimelineSummary?: string;
            };

            savedEncounterNoteDraftBodies.push(body);

            encounterNoteState = {
                ...encounterNoteState,
                subjective: body.subjective ?? encounterNoteState.subjective,
                objective: body.objective ?? encounterNoteState.objective,
                assessment: body.assessment ?? encounterNoteState.assessment,
                plan: body.plan ?? encounterNoteState.plan,
                clinicianTimelineSummary: body.clinicianTimelineSummary ?? encounterNoteState.clinicianTimelineSummary,
                patientTimelineSummary: body.patientTimelineSummary ?? encounterNoteState.patientTimelineSummary,
            };

            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(encounterNoteState),
            });
        });

        await page.route("**/api/clinician/consultation/drafts/assessment-plan", async (route) => {
            assessmentPlanDraftRequestCount += 1;
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    visitId: 3001,
                    encounterNoteId: 77,
                    source: "openai",
                    generatedAt: new Date().toISOString(),
                    assessment: "Concerning for acute coronary syndrome pending clinician confirmation.",
                    plan: "Continue urgent cardiac monitoring, obtain ECG, and reassess pain response.",
                    summary: "Assessment and plan draft generated from the latest subjective, objective findings, vitals, and transcript.",
                }),
            });
        });

        await page.route("**/api/clinician/consultation/finalize", async (route) => {
            const body = route.request().postDataJSON() as {
                clinicianTimelineSummary: string;
                patientTimelineSummary: string;
            };

            encounterNoteState = {
                ...encounterNoteState,
                clinicianTimelineSummary: body.clinicianTimelineSummary,
                patientTimelineSummary: body.patientTimelineSummary,
                status: "finalized",
                finalizedAt: new Date().toISOString(),
            };

            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(encounterNoteState),
            });
        });

        await page.route("**/api/clinician/history**", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    isClinicianView: true,
                    patient: {
                        patientUserId: 2001,
                        patientName: "Thabo Molefe",
                        dateOfBirth: "1981-05-11T00:00:00.000Z",
                        idNumber: "8105115800088",
                        totalVisits: 3,
                        mostRecentVisitAt: new Date().toISOString(),
                    },
                    visits: [
                        {
                            visitId: 3001,
                            visitDate: new Date().toISOString(),
                            visitStatus: "completed",
                            facilityId: 4,
                            facilityName: "Khayelitsha CHC",
                            title: "General Consultation",
                            chiefComplaint: "Severe chest pain, shortness of breath",
                            summary: "Primary concern is severe chest pain with shortness of breath.",
                            summarySource: "encounter_note_clinician_summary",
                            urgencyLevel: "Urgent",
                            queueStatus: "completed",
                            clinicianName: "Dr. Naledi Mokoena",
                            finalizedAt: new Date().toISOString(),
                        },
                    ],
                    timeline: [
                        {
                            eventId: "encounter-3001",
                            visitId: 3001,
                            eventType: "consultation",
                            title: "General Consultation",
                            summary: "Primary concern is severe chest pain with shortness of breath.",
                            occurredAt: new Date().toISOString(),
                            facilityId: 4,
                            facilityName: "Khayelitsha CHC",
                            status: "completed",
                            recordedByName: "Dr. Naledi Mokoena",
                            provenance: "encounter_note",
                            urgencyLevel: "Urgent",
                        },
                    ],
                    conditions: [],
                    allergies: [],
                    medications: [],
                }),
            });
        });

        await context.addCookies([{ name: "medstream_access_token", value: createClinicianToken(), url: "http://localhost:3000" }]);

        await page.goto("/clinician", { waitUntil: "domcontentloaded" });
        await page.waitForResponse((response) => response.url().includes("/api/clinician/queue") && response.status() === 200);

        await expect(page.getByText("Patients Waiting")).toBeVisible();
        await expect(page.getByText("In Consultation")).toBeVisible();
        await expect(page.getByText("Showing 2 patients")).toBeVisible();
        await expect(page.getByText("Thabo Molefe")).toBeVisible();
        await expect(page.getByRole("button", { name: "Review" }).first()).toBeVisible();
        await expect(page.getByText("Queue stage: Waiting").first()).toBeVisible();

        await page.getByTestId("queue-urgency-filter").getByText("Urgent", { exact: true }).click();
        await expect(page.getByText("Nomsa Dlamini")).toHaveCount(0);
        await expect(page.getByText("Thabo Molefe")).toBeVisible();

        await page.getByRole("button", { name: "Review" }).first().click();
        await expect(page).toHaveURL(/\/clinician\/review\/901\?patientUserId=2001&visitId=3001$/);
        await expect(page.getByRole("heading", { name: "Triage Review" })).toBeVisible();
        await expect(page.getByText("Thabo Molefe", { exact: true })).toBeVisible();
        await expect(page.getByRole("button", { name: "Start Consultation" })).toBeVisible();

        await Promise.all([
            page.waitForResponse((response) => response.url().includes("/api/clinician/queue/901/status") && response.status() === 200),
            page.getByRole("button", { name: "Start Consultation" }).click(),
        ]);
        await page.goto("/clinician/consultation?visitId=3001&queueTicketId=901", { waitUntil: "domcontentloaded" });
        await expect(page).toHaveURL(/\/clinician\/consultation\?visitId=3001&queueTicketId=901/);
        await expect(page.getByRole("heading", { name: "Consultation: Thabo Molefe" })).toBeVisible();
        await expect(page.getByText("AI handoff summary")).toBeVisible();
        await expect(page.getByRole("tab", { name: "objective" })).toBeVisible();
        await page.getByTestId("consultation-start-recording").click();
        await expect(page.getByTestId("consultation-stop-recording")).toBeEnabled();
        await page.getByTestId("consultation-stop-recording").click();
        await expect(page.getByRole("heading", { name: "Review recorded transcript" })).toBeVisible();
        await page.getByTestId("consultation-transcript-preview").fill("Patient reports chest pain easing after rest and ongoing nausea.");
        await page.getByRole("button", { name: "Confirm transcript" }).click();
        await expect(page.getByRole("heading", { name: "Review recorded transcript" })).toHaveCount(0);
        await expect(page.getByText("Transcript attached", { exact: true })).toBeVisible();
        await page.getByRole("tab", { name: "objective" }).click();
        await expect(page.getByText("Blood pressure")).toBeVisible();
        await page.getByPlaceholder("Document examination findings, focused observations, and any additional objective notes.").fill(
            "Chest wall tenderness absent. Patient diaphoretic and anxious on examination."
        );
        await page.getByRole("tab", { name: "assessment" }).click();
        await page.getByRole("button", { name: "Generate A/P Draft" }).click();
        await expect(page.getByText("Assessment and plan draft generated for review.")).toBeVisible();
        expect(assessmentPlanDraftRequestCount).toBe(1);
        expect(savedEncounterNoteDraftBodies.some((body) => body.objective?.includes("Patient diaphoretic and anxious on examination."))).toBeTruthy();
        await page.getByRole("tab", { name: "Timeline Summary" }).click();
        await expect(page.getByText("Ready to finalize")).toBeVisible();
        await expect(page.getByTestId("consultation-clinician-timeline-summary")).toHaveValue(
            "Primary concern is severe chest pain with shortness of breath. Urgent safety features were reported and the case requires immediate clinician review."
        );
        await expect(page.getByTestId("consultation-patient-timeline-summary")).toHaveValue("Severe chest pain, shortness of breath.");
        await page.getByTestId("consultation-clinician-timeline-summary").fill("");
        await page.getByTestId("consultation-patient-timeline-summary").fill("");
        await page.getByTestId("consultation-finalize-note").click();
        await expect(page.getByText(/Add the clinician-facing summary and patient-friendly summary/i)).toBeVisible();
        await expect(page.getByText("Required before finalizing")).toBeVisible();
        await page.getByTestId("consultation-clinician-timeline-summary").fill("Presented with severe chest pain and tachycardia. ECG review initiated and urgent observation continued.");
        await page.getByTestId("consultation-patient-timeline-summary").fill("Seen for chest pain and shortness of breath. You were assessed urgently and advised on warning signs and next steps.");
        await page.getByTestId("consultation-save-draft").click();
        await expect(page.getByText("Draft saved.")).toBeVisible();
        await expect(page.getByTestId("consultation-clinician-timeline-summary")).toHaveValue(
            "Presented with severe chest pain and tachycardia. ECG review initiated and urgent observation continued."
        );
        await page.getByTestId("consultation-finalize-note").click();
        await expect(page.getByText("SOAP note finalized.")).toBeVisible();
        await expect(page.getByText("Finalized", { exact: true })).toBeVisible();

        await page.getByRole("tab", { name: "Patient Timeline" }).click();
        await expect(page).toHaveURL(/\/clinician\/history/);
        await expect(page.getByRole("heading", { name: "Thabo Molefe" })).toBeVisible();
        await expect(page.getByText("Visit History")).toBeVisible();
        await expect(page.getByText("Primary concern is severe chest pain with shortness of breath.")).toBeVisible();

        await page.getByRole("tab", { name: "Consultation" }).click();
        await expect(page).toHaveURL(/\/clinician\/consultation/);
        await expect(page.getByRole("heading", { name: "Consultation: Thabo Molefe" })).toBeVisible();

        const urgentRequests = requestUrls.filter((url) => url.includes("urgencyLevel=Urgent"));
        expect(urgentRequests.length).toBeGreaterThan(0);
    });

    test("shows consultation inbox when no active visit is selected", async ({ context, page }) => {
        await page.route("**/api/clinician/consultation", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    items: [
                        {
                            visitId: 4101,
                            queueTicketId: 991,
                            patientUserId: 5101,
                            patientName: "Patient Two",
                            chiefComplaint: "Cough and fever",
                            subjectiveSummary: "Chief complaint: I have cough and fever\nSymptoms reported: Cough, Fever\nKey details:\nHave you had a fever?: True",
                            queueStatus: "in_consultation",
                            urgencyLevel: "Priority",
                            encounterNoteStatus: "draft",
                            visitDate: new Date().toISOString(),
                            finalizedAt: null,
                            lastTranscriptAt: new Date().toISOString(),
                            consultationPath: "/clinician/consultation?visitId=4101&queueTicketId=991",
                        },
                    ],
                }),
            });
        });

        await context.addCookies([{ name: "medstream_access_token", value: createClinicianToken(), url: "http://localhost:3000" }]);

        await page.goto("/clinician/consultation", { waitUntil: "domcontentloaded" });

        await expect(page.getByRole("heading", { name: /today's consultations/i })).toBeVisible();
        await expect(page.getByText("Patient Two")).toBeVisible();
        await expect(page.getByText("Symptoms reported: Cough, Fever")).toBeVisible();
        await expect(page.getByText("Have you had a fever?", { exact: false })).toBeVisible();
        await expect(page.getByRole("button", { name: "Resume Draft" })).toBeVisible();
    });

    test("keeps the clinician queue, workflow, and timeline usable on mobile", async ({ context, page }) => {
        await page.setViewportSize({ width: 390, height: 844 });

        await page.route("**/api/clinician/queue**", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    totalCount: 1,
                    items: [
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
                            enteredQueueAt: "2026-04-02T08:00:00.000Z",
                            waitingMinutes: 12,
                            isActive: true,
                        },
                    ],
                    summary: {
                        waitingCount: 1,
                        averageWaitingMinutes: 12,
                        urgentCount: 1,
                        seenTodayCount: 2,
                        calledCount: 0,
                        inConsultationCount: 0,
                    },
                }),
            });
        });

        await page.route("**/api/clinician/consultation?**", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    visitId: 3001,
                    queueTicketId: 901,
                    visitStatus: "InConsultation",
                    patientContext: {
                        patientUserId: 2001,
                        patientName: "Thabo Molefe",
                        chiefComplaint: "Severe chest pain, shortness of breath",
                        subjectiveSummary: "Patient reports severe crushing chest pain that started two hours ago and has worsened with movement.",
                        urgencyLevel: "Urgent",
                        queueStatus: "in_consultation",
                        visitDate: "2026-04-02T08:00:00.000Z",
                    },
                    encounterNote: {
                        id: 77,
                        visitId: 3001,
                        intakeSubjective: "Initial intake notes already captured chest pain and shortness of breath.",
                        subjective: "Patient reports severe crushing chest pain that started two hours ago and now includes nausea.",
                        objective: "Alert, speaking in full sentences, clutching chest intermittently.",
                        assessment: "Concerning for acute coronary syndrome pending clinician confirmation.",
                        plan: "Continue urgent cardiac monitoring, obtain ECG, and reassess pain response.",
                        clinicianTimelineSummary: "Presented with severe chest pain and tachycardia. ECG review initiated and urgent observation continued.",
                        patientTimelineSummary: "Seen for chest pain and shortness of breath. You were assessed urgently and advised on warning signs and next steps.",
                        status: "draft",
                        finalizedAt: null,
                    },
                    latestVitals: {
                        id: 61,
                        visitId: 3001,
                        phase: "consultation",
                        bloodPressureSystolic: 150,
                        bloodPressureDiastolic: 95,
                        heartRate: 110,
                        respiratoryRate: 24,
                        temperatureCelsius: 37.2,
                        oxygenSaturation: 94,
                        bloodGlucose: null,
                        weightKg: null,
                        isLatest: true,
                        recordedAt: "2026-04-02T08:15:00.000Z",
                    },
                    transcripts: [],
                }),
            });
        });

        await page.route("**/api/clinician/history**", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    isClinicianView: true,
                    patient: {
                        patientUserId: 2001,
                        patientName: "Thabo Molefe",
                        dateOfBirth: "1981-05-11T00:00:00.000Z",
                        idNumber: "8105115800088",
                        totalVisits: 3,
                        mostRecentVisitAt: "2026-04-02T08:00:00.000Z",
                    },
                    visits: [
                        {
                            visitId: 3001,
                            visitDate: "2026-04-02T08:00:00.000Z",
                            visitStatus: "completed",
                            facilityId: 4,
                            facilityName: "Khayelitsha CHC",
                            title: "Consultation",
                            chiefComplaint: "Severe chest pain, shortness of breath",
                            summary: "Presented with severe chest pain and tachycardia. ECG review initiated and urgent observation continued.",
                            summarySource: "finalized_summary",
                            urgencyLevel: "Urgent",
                            queueStatus: "completed",
                            clinicianName: "Dr. Naledi Mokoena",
                            finalizedAt: "2026-04-02T09:10:00.000Z",
                        },
                    ],
                    timeline: [],
                    conditions: [],
                    allergies: [],
                    medications: [],
                }),
            });
        });

        await context.addCookies([{ name: "medstream_access_token", value: createClinicianToken(), url: "http://localhost:3000" }]);

        await page.goto("/clinician", { waitUntil: "domcontentloaded" });
        await expect(page.getByText("Patients Waiting")).toBeVisible();
        await expect(page.getByText("Thabo Molefe")).toBeVisible();
        await expect(page.getByRole("button", { name: "Review" })).toBeVisible();

        await page.goto("/clinician/consultation?visitId=3001&queueTicketId=901", { waitUntil: "domcontentloaded" });
        await expect(page.getByRole("heading", { name: "Consultation: Thabo Molefe" })).toBeVisible();
        await expect(page.getByText("Capture Context")).toBeVisible();
        await expect(page.getByText("Record Objective")).toBeVisible();
        await expect(page.getByRole("tab", { name: "Timeline Summary" })).toBeVisible();

        await page.goto("/clinician/history?patientUserId=2001&visitId=3001", { waitUntil: "domcontentloaded" });
        await expect(page.getByRole("heading", { name: "Thabo Molefe" })).toBeVisible();
        await expect(page.getByText("Presented with severe chest pain and tachycardia. ECG review initiated and urgent observation continued.")).toBeVisible();
        await expect(page.getByText("Seen for chest pain and shortness of breath. You were assessed urgently and advised on warning signs and next steps.")).toHaveCount(0);
    });
});
