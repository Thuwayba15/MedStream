import { expect, test } from "@playwright/test";

test.describe("landing page", () => {
    test("renders hero content and feature spotlight", async ({ page }) => {
        await page.goto("/");

        await expect(page.getByRole("heading", { level: 1, name: /Better care starts with better workflow/i })).toBeVisible();
        await expect(page.getByRole("heading", { level: 2, name: "The MedStream Way" })).toBeVisible();
        await expect(page.getByRole("tab", { name: "Show Patient Intake" })).toBeVisible();
        await expect(page.getByAltText("MedStream brand mark")).toBeVisible();
    });

    test("switches feature spotlight content", async ({ page }) => {
        await page.goto("/");

        await page.getByRole("tab", { name: "Show Rule-Based Smart Triage" }).click();
        await expect(page.getByRole("heading", { level: 3, name: "Rule-Based Smart Triage" })).toBeVisible();
        await expect(page.getByText(/System applies rules, red flags, and urgency scoring/i)).toBeVisible();

        await page.getByRole("tab", { name: "Show Consultation" }).click();
        await expect(page.getByRole("heading", { level: 3, name: "Consultation" })).toBeVisible();
        await expect(page.getByText(/MedStream helps clinicians draft structured SOAP documentation/i)).toBeVisible();
    });

    test("routes from landing page to auth placeholders", async ({ page }) => {
        await page.goto("/");

        await page.getByRole("link", { name: "Login" }).click();
        await expect(page).toHaveURL(/\/login$/);
        await expect(page.getByText("Login")).toBeVisible();

        await page.goto("/");
        await page.getByRole("link", { name: "Sign Up" }).click();
        await expect(page).toHaveURL(/\/registration$/);
        await expect(page.getByText("Registration")).toBeVisible();
    });
});
