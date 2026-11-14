import { test, expect, type Page } from "@playwright/test";
test.setTimeout(20000);
test.beforeEach(async ({ page }) => {
  await page.addLocatorHandler(
    page.getByRole("button", { name: "Close, remind me later", exact: true }),
    async () => {
      await page.evaluate(() =>
        document
          .querySelector<HTMLButtonElement>(
            'button[aria-label="Close, remind me later"]',
          )
          ?.click(),
      );
    },
  );
});
test("dashboard changes with known events and day-one Health does not invent a baseline", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Before hydration event" }).click();
  await expect(
    page.getByRole("heading", { name: "Review your daily observations" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Hydration pattern", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Kidney stone risk pattern: Act" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Radiation event", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Solar storm exposure pattern: Act" }),
  ).toBeVisible();
  await page.getByLabel("Demo day", { exact: true }).fill("1");
  await page.getByRole("button", { name: "Health", exact: true }).click();
  await expect(
    page
      .getByText("Unknown", {
        exact: false,
      })
      .first(),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("assistant escalation and report queue never claim transmission", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Assistant", exact: true }).click();
  await page.getByLabel("Describe how you feel").fill("I have chest pain");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(
    page.getByText("Contact the crew medical officer immediately", {
      exact: false,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Mission", exact: true }).click();
  await page.locator("#backend-tools > summary").click();
  await page
    .getByLabel("I reviewed and approve queuing this demo snapshot")
    .check();
  await page
    .getByRole("button", { name: "Draft and queue demo report" })
    .click();
  await expect(
    page.getByText("Nothing transmitted.", { exact: false }),
  ).toBeVisible();
});
test("daily logging persists and evidence is readable on a phone viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Daily Log", exact: true }).click();
  await page.getByRole("button", { name: "+250 ml", exact: true }).click();
  await page
    .getByRole("button", { name: "Save check-in", exact: true })
    .click();
  await expect(
    page.getByText("Saved locally and in the demo backend.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Evidence", exact: true }).click();
  await page
    .getByText("Source registry and evidence limitations", { exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "The Human Body in Space" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("production app reloads offline with cached data and shared rules", async ({
  page,
  context,
}) => {
  await page.goto("http://127.0.0.1:4173", { waitUntil: "domcontentloaded" });
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page
    .getByRole("button", { name: "Hydration pattern", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Kidney stone risk pattern: Act" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Assistant", exact: true }).click();
  await page.getByLabel("Describe how you feel").fill("I have chest pain");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(
    page.getByText("Contact the crew medical officer immediately", {
      exact: false,
    }),
  ).toBeVisible();
  await context.setOffline(false);
});
