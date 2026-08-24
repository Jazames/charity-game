import { expect, test } from "@playwright/test";

test("the deployed game loads its opening sequence and desktop", async ({ context, page }) => {
  await context.clearCookies();
  const response = await page.goto("./", { waitUntil: "networkidle" });

  expect(response?.ok()).toBe(true);
  await expect(page.getByTestId("game-intro")).toBeVisible();
  await expect(page.getByTestId("intro-story")).toContainText("$100 billion");

  await page.keyboard.press("Space");
  await expect(page.getByTestId("transition-day-number")).toHaveText("1");
  await expect(page.getByTestId("transition-day-card")).toBeHidden();
  await expect(page.getByTestId("desktop-shell")).toBeVisible();
  await expect(page.getByTestId("news-homepage")).toContainText("The Valley Tribune");
});
