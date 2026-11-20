const {test,expect}=require("@playwright/test");
const routes=[
 ["/","Insurance makes sense"],
 ["/platform.html","From knowledge to"],
 ["/solutions.html","Different needs"],
 ["/awareness.html","Ask. Understand."],
 ["/company.html","We believe awareness"],
 ["/contact.html","Have an insurance question"],
 ["/resources.html","Perspectives for understanding"]
];

test("all customer-facing pages load in English with shared navigation",async({page})=>{
 for(const [path,heading] of routes){
  await page.goto(path,{waitUntil:"domcontentloaded"});
  await expect(page.locator("html")).toHaveAttribute("lang","en");
  await expect(page.locator("html")).toHaveAttribute("dir","ltr");
  await expect(page.locator("main h1")).toContainText(heading);
  await expect(page.locator(".desktop-nav")).toBeVisible();
  await expect(page.locator("#langBtn")).toBeVisible();
  await expect(page.locator(".brand img").first()).toBeVisible();
 }
});
test("English is the default and Arabic-English switching updates copy, metadata, fonts and direction",async({page})=>{
await page.goto("/",{waitUntil:"domcontentloaded"});
 await expect(page.locator("html")).toHaveAttribute("lang","en");await expect(page.locator("html")).toHaveAttribute("dir","ltr");
 await expect(page).toHaveTitle("Home | iNex");await expect(page.locator("main h1")).toContainText("Insurance makes sense");
 const englishDescription=await page.locator('meta[name="description"]').getAttribute("content");
 await page.locator("#langBtn").click();
 await expect(page.locator("html")).toHaveAttribute("lang","ar");await expect(page.locator("html")).toHaveAttribute("dir","rtl");
 await expect(page).toHaveTitle("الرئيسية | iNex");await expect(page.locator("main h1")).toContainText("التأمين أوضح");
 expect(await page.locator('meta[name="description"]').getAttribute("content")).not.toBe(englishDescription);
 await expect(page.locator("body")).toHaveCSS("font-family",/IBM Plex Sans Arabic/);
 await expect(page.locator("main h1")).toHaveCSS("font-family",/IBM Plex Sans Arabic/);
 await expect(page.locator(".desktop-nav a").nth(3)).toHaveText("التوعية");
 await page.locator("#langBtn").click();await expect(page.locator("html")).toHaveAttribute("lang","en");
 await expect(page.locator("html")).toHaveAttribute("dir","ltr");await expect(page).toHaveTitle("Home | iNex");
});
test("English translations contain no Arabic strings across all public pages",async({page})=>{
 for(const path of [...routes.map(route=>route[0]),"/404.html"]){
  await page.goto(path);await expect(page.locator("html")).toHaveAttribute("lang","en");
  const arabic=await page.locator("[data-en]").evaluateAll(nodes=>nodes.map(node=>node.dataset.en).filter(value=>[...value].some(character=>{const code=character.codePointAt(0);return code>=0x0600&&code<=0x06ff;})));
  expect(arabic,path+" Arabic strings in English translations").toEqual([]);
 }
});
test("mobile menu opens, closes with Escape and restores focus",async({page})=>{
await page.setViewportSize({width:390,height:844});await page.goto("/");
 const trigger=page.locator("#menuBtn"),menu=page.locator("#mobileMenu");await expect(menu).toBeHidden();
 await trigger.click();await expect(menu).toBeVisible();await expect(trigger).toHaveAttribute("aria-expanded","true");
 await page.keyboard.press("Escape");await expect(menu).toBeHidden();await expect(trigger).toBeFocused();
});
test("desktop navigation is visible and mobile menu is hidden",async({page})=>{
await page.setViewportSize({width:1440,height:900});await page.goto("/");
 await expect(page.locator(".desktop-nav")).toBeVisible();await expect(page.locator("#menuBtn")).toBeHidden();await expect(page.locator("#mobileMenu")).toBeHidden();
});
test("404 page remains branded, English-first and noindex",async({page})=>{
await page.goto("/404.html");await expect(page).toHaveTitle("Page not found | iNex");
 await expect(page.locator("html")).toHaveAttribute("lang","en");
 await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content","noindex,follow");
 await expect(page.locator(".not-found-logo")).toBeVisible();
});
test("founding leadership portraits and bilingual titles render",async({page})=>{
await page.goto("/");await page.locator("#langBtn").click();
 await expect(page.locator(".leadership-preview-grid .leader-preview-card")).toHaveCount(2);
 await expect(page.locator(".leadership-preview-grid")).toContainText("إسلام إبراهيم");await expect(page.locator(".leadership-preview-grid")).toContainText("فوزية هشام");
 const portrait=page.locator('.leadership-preview-grid img[src="/assets/fawzya-hesham.jpg"]');await portrait.scrollIntoViewIfNeeded();
 await expect(portrait).toBeVisible();await expect(portrait).toHaveJSProperty("complete",true);
 await page.goto("/company.html#leadership");await expect(page.locator("#leadership")).toHaveClass(/is-visible/);
 await expect(page.locator("#leadership .leader-card")).toHaveCount(2);await expect(page.locator("#leadership")).toContainText("إسلام إبراهيم");
 await expect(page.locator("#leadership")).toContainText("فوزية هشام");await expect(page.locator("#leadership img[alt*=Fawzya]")).toHaveAttribute("src","/assets/fawzya-hesham.jpg");
 await page.locator("#langBtn").click();await expect(page.locator("#leadership")).toContainText("Islam Ibrahim");
 await expect(page.locator("#leadership")).toContainText("Fawzya Hesham");await expect(page.locator("#leadership")).toContainText("COO & Co-Founder");
});
test("homepage leadership cards remain usable on mobile",async({page})=>{
await page.setViewportSize({width:390,height:844});await page.goto("/");
 await expect(page.locator(".leadership-preview-grid .leader-preview-card")).toHaveCount(2);await expect(page.locator(".leadership-preview-grid")).toBeVisible();
});
test("all app launch links use the current iNex application entry point",async({page})=>{
 for(const [path] of routes){await page.goto(path);const links=page.locator('a[href="https://eslamshahin1087-lab.github.io/iNex-App/wathiqati-app.html"]');await expect(links.first()).toBeAttached();await expect(page.locator('a[href="https://eslamshahin1087-lab.github.io/iNex/"]')).toHaveCount(0);}
});
test("scroll progress indicator is available without blocking page content",async({page})=>{
await page.goto("/");await expect(page.locator("#scrollProgress")).toBeAttached();await expect(page.locator("main")).toBeVisible();
});
test("homepage leadership link opens the visible company section",async({page})=>{
await page.goto("/");await page.locator(".leadership-link").click();
 await expect(page).toHaveURL(/\/company(?:\.html)?\/?#leadership$/);await expect(page.locator("#leadership")).toHaveClass(/is-visible/);
 await expect(page.locator("#leadership .leader-card")).toHaveCount(2);
});
test("product partnership copy switches in both languages",async({page})=>{
await page.goto("/");const partner=page.locator("#insurnex-partner");await expect(partner).toContainText("Explore InsurNex");
 await page.locator("#langBtn").click();await expect(partner).toContainText("اكتشف InsurNex");await expect(page.locator("html")).toHaveAttribute("dir","rtl");
 await page.locator("#langBtn").click();await expect(partner).toContainText("Explore InsurNex");
});

test("Arabic typography is consistent, right-aligned and balanced on mobile",async({page})=>{
 await page.setViewportSize({width:540,height:900});
 await page.goto("/");
 await page.locator("#langBtn").click();
 await expect(page.locator("html")).toHaveAttribute("lang","ar");
 const heading=page.locator(".hero h1");
 const lead=page.locator(".hero .lead");
 await expect(heading).toHaveCSS("font-family",/IBM Plex Sans Arabic/);
 await expect(lead).toHaveCSS("font-family",/IBM Plex Sans Arabic/);
 await expect(heading).toHaveCSS("font-weight","700");
 await expect(lead).toHaveCSS("text-align","right");
 await expect(lead).toHaveCSS("letter-spacing","normal");
 const lineWidths=await lead.evaluate(element=>{
  const range=document.createRange();
  range.selectNodeContents(element);
  const rects=[...range.getClientRects()];
  const lines=new Map();
  for(const rect of rects){
   const key=Math.round(rect.top);
   const old=lines.get(key);
   if(old)old.right=Math.max(old.right,rect.right),old.left=Math.min(old.left,rect.left);
   else lines.set(key,{left:rect.left,right:rect.right});
  }
  return [...lines.values()].map(line=>line.right-line.left);
 });
 expect(lineWidths.length).toBeGreaterThan(1);
 const widest=Math.max(...lineWidths);
 const lastLine=lineWidths[lineWidths.length-1];
 expect(lastLine/widest).toBeGreaterThan(0.28);
});

test("insurer logo marquee runs and pauses in English LTR and Arabic RTL",async({page})=>{
await page.goto("/");
 const viewport=page.locator("#insurer-network .insurer-logo-viewport"),track=page.locator("#insurer-network .insurer-logo-track");
 const cards=page.locator('#insurer-network .insurer-logo-set[data-logo-copy="primary"] .insurer-logo-card');await viewport.scrollIntoViewIfNeeded();
 await expect(page.locator("html")).toHaveAttribute("lang","en");await expect(cards).toHaveCount(18);await expect(page.locator("#insurer-network .insurer-logo-sprite")).toHaveCount(36);
 await expect(track).toHaveCSS("animation-name","inex-insurer-marquee");await expect(track).toHaveCSS("animation-play-state","running");await expect(viewport).toHaveCSS("direction","ltr");
 const visibleCount=async()=>page.locator("#insurer-network .insurer-logo-card").evaluateAll(elements=>{const box=document.querySelector("#insurer-network .insurer-logo-viewport").getBoundingClientRect();return elements.filter(element=>{const r=element.getBoundingClientRect();return r.width>0&&r.height>0&&r.right>box.left&&r.left<box.right&&r.bottom>box.top&&r.top<box.bottom;}).length;});
 expect(await visibleCount()).toBeGreaterThan(0);
 await viewport.hover();await expect(track).toHaveCSS("animation-play-state","paused");
 const paused=await track.evaluate(element=>getComputedStyle(element).transform);await page.waitForTimeout(350);
 expect(await track.evaluate(element=>getComputedStyle(element).transform)).toBe(paused);
 await page.mouse.move(0,0);await expect(track).toHaveCSS("animation-play-state","running");
 const beforeEn=await track.evaluate(element=>getComputedStyle(element).transform);await page.waitForTimeout(900);
 expect(await track.evaluate(element=>getComputedStyle(element).transform)).not.toBe(beforeEn);
 await page.locator("#langBtn").click();await expect(page.locator("html")).toHaveAttribute("lang","ar");await expect(page.locator("html")).toHaveAttribute("dir","rtl");
 await expect(viewport).toHaveCSS("direction","ltr");await expect(track).toHaveCSS("animation-name","inex-insurer-marquee");await expect(track).toHaveCSS("animation-play-state","running");
 expect(await visibleCount()).toBeGreaterThan(0);
 const beforeAr=await track.evaluate(element=>getComputedStyle(element).transform);await page.waitForTimeout(900);
 expect(await track.evaluate(element=>getComputedStyle(element).transform)).not.toBe(beforeAr);
 await viewport.hover();await expect(track).toHaveCSS("animation-play-state","paused");
 await page.mouse.move(0,0);await expect(track).toHaveCSS("animation-play-state","running");
 for(const name of ["جي آي جي مصر","مصر للتكافل للتأمين","طوكيو مارين مصر","ميتلايف","المهندس للتأمين","الدلتا للتأمين","أورينت للتأمين التكافلي","وثاق للتأمين التكافلي","أروب مصر","ثروة للتأمين","كاف للتأمين","أكسا مصر","قناة السويس للتأمين","إسكان للتأمين","مصر لتأمينات الحياة","مصر للتأمين","أليانز مصر","الوطنية للتأمين"])await expect(page.locator("#insurer-network")).toContainText(name);
 await expect(page.locator("#insurer-network")).toContainText("لا يعني وجود شراكة أو اعتماد بينها وبين iNex");
 await expect(page.locator("#insurer-network .insurer-logo-sprite").first()).toHaveCSS("background-image",/insurance-companies-sprite\.avif/);
 await expect(page.locator("#insurance-knowledge img")).toBeVisible();await expect(page.locator("#insurtech img")).toBeVisible();
 await page.locator("#langBtn").click();await expect(page.locator("html")).toHaveAttribute("lang","en");
 for(const name of ["GIG Egypt","Misr Takaful Insurance","Tokio Marine Egypt","MetLife","Mohandes Insurance","Delta Insurance","Orient Takaful","Wethaq","Arope Egypt","Sarwa Insurance","Kaf Insurance","AXA Egypt","Suez Canal Insurance","Iskan Insurance","Misr Life Insurance","Misr Insurance","Allianz Egypt","Al Wataniya Insurance"])await expect(page.locator("#insurer-network")).toContainText(name);
 await expect(page.locator("#insurtech")).toContainText("Technology that");
});

test("InsurTech backgrounds and icon motion render while keeping content readable",async({page})=>{
 await page.goto("/");
 await expect(page.locator("main")).toBeVisible();
 await expect(page.locator("main")).toHaveCSS("animation-name","inex-page-enter");
 await expect(page.locator("main")).toHaveCSS("isolation","isolate");
 const hero=page.locator(".hero.wrap");
 await expect(hero).toBeVisible();
 const background=await hero.evaluate(element=>getComputedStyle(element).backgroundImage);
 expect(background).toContain("radial-gradient");
 const card=page.locator("#inex-difference .info-card").first();
 await card.scrollIntoViewIfNeeded();
 const icon=card.locator(".card-icon");
 await expect(icon).toHaveCSS("animation-name","inex-icon-drift");
 await card.hover();
 await expect(icon).toHaveCSS("animation-play-state","paused");
 await expect(card).toBeVisible();
 await page.setViewportSize({width:390,height:844});
 await expect(page.locator("#inex-difference")).toBeVisible();
});
test("reduced-motion preference disables decorative motion while keeping story content visible",async({browser})=>{
 const context=await browser.newContext({reducedMotion:"reduce"});
 const page=await context.newPage();
 await page.goto("/");
 await expect(page.locator("main")).toHaveCSS("animation-name","none");
 const icon=page.locator("#inex-difference .card-icon").first();
 await icon.scrollIntoViewIfNeeded();
 await expect(icon).toHaveCSS("animation-name","none");
 await expect(page.locator("#inex-difference .info-card").first()).toBeVisible();
 await context.close();
});

test("CMS admin is private and shows setup guidance until a backend is configured",async({page})=>{
 await page.goto("/admin/");
 await expect(page).toHaveTitle("إدارة محتوى iNex");
 await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content","noindex,nofollow");
 await expect(page.locator("#loginPanel")).toBeVisible();
 await expect(page.locator("#configNotice")).toBeVisible();
 await expect(page.locator("#email")).toBeDisabled();
 await expect(page.locator("#password")).toBeDisabled();
 await expect(page.locator("#dashboard")).toBeHidden();
});
test("public CMS hooks have safe static fallbacks when no backend is configured",async({page})=>{
 await page.goto("/");
 await expect(page.locator("main h1")).toContainText("Insurance makes sense");
 await expect(page.locator("[data-cms-key]").first()).toBeAttached();
 await expect(page.locator("[data-cms-image-key]").first()).toBeAttached();
 await expect(page.locator('[data-cms-region="custom-content"]')).toBeAttached();
});


test("CMS administration is private and login-gated",async({page})=>{
 await page.goto("/admin/",{waitUntil:"domcontentloaded"});
 await expect(page).toHaveTitle("إدارة محتوى iNex");
 await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content","noindex,nofollow");
 await expect(page.locator("#loginPanel")).toBeVisible();
 await expect(page.locator("#dashboard")).toBeHidden();
 await expect(page.locator("#password")).toHaveAttribute("type","password");
 const configNotice=page.locator("#configNotice");
 if(await configNotice.isVisible()){
  await expect(page.locator("#email")).toBeDisabled();
  await expect(page.locator("#password")).toBeDisabled();
  await expect(page.locator('#loginForm button[type="submit"]')).toBeDisabled();
 }else{
  await expect(page.locator("#email")).toBeEnabled();
  await expect(page.locator("#password")).toBeEnabled();
 }
});
