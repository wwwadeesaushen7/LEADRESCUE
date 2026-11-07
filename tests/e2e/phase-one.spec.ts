import { test, expect } from "@playwright/test";
test("landing, theme, pricing and navigation work without credentials", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Every missed call",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await page.locator("summary").first().click();
  await expect(page.locator("details").first()).toHaveAttribute("open", "");
  await page.getByRole("link", { name: "Watch demo" }).click();
  await expect(
    page.getByRole("heading", { name: "Good things are calling." }),
  ).toBeVisible();
});
test("demo business persists through a server route and remains isolated per browser", async ({
  page,
  browser,
}) => {
  await page.goto("/onboarding?mode=demo");
  await page
    .getByLabel("Business name", { exact: true })
    .fill("Harbor Home Services");
  await page.getByRole("button", { name: "Open my demo" }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(
    page.getByText("Here’s what’s happening at Harbor Home Services."),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Here’s what’s happening at Harbor Home Services."),
  ).toBeVisible();
  const other = await browser.newContext();
  const otherPage = await other.newPage();
  await otherPage.goto("/demo");
  await expect(
    otherPage.getByText("Here’s what’s happening at Willow & Co. Plumbing."),
  ).toBeVisible();
  await other.close();
});
test("dashboard supports search, chart periods, setup details and notifications", async ({
  page,
}) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: "Month", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /1 Nov: 54 calls/ }),
  ).toBeVisible();
  await page.getByLabel("Search missed calls").fill("Sophia");
  await expect(page.getByText("Sophia Chen", { exact: true })).toBeVisible();
  await expect(page.getByText("Olivia Martin", { exact: true })).toHaveCount(0);
  await page.getByLabel("Search missed calls").fill("does-not-exist");
  await expect(page.getByText("No matching calls")).toBeVisible();
  await page
    .getByRole("button", { name: "Notifications", exact: true })
    .click();
  await expect(
    page.getByText("Sample: Sophia has a new appointment."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Mark read" }).click();
  await page
    .getByRole("button", { name: "Notifications", exact: true })
    .click();
  await page.getByRole("button", { name: "View setup guidance" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Got it" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("live dashboard cannot be accessed using a demo cookie", async ({
  page,
}) => {
  await page.goto("/demo");
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByText("Live accounts are not configured yet."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Log in", exact: true }),
  ).toBeDisabled();
});
test("API rejects forged origins and malformed demo input", async ({
  request,
}) => {
  expect(
    (
      await request.post("/api/demo", {
        headers: { origin: "https://attacker.test" },
        data: {},
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/demo", {
        headers: { origin: "http://127.0.0.1:3000" },
        data: { name: "X" },
      })
    ).status(),
  ).toBe(400);
});
