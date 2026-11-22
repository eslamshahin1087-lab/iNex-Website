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

test("CMS admin shell is visible but reports missing Cloudflare bindings in static preview",async({page})=>{
 await page.goto("/admin/");
 await expect(page).toHaveTitle("إدارة محتوى iNex");
 await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content","noindex,nofollow");
 await expect(page.locator("#dashboard")).toBeVisible();
 await expect(page.locator("#backendNotice")).toBeVisible();
 await expect(page.locator("#backendNotice")).toContainText("Cloudflare Pages Preview");
});
test("public CMS safely falls back to the static bilingual website when API is unavailable",async({page})=>{
 await page.goto("/");
 await expect(page.locator("main h1")).toContainText("Insurance makes sense");
 await expect(page.locator("[data-cms-key]").first()).toBeAttached();
 await expect(page.locator("[data-cms-image-key]").first()).toBeAttached();
 await expect(page.locator('[data-cms-region="custom-content"]')).toBeAttached();
});
test("public CMS applies sanitized bilingual content from its same-origin API",async({page})=>{
 await page.route("**/api/cms/content?page=*",route=>route.fulfill({
  status:200,
  contentType:"application/json",
  body:JSON.stringify({rows:[
   {page_slug:"index",content_key:"index.text.019",content_type:"text",content_en:"CMS preview content",content_ar:"محتوى تجريبي من CMS",is_custom:0,is_visible:1},
   {page_slug:"index",content_key:"index.image.01",content_type:"image",image_url:"/assets/inex-logo.png",alt_en:"CMS logo",alt_ar:"شعار CMS",is_custom:0,is_visible:1,image_mode:"file"}
  ]})
 }));
 await page.goto("/");
 await expect(page.locator('[data-cms-key="index.text.019"]')).toContainText("CMS preview content");
 await expect(page.locator('[data-cms-image-key="index.image.01"]')).toHaveAttribute("src","/assets/inex-logo.png");
 await page.locator("#langBtn").click();
 await expect(page.locator('[data-cms-key="index.text.019"]')).toContainText("محتوى تجريبي من CMS");
 await expect(page.locator('[data-cms-image-key="index.image.01"]')).toHaveAttribute("alt","شعار CMS");
});
test("editorial insurance imagery loads and alternative text follows the selected language",async({page})=>{
 const routes=[
  ["/","insurance-visual-library"],
  ["/platform.html","platform-visual-story"],
  ["/solutions.html","solutions-visual-story"],
  ["/awareness.html","awareness-visual-story"],
  ["/company.html","company-visual-story"],
  ["/contact.html","contact-visual-story"],
  ["/resources.html","resources-visual-story"]
 ];
 for(const [path,sectionId] of routes){
  await page.goto(path,{waitUntil:"domcontentloaded"});
  await expect(page.locator('link[href="/assets/page-backgrounds.css"]')).toBeAttached();
  const background=await page.locator("body").evaluate(node=>getComputedStyle(node,"::before").backgroundImage);
  expect(background).toContain("radial-gradient");
  const section=page.locator("#"+sectionId);
  await expect(section).toBeAttached();
  const images=section.locator("img[data-cms-image-key]");
  const count=await images.count();
  expect(count,path+" must expose its editorial images").toBeGreaterThan(0);
  for(let i=0;i<count;i++){
   const candidate=images.nth(i);
   await candidate.scrollIntoViewIfNeeded();
   await expect.poll(()=>candidate.evaluate(node=>node.complete&&node.naturalWidth>=700&&node.naturalHeight>=460)).toBe(true);
   const ratio=await candidate.evaluate(node=>node.naturalWidth/node.naturalHeight);
   expect(ratio,path+" editorial artwork must preserve its complete 3:2 frame").toBeCloseTo(1.5,1);
  }
  const watermark=await page.locator("body").evaluate(node=>{
   const style=getComputedStyle(node,"::after");
   return {position:style.position,opacity:Number(style.opacity),width:parseFloat(style.width),backgroundImage:style.backgroundImage};
  });
  expect(watermark.position).toBe("fixed");
  expect(watermark.opacity).toBeLessThanOrEqual(.04);
  expect(watermark.width).toBeLessThanOrEqual(220);
  expect(watermark.backgroundImage).toContain("inex-logo.png");
  const viewport=page.viewportSize()||{width:1280,height:720};
  await page.setViewportSize({width:390,height:844});
  const mobileWatermark=await page.locator("body").evaluate(node=>{
   const style=getComputedStyle(node,"::after");
   return {position:style.position,opacity:Number(style.opacity),width:parseFloat(style.width)};
  });
  expect(mobileWatermark.position).toBe("fixed");
  expect(mobileWatermark.opacity).toBeLessThanOrEqual(.03);
  expect(mobileWatermark.width).toBeLessThanOrEqual(138);
  await page.setViewportSize(viewport);
  const image=images.first();
  const altAr=await image.getAttribute("data-alt-ar");
  const altEn=await image.getAttribute("data-alt-en");
  await page.locator("#langBtn").click();
  await expect(image).toHaveAttribute("alt",altAr);
  await page.locator("#langBtn").click();
  await expect(image).toHaveAttribute("alt",altEn);
 }
});


