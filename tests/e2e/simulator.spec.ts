import { test, expect, type Page } from "@playwright/test";
async function prepare(page: Page, scenario = "whatsapp") {
  await page
    .getByRole("combobox", { name: "Test case", exact: true })
    .selectOption(scenario);
  await page
    .getByRole("button", { name: "Prepare test case", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Start incoming call", exact: true }),
  ).toBeVisible();
}
async function completeCall(page: Page) {
  await page
    .getByRole("button", { name: "Start incoming call", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Finish simulated call", exact: true })
    .click();
}
function metric(page: Page, name: string) {
  return page
    .getByLabel("Recovery results")
    .getByText(name, { exact: true })
    .locator("..")
    .locator("dd .stat-number");
}
async function fits(page: Page) {
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
}

test("complete recovery journey stays browser-local, persists and updates dashboard call analytics", async ({
  page,
}) => {
  const unexpected: string[] = [],
    errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.hostname !== "127.0.0.1" || url.pathname === "/api/workspace") {
      unexpected.push(url.origin + url.pathname);
      return route.abort();
    }
    return route.continue();
  });
  await page.goto("/demo/simulator");
  await prepare(page);
  await fits(page);
  await page
    .getByRole("button", { name: "Start incoming call", exact: true })
    .click();
  await expect(page.locator(".call-orb")).toHaveClass(/ringing/);
  await page
    .getByRole("button", { name: "Pause animations", exact: true })
    .click();
  expect(
    await page
      .locator(".call-orb")
      .evaluate((el) => parseFloat(getComputedStyle(el).animationDuration)),
  ).toBeLessThan(0.01);
  await page
    .getByRole("button", { name: "Finish simulated call", exact: true })
    .click();
  await expect(page.locator(".simulation-message")).toContainText("WhatsApp");
  await expect(metric(page, "Confirmed recovered")).toHaveText("0");
  await page
    .getByRole("button", { name: "Simulate delivery", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Simulate customer reply", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Open demo inbox", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Morgan Lane", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Message history")).toContainText(
    "Simulated · delivered",
  );
  await expect(page.getByRole("button", { name: /Edit message:/ })).toHaveCount(
    0,
  );
  await page
    .getByLabel("Your reply", { exact: true })
    .fill("We have time on Tuesday.");
  await page
    .getByRole("button", { name: "Save simulated reply", exact: true })
    .click();
  await expect(page.getByLabel("Message history")).toContainText(
    "We have time on Tuesday.",
  );
  await page.goto("/demo/simulator");
  await page
    .getByRole("button", { name: "Book demo appointment", exact: true })
    .click();
  await page
    .getByLabel("Appointment title", { exact: true })
    .fill("Simulator repair visit");
  await page
    .getByRole("button", { name: "Save demo appointment", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(metric(page, "Confirmed recovered")).toHaveText("0");
  await page
    .getByRole("button", { name: "Mark lead as won", exact: true })
    .click();
  await expect(metric(page, "Confirmed recovered")).toHaveText("1");
  await page
    .getByRole("button", { name: "Replay duplicate call event", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "duplicate event" }),
  ).toContainText("1 duplicate event ignored");
  await expect(metric(page, "Recovery attempts")).toHaveText("1");
  await page.reload();
  await expect(metric(page, "Confirmed recovered")).toHaveText("1");
  await page.goto("/demo");
  await page.getByLabel("Search missed calls").fill("Morgan");
  await expect(page.getByRole("table")).toContainText("Morgan Lane");
  await expect(page.getByRole("table")).toContainText("Won");
  await page.getByRole("button", { name: "Day", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /1 calls, 1 recovery attempts/ }),
  ).toBeVisible();
  await fits(page);
  expect(unexpected).toEqual([]);
  expect(errors).toEqual([]);
});
test("fallback, no consent, opt-out, failed delivery and duplicate scenarios explain their outcomes", async ({
  page,
}) => {
  await page.goto("/demo/simulator");
  for (const scenario of ["no-consent", "opt-out"]) {
    await prepare(page, scenario);
    await completeCall(page);
    await expect(
      page.getByLabel("Recovery journey").getByRole("status"),
    ).toContainText("MANUAL");
    await expect(page.locator(".simulation-message")).toHaveCount(0);
  }
  await prepare(page, "sms-fallback");
  await completeCall(page);
  await expect(page.locator(".simulation-message")).toContainText("SMS");
  await expect(page.locator(".simulation-message")).toContainText(
    "Reply STOP to opt out.",
  );
  await prepare(page, "failure");
  await completeCall(page);
  await page
    .getByRole("button", { name: "Simulate delivery failure", exact: true })
    .click();
  await expect(
    page.getByLabel("Recovery journey").getByRole("status"),
  ).toContainText("FAILED");
  await page
    .getByRole("button", { name: "Replay duplicate call event", exact: true })
    .click();
  await expect(metric(page, "Recovery attempts")).toHaveText("2");
  await expect(metric(page, "SMS messages")).toHaveText("1");
  await expect(metric(page, "Confirmed recovered")).toHaveText("0");
  await fits(page);
});
test("delay, separate SMS permission and opt-out controls cannot be bypassed from the inbox", async ({
  page,
}) => {
  await page.goto("/demo/simulator");
  await prepare(page, "sms-fallback");
  await page
    .getByRole("button", { name: "Edit demo permissions", exact: true })
    .click();
  await page
    .getByLabel("Separate SMS permission recorded", { exact: true })
    .uncheck();
  await page
    .getByRole("button", { name: "Save demo permissions", exact: true })
    .click();
  await completeCall(page);
  await expect(
    page.getByLabel("Recovery journey").getByRole("status"),
  ).toContainText("SMS permission has not been recorded independently.");
  await prepare(page);
  await page
    .getByRole("button", { name: "Demo settings", exact: true })
    .click();
  await page.getByLabel("Delay in seconds", { exact: true }).fill("60");
  await page
    .getByRole("button", { name: "Save demo settings", exact: true })
    .click();
  await completeCall(page);
  await expect(
    page.getByLabel("Recovery journey").getByRole("status"),
  ).toContainText("QUEUED");
  await page
    .getByRole("button", { name: "Advance to send time", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Simulate delivery", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Simulate STOP", exact: true })
    .click();
  await page.goto("/demo/inbox");
  await page
    .getByLabel("Your reply", { exact: true })
    .fill("This must stay blocked.");
  await page
    .getByRole("button", { name: "Save simulated reply", exact: true })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "opted out" }),
  ).toBeVisible();
  await expect(page.getByLabel("Message history")).not.toContainText(
    "This must stay blocked.",
  );
  await page.goto("/demo/simulator");
  await page
    .getByRole("button", { name: "Start another call", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Finish simulated call", exact: true })
    .click();
  await expect(
    page.getByLabel("Recovery journey").getByRole("status"),
  ).toContainText("opted out");
  await expect(metric(page, "Recovery attempts")).toHaveText("1");
  await fits(page);
});
test("theme, reduced motion, and persisted ringing calls work without customer consent inferred", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/demo/simulator");
  await prepare(page, "voicemail");
  await page
    .getByRole("button", { name: "Toggle color theme", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Start incoming call", exact: true })
    .click();
  await page.reload();
  await expect(page.locator(".call-orb")).toHaveClass(/ringing/);
  expect(
    await page
      .locator(".call-orb")
      .evaluate((el) => parseFloat(getComputedStyle(el).animationDuration)),
  ).toBeLessThan(0.01);
  await expect(
    page.getByRole("button", {
      name: "Animations disabled by device preference",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page
    .getByRole("button", { name: "Finish simulated call", exact: true })
    .click();
  await expect(metric(page, "Missed calls")).toHaveText("1");
  await fits(page);
});
