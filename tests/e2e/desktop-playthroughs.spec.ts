import { expect, type Page, test } from "@playwright/test";

type AppId = "messenger" | "news" | "grants" | "capital" | "property" | "ledger";

async function openApp(page: Page, app: AppId) {
  await page.getByTestId(`desktop-icon-${app}`).click();
  await expect(page.getByTestId(`window-${app}`)).toBeVisible();
}

async function skipIntro(page: Page) {
  await expect(page.getByTestId("game-intro")).toBeVisible();
  await page.keyboard.press("Space");
  await expect(page.getByTestId("game-intro")).toBeHidden();
  await expect(page.getByTestId("transition-day-card")).toBeVisible();
  await expect(page.getByTestId("transition-day-number")).toHaveText("1");
  await expect(page.getByTestId("transition-day-card")).toBeHidden();
}

async function resetTestGame(page: Page, url = "/?testEndowment=10000000") {
  await page.context().clearCookies();
  await page.goto(url);
  await page.evaluate(() => localStorage.clear());
  await page.context().clearCookies();
  await page.reload();
  await skipIntro(page);
}

async function queueAllocation(
  page: Page,
  app: Extract<AppId, "grants" | "capital" | "property">,
  opportunityId: string,
  amountMillions: string
) {
  await openApp(page, app);
  await page.getByTestId(`opportunity-row-${opportunityId}`).click();
  await page.getByTestId(`allocation-input-${opportunityId}`).fill(amountMillions);
  await page.getByTestId(`queue-allocation-${opportunityId}`).click();
}

async function authorizeDay(page: Page) {
  await openApp(page, "ledger");
  await page.getByTestId("ledger-authorize").click();
}

test.beforeEach(async ({ page }) => {
  await resetTestGame(page);
});

test("shows the opening story and lets any key enter the workstation", async ({ page }) => {
  await page.context().clearCookies();
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await expect(page.getByTestId("intro-story")).toContainText("A wealthy religion");
  await expect(page.getByTestId("intro-story")).toContainText("$100 billion");
  await expect(page.getByTestId("intro-story")).toContainText("while avoiding scandal");
  await page.keyboard.press("q");
  await expect(page.getByTestId("transition-day-number")).toHaveText("1");
  await expect(page.getByTestId("desktop-shell")).toBeVisible();
});

test("logs off, fades through black, announces the next day, and returns to the desktop", async ({ page }) => {
  await queueAllocation(page, "grants", "charity.community-health-partnership", "4");
  await authorizeDay(page);

  await expect(page.getByTestId("transition-logging-off")).toContainText("Logging off");
  await expect(page.getByTestId("transition-blackout")).toBeVisible();
  await expect(page.getByTestId("transition-day-card")).toBeVisible();
  await expect(page.getByTestId("transition-day-number")).toHaveText("2");
  await expect(page.getByTestId("transition-day-card")).toBeHidden();
  await expect(page.getByTestId("taskbar-day")).toContainText("Day 2");
});

test("boots into a tagged XP-style desktop and opens each institutional app", async ({ page }) => {
  await expect(page.getByTestId("desktop-shell")).toBeVisible();
  await expect(page.getByTestId("taskbar")).toBeVisible();
  await expect(page.getByTestId("window-news")).toBeVisible();
  await expect(page.getByTestId("news-homepage")).toContainText("The Valley Tribune");

  for (const app of ["messenger", "grants", "capital", "property", "ledger"] as AppId[]) {
    await expect(page.getByTestId(`desktop-icon-${app}`)).toBeVisible();
  }

  await openApp(page, "messenger");
  await expect(page.getByTestId("messenger-thread")).toContainText("Executive Secretariat");

  await openApp(page, "capital");
  await page.getByTestId("opportunity-row-company.helios-fusion").click();
  await expect(page.getByTestId("opportunity-detail-company.helios-fusion")).toContainText("$4 billion committed by day 12");

  await page.getByTestId("taskbar-start").click();
  await expect(page.getByTestId("start-menu")).toBeVisible();
});

test("drags an application window by its tagged title bar", async ({ page }) => {
  const window = page.getByTestId("window-news");
  const handle = page.getByTestId("window-drag-handle-news");
  const before = await window.boundingBox();
  const titlebar = await handle.boundingBox();
  expect(before).not.toBeNull();
  expect(titlebar).not.toBeNull();

  await page.mouse.move(titlebar!.x + 160, titlebar!.y + 14);
  await page.mouse.down();
  await page.mouse.move(titlebar!.x + 280, titlebar!.y + 84, { steps: 6 });
  await page.mouse.up();

  const after = await window.boundingBox();
  expect(after).not.toBeNull();
  expect(after!.x).toBeGreaterThan(before!.x + 90);
  expect(after!.y).toBeGreaterThan(before!.y + 20);
});

test("flashes Messenger in the taskbar until an arriving memo is read", async ({ page }) => {
  await resetTestGame(page, "/?testEndowment=20000000");

  await queueAllocation(page, "property", "real-estate.temple-view-enclave", "10");
  await authorizeDay(page);

  const messengerTask = page.getByTestId("taskbar-app-messenger");
  await expect(messengerTask).toHaveAttribute("data-attention", "true");
  await expect(page.getByTestId("taskbar-alert-messenger")).toBeVisible();
  await messengerTask.click();
  await expect(page.getByTestId("memo-real-estate.temple-view-enclave")).toBeVisible();
  await expect(messengerTask).toHaveAttribute("data-attention", "false");
  await expect(page.getByTestId("taskbar-alert-messenger")).toBeHidden();
});