test("bilingual typography and light/dark text contrast remain readable",async({page})=>{
 await page.setViewportSize({width:1280,height:900});
 await page.goto("/",{waitUntil:"domcontentloaded"});
 const darkHeading=page.locator(".dark-band h2");
 const darkParagraph=page.locator(".dark-band p");
 await expect(darkHeading).toHaveCSS("color","rgb(255, 255, 255)");
 await expect(darkHeading.locator("em")).toHaveCSS("-webkit-text-fill-color","rgb(241, 212, 155)");
 await expect(darkParagraph).toHaveCSS("color","rgb(228, 237, 245)");
 await expect(darkParagraph).toHaveCSS("font-weight","500");
 const englishCopy=page.locator(".dark-band p");
 await expect(englishCopy).toHaveCSS("font-family",/Plus Jakarta Sans/);
 await page.locator("#langBtn").click();
 await expect(page.locator("html")).toHaveAttribute("lang","ar");
 await expect(darkHeading).toHaveCSS("color","rgb(255, 255, 255)");
 await expect(darkParagraph).toHaveCSS("color","rgb(228, 237, 245)");
 await expect(darkParagraph).toHaveCSS("font-family",/IBM Plex Sans Arabic/);
 await page.goto("/platform.html",{waitUntil:"domcontentloaded"});
 await expect(page.locator("html")).toHaveAttribute("lang","ar");
 const arabicHeading=page.locator(".visual-feature-copy h2");
 const arabicParagraph=page.locator(".visual-feature-copy p");
 await expect(arabicHeading).toHaveCSS("font-family",/IBM Plex Sans Arabic/);
 await expect(arabicHeading).toHaveCSS("font-weight","700");
 await expect(arabicHeading).toHaveCSS("color","rgb(7, 24, 46)");
 await expect(arabicParagraph).toHaveCSS("font-family",/IBM Plex Sans Arabic/);
 await expect(arabicParagraph).toHaveCSS("font-weight","500");
 expect(parseFloat(await arabicParagraph.evaluate(node=>getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(15);
 const paragraphColor=await arabicParagraph.evaluate(node=>getComputedStyle(node).color);
 expect(paragraphColor).toBe("rgb(67, 88, 110)");
});


test("strategic partnership panel keeps readable contrast in English and Arabic",async({page})=>{
 await page.setViewportSize({width:1351,height:900});
 await page.goto("/company.html",{waitUntil:"domcontentloaded"});
 const panel=page.locator(".partner-section");
 const heading=panel.locator(".partner-section-copy h2");
 const emphasis=heading.locator("em");
 const paragraph=panel.locator(".partner-section-copy p");
 const eyebrow=panel.locator(".partner-section-copy .eyebrow span");
 await expect(panel).toBeVisible();
 await expect(heading).toHaveCSS("color","rgb(255, 255, 255)");
 await expect(emphasis).toHaveCSS("-webkit-text-fill-color","rgb(241, 212, 155)");
 await expect(paragraph).toHaveCSS("color","rgb(228, 237, 245)");
 await expect(eyebrow).toHaveCSS("color","rgb(241, 212, 155)");
 await expect(paragraph).toHaveCSS("opacity","1");
 await page.locator("#langBtn").click();
 await expect(page.locator("html")).toHaveAttribute("lang","ar");
 await expect(heading).toHaveCSS("color","rgb(255, 255, 255)");
 await expect(emphasis).toHaveCSS("-webkit-text-fill-color","rgb(241, 212, 155)");
 await expect(paragraph).toHaveCSS("color","rgb(228, 237, 245)");
 await expect(paragraph).toHaveCSS("font-family",/IBM Plex Sans Arabic/);
 await expect(paragraph).toHaveCSS("font-weight","500");
 expect(parseFloat(await paragraph.evaluate(node=>getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(15);
 await page.setViewportSize({width:390,height:844});
 await expect(heading).toBeVisible();
 await expect(paragraph).toBeVisible();
 await expect(heading).toHaveCSS("color","rgb(255, 255, 255)");
 await expect(paragraph).toHaveCSS("color","rgb(228, 237, 245)");
});
