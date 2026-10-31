const {test,expect}=require("@playwright/test");
const routes=[["/","التأمين أوضح"],["/platform.html","من المعرفة إلى"],["/solutions.html","احتياجات مختلفة"],["/awareness.html","اسأل. افهم."],["/company.html","نؤمن أن الوعي"],["/contact.html","لديك سؤال عن التأمين"]];
test("all customer-facing pages load with shared navigation",async({page})=>{for(const [path,heading] of routes){await page.goto(path,{waitUntil:"domcontentloaded"});await expect(page.locator("main h1")).toContainText(heading);await expect(page.locator(".desktop-nav")).toBeVisible();await expect(page.locator("#langBtn")).toBeVisible();await expect(page.locator(".brand img").first()).toBeVisible();}});
test("Arabic-English switching updates copy, metadata, title and direction",async({page})=>{await page.addInitScript(()=>localStorage.removeItem("inex-site-language"));await page.goto("/",{waitUntil:"domcontentloaded"});await expect(page.locator("html")).toHaveAttribute("lang","ar");await expect(page.locator("html")).toHaveAttribute("dir","rtl");await expect(page).toHaveTitle("الرئيسية | iNex");await expect(page.locator("main h1")).toContainText("التأمين أوضح");const ar=await page.locator('meta[name="description"]').getAttribute("content");await page.getByRole("button",{name:"Switch language to English"}).click();await expect(page.locator("html")).toHaveAttribute("lang","en");await expect(page.locator("html")).toHaveAttribute("dir","ltr");await expect(page).toHaveTitle("Home | iNex");await expect(page.locator("main h1")).toContainText("Insurance makes sense");const en=await page.locator('meta[name="description"]').getAttribute("content");expect(en).not.toBe(ar);await expect(page.locator(".desktop-nav a").nth(3)).toHaveText("Awareness");await page.getByRole("button",{name:"التبديل إلى العربية"}).click();await expect(page.locator("html")).toHaveAttribute("dir","rtl");});
test("English translations contain no Arabic strings across all pages",async({page})=>{await page.addInitScript(()=>localStorage.removeItem("inex-site-language"));for(const [path] of routes){await page.goto(path);await page.getByRole("button",{name:"Switch language to English"}).click();const arabic=await page.locator("[data-en]").evaluateAll(nodes=>nodes.map(n=>n.dataset.en).filter(v=>[...v].some(c=>{const n=c.codePointAt(0);return n>=0x0600&&n<=0x06ff})));expect(arabic,path+" Arabic strings in English").toEqual([]);}});
test("mobile menu opens, closes with Escape and restores focus",async({page})=>{await page.setViewportSize({width:390,height:844});await page.goto("/");const trigger=page.locator("#menuBtn"),menu=page.locator("#mobileMenu");await expect(menu).toBeHidden();await trigger.click();await expect(menu).toBeVisible();await expect(trigger).toHaveAttribute("aria-expanded","true");await page.keyboard.press("Escape");await expect(menu).toBeHidden();await expect(trigger).toBeFocused();});
test("desktop navigation is visible and mobile menu is hidden",async({page})=>{await page.setViewportSize({width:1440,height:900});await page.goto("/");await expect(page.locator(".desktop-nav")).toBeVisible();await expect(page.locator("#menuBtn")).toBeHidden();await expect(page.locator("#mobileMenu")).toBeHidden();});
test("404 page remains branded and noindex",async({page})=>{await page.goto("/404.html");await expect(page).toHaveTitle("404 | iNex");await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content","noindex,follow");await expect(page.locator(".not-found-logo")).toBeVisible();});
test("CEO portrait image or designed fallback is visible in both leadership placements",async({page})=>{
  const verifyPortrait=async(frame)=>{
    await frame.scrollIntoViewIfNeeded();
    await expect(frame).toBeVisible();
    await expect.poll(()=>frame.evaluate(el=>{
      const img=el.querySelector("img");
      return Boolean(img&&(img.naturalWidth>0||(img.hidden&&el.classList.contains("portrait-fallback"))));
    })).toBe(true);
    const state=await frame.evaluate(el=>{
      const img=el.querySelector("img");
      return {loaded:img.naturalWidth>0,hidden:img.hidden,fallback:el.classList.contains("portrait-fallback")};
    });
    expect(state.loaded||state.fallback).toBe(true);
    if(state.fallback)expect(state.hidden).toBe(true);
  };
  await page.goto("/");
  await expect(page.locator(".ceo-preview img")).toHaveAttribute("src","/assets/ceo-portrait-clean.png");
  await expect(page.locator(".ceo-preview")).toContainText("الرئيس التنفيذي لـ iNex");
  await verifyPortrait(page.locator(".ceo-photo-frame"));
  await page.goto("/company.html#leadership");
  await verifyPortrait(page.locator("#leadership .ceo-profile-photo"));
  await expect(page.locator("#leadership h2")).toHaveText("إسلام إبراهيم");
  await page.getByRole("button",{name:"Switch language to English"}).click();
  await expect(page.locator("#leadership h2")).toHaveText("Islam Ibrahim");
});
test("all app launch links use the current iNex-App GitHub Pages path",async({page})=>{
  for(const path of ["/","/platform.html","/solutions.html","/awareness.html","/company.html","/contact.html","/resources.html"]){
    await page.goto(path);
    const links=page.locator('a[href="https://eslamshahin1087-lab.github.io/iNex-App/"]');
    await expect(links.first()).toBeAttached();
    await expect(page.locator('a[href="https://eslamshahin1087-lab.github.io/iNex/"]')).toHaveCount(0);
  }
});
test("scroll progress indicator is available without blocking page content",async({page})=>{await page.goto("/");await expect(page.locator("#scrollProgress")).toBeAttached();await expect(page.locator("main")).toBeVisible();});
