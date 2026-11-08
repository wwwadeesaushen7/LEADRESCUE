import { test, expect } from "@playwright/test";
test("lead editing, filtered CSV export and saved conversations work across reloads", async ({
  page,
}) => {
  await page.goto("/demo/leads");
  await expect(page.getByRole("table")).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Add lead", exact: true }).click();
  await page
    .getByLabel("Customer name", { exact: true })
    .fill("Harbor Customer");
  await page.getByLabel("Phone number", { exact: true }).fill("+442079460123");
  await page.getByLabel("Customer notes").fill("Asked for a quote");
  await page.getByRole("button", { name: "Save lead", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByLabel("Search leads").fill("Harbor");
  await page
    .getByRole("button", { name: "Edit Harbor Customer", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Lead status", exact: true })
    .selectOption("Won");
  await page.getByRole("button", { name: "Save lead", exact: true }).click();
  await expect(page.getByRole("table")).toContainText("Won");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  expect((await download).suggestedFilename()).toBe("leadrescue-leads.csv");
  await page.reload();
  await page.getByLabel("Search leads").fill("Harbor");
  await expect(page.getByRole("table")).toContainText("Harbor Customer");
  await expect(page.getByRole("table")).toContainText("Won");
  await page.goto("/demo/inbox");
  await page
    .getByRole("button", { name: "New conversation", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Customer", exact: true })
    .selectOption({ label: "Harbor Customer" });
  await page
    .getByRole("combobox", { name: "Channel", exact: true })
    .selectOption("SMS");
  await page
    .getByRole("button", { name: "Create conversation", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Harbor Customer", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Your reply", { exact: true })
    .fill("Thanks for your call. We can help tomorrow.");
  await page
    .getByRole("button", { name: "Save simulated reply", exact: true })
    .click();
  await expect(
    page
      .getByLabel("Message history")
      .getByText("Thanks for your call. We can help tomorrow.", {
        exact: true,
      }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Simulate reply", exact: true })
    .click();
  await expect(
    page
      .getByLabel("Message history")
      .getByText(
        "Thanks for getting back to me! What times do you have available?",
        { exact: true },
      ),
  ).toBeVisible();
  await page.getByLabel("Handled by").fill("Adeesa");
  await page
    .getByRole("button", { name: "Save assignee", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText("Assignee label saved.");
  await page.reload();
  await expect(page.getByLabel("Handled by")).toHaveValue("Adeesa");
  await expect(
    page
      .getByLabel("Message history")
      .getByText("Thanks for your call. We can help tomorrow.", {
        exact: true,
      }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});
test("appointments validate time conflicts, support cancellation and persist", async ({
  page,
}) => {
  await page.goto("/demo/appointments");
  await page
    .getByRole("button", { name: "Book appointment", exact: true })
    .click();
  await page.getByLabel("Appointment title").fill("Kitchen faucet visit");
  await page
    .getByRole("button", { name: "Save appointment", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: /Kitchen faucet visit/ }).click();
  await page
    .getByLabel("Appointment notes")
    .fill("Bring a replacement washer.");
  await page
    .getByRole("button", { name: "Save appointment", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Book appointment", exact: true })
    .click();
  await page.getByLabel("Appointment title").fill("Overlapping visit");
  await page
    .getByRole("button", { name: "Save appointment", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "overlaps",
  );
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("button", { name: /Kitchen faucet visit/ }).click();
  await page
    .getByRole("combobox", { name: "Appointment status", exact: true })
    .selectOption("Canceled");
  await page
    .getByRole("button", { name: "Save appointment", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /Kitchen faucet visit/ }),
  ).toContainText("Canceled");
  await page.reload();
  await page.getByRole("button", { name: /Kitchen faucet visit/ }).click();
  await expect(page.getByLabel("Appointment notes")).toHaveValue(
    "Bring a replacement washer.",
  );
  await expect(
    page.getByRole("combobox", { name: "Appointment status", exact: true }),
  ).toHaveValue("Canceled");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});
test("business settings save worldwide timezones and motion preference persists", async ({
  page,
}) => {
  await page.goto("/demo/settings");
  await page
    .getByLabel("Business name", { exact: true })
    .fill("Worldwide Services");
  await page
    .getByRole("combobox", { name: "Timezone", exact: true })
    .selectOption("Asia/Colombo");
  await page
    .getByRole("button", { name: "Save business details", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText("Business details saved.");
  await page.getByRole("button", { name: "Refresh workspace" }).click();
  await expect(page.getByLabel("Business name", { exact: true })).toHaveValue(
    "Worldwide Services",
  );
  await page.reload();
  await expect(page.getByLabel("Business name", { exact: true })).toHaveValue(
    "Worldwide Services",
  );
  await expect(
    page.getByRole("combobox", { name: "Timezone", exact: true }),
  ).toHaveValue("Asia/Colombo");
  await page
    .getByRole("button", { name: "Pause animations", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
  await page.goto("/demo");
  await expect(
    page.getByText("Here’s what’s happening at Worldwide Services."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Enable animations" }),
  ).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page
      .locator(".stat-card")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
});
test("every live business tool requires authentication and the API has no demo bypass", async ({
  page,
  request,
}) => {
  for (const route of ["/leads", "/inbox", "/appointments", "/settings"]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/login$/);
  }
  expect((await request.get("/api/workspace")).status()).toBe(503);
  expect(
    (
      await request.post("/api/workspace", {
        headers: { origin: "https://attacker.example" },
        data: { action: "readNotifications" },
      })
    ).status(),
  ).toBe(403);
});
