import { test, expect } from "@playwright/test";

test("install page explains Android and computer installation without a browser offer", async ({
  page,
}) => {
  await page.goto("/install");
  await expect(page.getByRole("heading", { name: "On Android" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "On your computer" }),
  ).toBeVisible();
  await expect(page.getByText("Internet access is required.")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Continue in your browser" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.getByRole("link", { name: /Explore the demo/ }).click();
  await expect(page).toHaveURL(/\/demo$/);
});

test("manifest and raster icons support a standalone app", async ({
  page,
  request,
}) => {
  await page.goto("/install");
  const manifestUrl = await page
    .locator('link[rel="manifest"]')
    .getAttribute("href");
  expect(manifestUrl).toBe("/manifest.webmanifest");
  const response = await request.get(manifestUrl!);
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest).toMatchObject({
    name: "LeadRescue",
    start_url: "/app",
    scope: "/",
    display: "standalone",
  });
  expect(manifest.icons).toHaveLength(3);
  for (const icon of manifest.icons) {
    const image = await request.get(icon.src);
    expect(image.ok()).toBe(true);
    expect(image.headers()["content-type"]).toContain("image/png");
    const dimensions = await page.evaluate(async (src: string) => {
      const image = new Image();
      image.src = src;
      await image.decode();
      return `${image.naturalWidth}x${image.naturalHeight}`;
    }, icon.src);
    expect(dimensions).toBe(icon.sizes);
  }
});

// Browser-offer simulations validate our UI state machine, not OS installation.
test("installation only opens after a click and handles dismissal honestly", async ({
  page,
}) => {
  await page.goto("/install");
  // The theme control confirms client hydration before dispatching the offer.
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.evaluate(() => {
    const offer = new Event("beforeinstallprompt", { cancelable: true });
    Object.assign(offer, {
      prompt: async () => {
        document.documentElement.dataset.promptOpened = "yes";
      },
      userChoice: Promise.resolve({ outcome: "dismissed" }),
    });
    window.dispatchEvent(offer);
  });
  await expect(
    page.getByRole("button", { name: "Install LeadRescue", exact: true }),
  ).toBeVisible();
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-prompt-opened",
    "yes",
  );
  await page
    .getByRole("button", { name: "Install LeadRescue", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-prompt-opened",
    "yes",
  );
  await expect(page.getByRole("status")).toContainText("No problem");
  await expect(
    page.getByRole("button", { name: "Install LeadRescue", exact: true }),
  ).toHaveCount(0);
});

test("browser installation confirmation updates the app state", async ({
  page,
}) => {
  await page.goto("/install");
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  await expect(
    page.getByText(
      "LeadRescue is installed or running as an app on this device.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open LeadRescue", exact: true }),
  ).toBeVisible();
});
