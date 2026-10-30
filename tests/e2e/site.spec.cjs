const { test, expect } = require("@playwright/test");

test("Arabic and English language switching updates direction and metadata", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page).toHaveTitle(/التأمين أصبح أوضح/);

  const arabicDescription = await page.locator('meta[name="description"]').getAttribute("content");
  await page.getByRole("button", { name: "Switch language to English" }).click();

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page).toHaveTitle(/Insurance, intelligently connected/);
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "en_US");
  await expect(page.getByRole("button", { name: "تغيير اللغة إلى العربية" })).toBeVisible();
  const englishDescription = await page.locator('meta[name="description"]').getAttribute("content");
  expect(englishDescription).not.toBe(arabicDescription);
});

test("mobile navigation opens, closes with Escape and restores focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const trigger = page.locator("#menuBtn");
  const menu = page.locator("#mobileMenu");
  await expect(menu).toBeHidden();
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(menu).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
});

test("desktop navigation is available without the mobile menu", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".links")).toBeVisible();
  await expect(page.locator("#menuBtn")).toBeHidden();
  await expect(page.locator("#mobileMenu")).toBeHidden();
});

test("branded 404 page includes local logo and noindex metadata", async ({ page }) => {
  await page.goto("/404.html", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveTitle(/404 \| iNex/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex,follow");
  const logo = page.locator(".not-found-logo");
  await expect(logo).toBeVisible();
  await expect.poll(() => logo.evaluate((img) => img.naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByRole("heading", { name: "الصفحة غير موجودة" })).toBeVisible();
});