test("flashes the Tribune in the taskbar until an arriving extra is read", async ({ page }) => {
  await resetTestGame(page, "/?testEndowment=20000000");

  await queueAllocation(page, "capital", "company.helios-fusion", "10");
  await authorizeDay(page);

  const newsTask = page.getByTestId("taskbar-app-news");
  await expect(newsTask).toHaveAttribute("data-attention", "true");
  await expect(page.getByTestId("taskbar-alert-news")).toBeVisible();
  await newsTask.click();
  await expect(page.getByTestId("news-extra-company.helios-fusion")).toBeVisible();
  await expect(newsTask).toHaveAttribute("data-attention", "false");
  await expect(page.getByTestId("taskbar-alert-news")).toBeHidden();
});

test("completes the abbreviated good playthrough through GrantWorks and the ledger", async ({ page }) => {
  await queueAllocation(page, "grants", "charity.community-health-partnership", "10");
  await openApp(page, "ledger");

  await expect(page.getByTestId("ledger-draft-charity.community-health-partnership")).toContainText("$10,000,000");
  await expect(page.getByTestId("ledger-remaining")).toHaveText("$0");
  await page.getByTestId("ledger-authorize").click();

  await expect(page.getByTestId("game-over")).toBeVisible();
  await expect(page.getByTestId("game-status")).toHaveText("Mandate complete");
  await expect(page.getByTestId("metric-world")).toHaveText("8");
});

test("fires the player immediately for giving the entire endowment to one fraudulent charity", async ({ page }) => {
  await resetTestGame(page, "/");

  await queueAllocation(page, "grants", "charity.civic-justice-fund", "100000");
  await authorizeDay(page);

  await expect(page.getByTestId("game-over")).toBeVisible();
  await expect(page.getByTestId("game-status")).toHaveText("Your account has been disabled");
  await expect(page.getByTestId("game-over")).toContainText("day 1");
  await expect(page.getByTestId("metric-waste")).toHaveText("$100,000,000,000");
});

test("stacks three delayed disasters that arrive together in a hell-world playthrough", async ({ page }) => {
  await resetTestGame(page, "/?testEndowment=30000000");

  await queueAllocation(page, "capital", "company.summit-mirage-gaming", "10");
  await authorizeDay(page);
  await expect(page.getByTestId("taskbar-day")).toContainText("Day 2");

  await queueAllocation(page, "property", "real-estate.temple-view-enclave", "10");
  await authorizeDay(page);
  await expect(page.getByTestId("taskbar-day")).toContainText("Day 3");

  await queueAllocation(page, "capital", "company.helios-fusion", "10");
  await authorizeDay(page);

  await expect(page.getByTestId("game-status")).toHaveText("Your account has been disabled");
  await expect(page.getByTestId("hell-world-message")).toContainText("3 delayed consequences arrived together");
  await expect(page.getByTestId("metric-world")).toHaveText("-16");
  await expect(page.getByTestId("metric-waste")).toHaveText("$9,200,000");
  await expect(page.getByTestId("metric-consequences")).toHaveText("3");
});

test("keeps a prepared ledger entry after the workstation reloads", async ({ page }) => {
  await queueAllocation(page, "grants", "charity.community-health-partnership", "4");
  await openApp(page, "ledger");
  await expect(page.getByTestId("ledger-draft-charity.community-health-partnership")).toBeVisible();

  await page.reload();
  await openApp(page, "ledger");

  await expect(page.getByTestId("ledger-draft-charity.community-health-partnership")).toContainText("$4,000,000");
  await expect(page.getByTestId("ledger-remaining")).toHaveText("$6,000,000");
  const cookies = await page.context().cookies();
  expect(cookies.some((cookie) => cookie.name.startsWith("stewardship-save-v1-10000000"))).toBe(true);
});

test("exports a partial playthrough, clears it, imports it, and completes the campaign", async ({ page }) => {
  await queueAllocation(page, "grants", "charity.community-health-partnership", "4");
  await openApp(page, "ledger");
  await expect(page.getByTestId("ledger-draft-charity.community-health-partnership")).toBeVisible();

  await page.getByTestId("game-menu-toggle").click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("save-export").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("stewardship-save-day-1.json");
  const savePath = await download.path();
  expect(savePath).not.toBeNull();

  await page.getByTestId("game-restart").click();
  await expect(page.getByTestId("restart-confirm-dialog")).toBeVisible();
  await page.getByTestId("restart-confirm").click();
  await expect(page.getByTestId("game-intro")).toBeVisible();

  await page.keyboard.press("Space");
  await expect(page.getByTestId("transition-day-card")).toBeHidden();
  await openApp(page, "ledger");
  await expect(page.getByTestId("ledger-empty")).toBeVisible();
  await expect(page.getByTestId("ledger-remaining")).toHaveText("$10,000,000");

  await page.getByTestId("game-menu-toggle").click();
  await page.getByTestId("save-import-input").setInputFiles(savePath!);
  await expect(page.getByTestId("transition-day-number")).toHaveText("1");
  await expect(page.getByTestId("transition-day-card")).toBeHidden();
  await openApp(page, "ledger");
  await expect(page.getByTestId("ledger-draft-charity.community-health-partnership")).toContainText("$4,000,000");
  await expect(page.getByTestId("ledger-remaining")).toHaveText("$6,000,000");

  await queueAllocation(page, "grants", "charity.community-health-partnership", "6");
  await openApp(page, "ledger");
  await expect(page.getByTestId("ledger-draft-charity.community-health-partnership")).toContainText("$10,000,000");
  await expect(page.getByTestId("ledger-remaining")).toHaveText("$0");
  await page.getByTestId("ledger-authorize").click();

  await expect(page.getByTestId("game-over")).toBeVisible();
  await expect(page.getByTestId("game-status")).toHaveText("Mandate complete");
  await expect(page.getByTestId("metric-world")).toHaveText("8");
});
