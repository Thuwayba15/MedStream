import { expect, test } from "@playwright/test";

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

    test("switches feature spotlight content", async ({ page }) => {
        await page.goto("/");

        const triageTab = page.getByRole("tab", { name: "Show Rule-Based Smart Triage" });
        await triageTab.click();
        await expect(triageTab).toHaveAttribute("aria-selected", "true");
        await expect(page.getByText(/sickest patients are surfaced first/i)).toBeVisible();

        const consultationTab = page.getByRole("tab", { name: "Show Consultation" });
        await consultationTab.click();
        await expect(consultationTab).toHaveAttribute("aria-selected", "true");
        await expect(page.getByText(/structured SOAP documentation during care/i)).toBeVisible();
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
