const { test, expect } = require("@playwright/test");

test("all corporate pages load with shared navigation", async ({ page }) => {
  for (const [path, heading] of [
    ["/", "منصة واحدة"],
    ["/platform.html", "إدارة أكثر ترابطًا"],
    ["/solutions.html", "تقنية تتكيف مع"],
    ["/resources.html", "رؤى تساعد على فهم"],
    ["/company.html", "نبني تقنية تأمينية"],
    ["/contact.html", "لنبدأ"]
  ]) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await expect(page.locator("main h1")).toContainText(heading);
    await expect(page.locator(".desktop-nav")).toBeVisible();
    await expect(page.locator("#langBtn")).toBeVisible();
  }
});

test("Arabic and English language switching updates direction, page title and copy", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page).toHaveTitle("الرئيسية | iNex");
  const arabicHeading = page.locator("main h1");
  await expect(arabicHeading).toContainText("منصة واحدة");
  const arabicDescription = await page.locator('meta[name="description"]').getAttribute("content");

  await page.getByRole("button", { name: "Switch language to English" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page).toHaveTitle("Home | iNex");
  await expect(page.locator("main h1")).toContainText("One platform");
  await expect(page.locator(".desktop-nav a").nth(4)).toHaveText("Company");
  await expect(page.getByRole("button", { name: "التبديل إلى العربية" })).toBeVisible();
  const englishDescription = await page.locator('meta[name="description"]').getAttribute("content");
  expect(englishDescription).not.toBe(arabicDescription);
  await page.getByRole("button", { name: "التبديل إلى العربية" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator(".desktop-nav a").nth(4)).toHaveText("الشركة");
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
  await expect(page.locator(".desktop-nav")).toBeVisible();
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

test("all English translation strings are English and navigation stays consistent on every page", async ({ page }) => {
  for (const path of ["/", "/platform.html", "/solutions.html", "/resources.html", "/company.html", "/contact.html"]) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Switch language to English" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    const arabicValues = await page.locator("[data-en]").evaluateAll(nodes =>
      nodes.map(node => node.dataset.en).filter(value => [...value].some(character => { const code = character.codePointAt(0); return code >= 0x0600 && code <= 0x06FF; }))
    );
    expect(arabicValues, path + " contains Arabic in English translations").toEqual([]);
    await expect(page.locator(".desktop-nav a").nth(4)).toHaveText("Company");
    await expect(page).toHaveTitle(/(Home|Platform|Solutions|Resources|Company|Contact) \\| iNex/);
  }
});

test("homepage brand is not duplicated beside the approved logo", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".nav .brand img")).toBeVisible();
  await expect(page.locator(".nav .brand span")).toHaveCount(0);
  await expect(page.locator(".workspace-window")).toBeVisible();
});
