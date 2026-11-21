const fs=require("node:fs");const path=require("node:path");const assert=require("node:assert/strict");const root=path.resolve(__dirname,"..");const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const pages=["index.html","platform.html","solutions.html","awareness.html","company.html","contact.html"];
for(const page of pages){const html=read(page);assert.ok(html.includes('<html lang="en" dir="ltr">'),page+" must default to English LTR");for(const token of ['assets/site.css','assets/site.js','id="mobileMenu"','id="langBtn"','data-ar=','data-en=','assets/inex-logo.png'])assert.ok(html.includes(token),page+" missing "+token);const ids=[...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,page+" IDs must be unique");const english=[...html.matchAll(/data-en="([^"]*)"/g)].map(m=>m[1]);for(const value of english)assert.ok(![...value].some(c=>{const n=c.codePointAt(0);return n>=0x0600&&n<=0x06ff}),page+" has Arabic in English translation: "+value);const external=[...html.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/g)].map(m=>m[0]);for(const link of external)assert.match(link,/rel=["'][^"']*noopener[^"']*["']/,"External links must use noopener");}
const css=read("assets/site.css"),js=read("assets/site.js"),readme=read("README.md");for(const asset of ["assets/site.css","assets/site.js","assets/inex-logo.png"])assert.ok(fs.existsSync(path.join(root,asset)),"Missing "+asset);
assert.match(js,/sessionStorage\.getItem\("inex-site-language"\)/);assert.doesNotMatch(js,/localStorage\.getItem\("inex-site-language"\)/);assert.match(js,/let language="en"/);assert.match(js,/restartInsurerMarquee/);assert.match(js,/dataset\.html==="true"/);assert.match(js,/textContent=translation/);assert.match(js,/normalizePageKey/);assert.match(js,/querySelectorAll\("\.reveal/);assert.match(js,/event\.key==="Escape"/);
assert.match(css,/\.awareness-card/);assert.match(css,/prefers-reduced-motion:reduce/);assert.match(css,/:focus-visible/);
assert.match(read("_headers"),/Content-Security-Policy:/);assert.match(read("_headers"),/X-Frame-Options: DENY/);assert.match(read("404.html"),/name="robots" content="noindex,follow"/);assert.ok(read("404.html").includes("https://eslamshahin1087-lab.github.io/iNex-App/wathiqati-app.html"),"404 page must link to the current iNex application entry point");
assert.match(readme,/Insurance Awareness & Customer Solutions/);assert.ok(fs.existsSync(path.join(root,"assets/ceo-portrait-clean.png")),"Missing CEO portrait");assert.match(read("index.html"),/leadership-preview-grid/);assert.match(read("company.html"),/id="leadership"/);assert.match(read("company.html"),/Islam Ibrahim/);assert.match(read("company.html"),/Fawzya Hesham/);assert.ok(fs.existsSync(path.join(root,"assets/fawzya-hesham.jpg")),"Missing co-founder portrait");assert.match(read("index.html"),/data-ar="إسلام إبراهيم"/);assert.match(read("index.html"),/data-html="true"/);assert.match(read("index.html"),/data-ar="فوزية هشام"/);assert.match(read("company.html"),/data-ar="إسلام إبراهيم"/);assert.match(read("company.html"),/data-ar="فوزية هشام"/);assert.match(read("company.html"),/Fawzya Hesham/);assert.ok(fs.existsSync(path.join(root,"assets/fawzya-hesham.jpg")),"Missing co-founder portrait");assert.match(read("index.html"),/Fawzya Hesham/);assert.match(css,/\.leadership-team-grid/);assert.match(css,/\.leader-card/);assert.match(css,/\.leadership-team-grid/);assert.match(css,/\.leader-card/);assert.match(css,/\.reveal\.is-visible/);assert.match(css,/#leadership\{scroll-margin-top/);assert.match(js,/IntersectionObserver/);assert.match(js,/scrollProgress/);assert.doesNotMatch(readme,/CRM for brokers|broker management platform/i);
for(const page of [...pages,"resources.html"]){const html=read(page);assert.ok(html.includes("https://eslamshahin1087-lab.github.io/iNex-App/wathiqati-app.html"),page+" must link to the current iNex application entry point");assert.ok(!html.includes("https://eslamshahin1087-lab.github.io/iNex/"),page+" must not retain the obsolete GitHub Pages path");}assert.doesNotMatch(read("contact.html"),/hello@inex\.com|mailto:/);
for(const page of ["index.html","company.html"]){
  const html=read(page);
  assert.ok(html.includes('src="/assets/ceo-portrait-clean.png"'),page+" must include the CEO portrait asset");
  assert.ok(!html.includes("onerror="),page+" must not use CSP-blocked inline event handlers");
}
assert.ok(js.includes('document.querySelectorAll(".ceo-photo-frame img,.ceo-profile-photo img")'));
assert.ok(js.includes('image.addEventListener("error",activateFallback,{once:true})'));
assert.ok(js.includes("image.hidden=true"));
assert.ok(js.includes('classList.add("portrait-fallback")'));
assert.match(css,/\.ceo-photo-frame\.portrait-fallback img,\.ceo-profile-photo\.portrait-fallback img\{display:none!important\}/,"Failed portrait images must be hidden above fallback backgrounds");
assert.match(css,/\.ceo-photo-frame\.portrait-fallback:before/,"Homepage portrait fallback styling must exist");
assert.match(css,/\.ceo-profile-photo\.portrait-fallback:before/,"Company portrait fallback styling must exist");
for(const page of pages){const html=read(page);assert.ok(html.includes("https://www.facebook.com/profile.php?id=61592318504674"),page+" must link to the official iNex Facebook page");assert.ok(html.includes("https://insurnex-8a9df.web.app/?view=desktop"),page+" must link to the InsurNex desktop application");}assert.ok(read("index.html").includes('id="product-ecosystem"'));assert.ok(read("index.html").includes('id="insurnex-partner"'));for(const file of ["index.html","company.html"]){const html=read(file);assert.ok(html.includes("https://www.linkedin.com/in/islam-ibrahim-mba-%F0%9F%8E%A0-188832210/"));assert.ok(html.includes("https://www.linkedin.com/in/fawzya-hesham-4315a119b/"));}
const homepage=read("index.html");
assert.match(homepage,/id="insurer-network"/);assert.match(homepage,/جمعنالك/);
const primaryStart=homepage.indexOf('<div class="insurer-logo-set" data-logo-copy="primary">');
const primaryEnd=homepage.indexOf("</div>",primaryStart);
const primaryLogos=homepage.slice(primaryStart,primaryEnd);
assert.equal([...primaryLogos.matchAll(/<a class="insurer-logo-card"/g)].length,18,"Primary logo set must contain 18 logos");
assert.equal([...homepage.matchAll(/<a class="insurer-logo-card"/g)].length,36,"Marquee must contain a duplicated visual set");
assert.match(homepage,/data-logo-copy="duplicate" aria-hidden="true" inert/);
assert.ok(homepage.includes("</section>\n\n<section class=\"insurance-knowledge"),"Insurer section must close before the next section");

for(const name of ["GIG Egypt","Misr Takaful Insurance","Tokio Marine Egypt","MetLife","Mohandes Insurance","Delta Insurance","Orient Takaful","Wethaq","Arope Egypt","Sarwa Insurance","Kaf Insurance","AXA Egypt","Suez Canal Insurance","Iskan Insurance","Misr Life Insurance","Misr Insurance","Allianz Egypt","Al Wataniya Insurance"])assert.ok(homepage.includes('data-en="'+name+'"'),"Missing insurer "+name);
assert.match(homepage,/لا يعني وجود شراكة أو اعتماد بينها وبين iNex/);
assert.ok(fs.existsSync(path.join(root,"assets/insurance-companies-sprite.avif")),"Missing supplied insurer logo sprite");
assert.match(read("assets/brand-system.css"),/insurance-companies-sprite\.avif/);
assert.match(read("assets/brand-system.css"),/\.insurer-logo-sprite/);
for(const font of ["IBM+Plex+Sans+Arabic","Alexandria"])assert.ok(read("index.html").includes(font),"Homepage must load "+font);
for(const selector of ['html[lang="ar"] body','html[lang="ar"] h1','html[lang="ar"] .hero h1'])assert.ok(read("assets/brand-system.css").includes(selector),"Arabic typography missing "+selector);
assert.ok(!read("assets/site.js").includes("syncMarqueeDistance"),"Marquee must not depend on JavaScript width measurement");
assert.ok(!read("assets/site.js").includes("ResizeObserver"),"Marquee must remain CSS-driven");
assert.ok(read("assets/brand-system.css").includes("translate3d(-50%,0,0)"),"Marquee must translate by half of its duplicated track");

for(const token of [".insurer-logo-viewport",".insurer-logo-track","inex-insurer-marquee","animation-play-state:paused","prefers-reduced-motion"])assert.ok(read("assets/brand-system.css").includes(token),"Marquee must support "+token);
assert.match(homepage,/id="insurance-knowledge"/);assert.match(homepage,/id="insurtech"/);
assert.ok(fs.existsSync(path.join(root,"assets/insurance-illustration.svg")),"Missing insurance illustration");
assert.ok(fs.existsSync(path.join(root,"assets/insurtech-illustration.svg")),"Missing InsurTech illustration");
assert.match(css,/\.insurer-logo-grid/);assert.match(css,/\.insurance-knowledge/);assert.match(css,/\.insurtech-feature/);
const brandCss=read("assets/brand-system.css");
assert.ok(fs.existsSync(path.join(root,"assets/brand-system.css")),"Missing shared iNex brand system stylesheet");
for(const page of ["index.html","platform.html","solutions.html","awareness.html","company.html","contact.html","resources.html","404.html"])assert.ok(read(page).includes("assets/brand-system.css"),page+" must load the shared brand system");
for(const token of ["--brand-digital","#07182e",".hero.wrap",".page-hero.wrap",".insurer-network",".insurtech-feature","prefers-reduced-motion"])assert.ok(brandCss.includes(token),"Brand system must define "+token);
console.log("iNex customer-awareness website checks passed.");

/* English-first, bilingual content coverage and RTL-safe marquee behavior. */
for(const page of ["index.html","platform.html","solutions.html","awareness.html","company.html","contact.html","resources.html","404.html"]){
 const html=read(page);
 assert.ok(html.includes('<html lang="en" dir="ltr">'),page+" must render English by default");
 assert.ok(html.includes("data-description-en="),page+" must define an English meta description");
}
assert.ok(js.includes('sessionStorage.setItem("inex-site-language",next)'),"Language preference should remain scoped to the current tab");
assert.ok(read("assets/brand-system.css").includes("#insurer-network .insurer-logo-track"),"Marquee direction must be isolated from the document direction");
assert.ok(read("assets/brand-system.css").includes("direction:ltr!important"),"Marquee track must remain LTR while the page is RTL");
assert.ok(read("assets/brand-system.css").includes("animation-play-state:paused!important"),"Marquee must pause on hover/focus in both languages");
for(const [page,id] of [["index.html","decision-framework"],["platform.html","platform-journey"],["solutions.html","solutions-journey"],["awareness.html","awareness-checklist"],["company.html","company-principles"],["contact.html","contact-guidance"],["resources.html","resources-starter-guides"]]){
 assert.ok(read(page).includes('id="'+id+'"'),page+" is missing expanded section "+id);
}

assert.ok(read("resources.html").includes('<html lang="en" dir="ltr">'),"Resources page must now be English-first");
assert.ok(read("resources.html").includes('id="resources-starter-guides"'),"Resources page must include practical starter guides");
assert.ok(!read("resources.html").includes('data-en="الشركة"'),"Resources navigation must use English copy");

assert.ok(read("assets/brand-system.css").includes('font-family:"IBM Plex Sans Arabic",sans-serif!important'),"Arabic typography must use one consistent family");
assert.ok(read("assets/brand-system.css").includes("text-align:right!important"),"Arabic hero copy must be explicitly right aligned");
assert.ok(read("assets/brand-system.css").includes("text-wrap:pretty"),"Arabic paragraphs must avoid awkward final-line breaks");
assert.ok(read("index.html").includes("خدمات العملاء الرقمية في تجربة واحدة واضحة"),"Homepage Arabic hero copy should avoid an isolated trailing word");

/* InsurTech visual language and customer-story sections. */
for(const [page,id] of [["index.html","inex-difference"],["platform.html","platform-in-practice"],["solutions.html","solutions-better-conversations"],["awareness.html","awareness-policy-language"],["company.html","company-digital-principles"],["contact.html","contact-preparation"],["resources.html","resources-digital-insurance"]]){
 const html=read(page);
 assert.ok(html.includes('id="'+id+'"'),page+" must include its expanded customer story section");
}
assert.match(read("assets/brand-system.css"),/@keyframes inex-icon-drift/);
assert.match(read("assets/brand-system.css"),/@keyframes inex-page-enter/);
assert.match(read("assets/brand-system.css"),/prefers-reduced-motion:reduce/);
assert.ok(read("assets/brand-system.css").includes("main:before"),"All pages should use the digital background layer");
assert.ok(read("index.html").includes("From information to clearer decisions"),"Homepage should explain the iNex value proposition");

/* iNex CMS structure and safe admin boundary. */
for(const page of ["index.html","platform.html","solutions.html","awareness.html","company.html","contact.html","resources.html"]){
 const html=read(page);
 assert.ok(html.includes('data-cms-page="'+page.replace(".html","")+'"'),page+" must identify its CMS page slug");
 assert.ok(html.includes('data-cms-region="custom-content"'),page+" must provide a custom content region");
 assert.match(html,/data-cms-key="[^"]+"/,page+" must expose editable translated content");
 assert.match(html,/data-cms-image-key="[^"]+"/,page+" must expose editable images");
}
assert.ok(read("admin/index.html").includes('id="loginForm"'),"CMS admin must provide a login form");
assert.ok(read("admin/index.html").includes('name="robots" content="noindex,nofollow"'),"CMS admin must not be indexed");
assert.ok(read("assets/cms-public.js").includes("is_published"),"Public CMS layer must respect publication state");
assert.ok(read("assets/admin.js").includes("signInWithPassword"),"CMS access must use authenticated login");
assert.ok(!/service_role|sb_secret_/i.test(read("assets/admin.js")+read("assets/cms-public.js")+read("assets/cms-config.js")),"No privileged Supabase key may be shipped to the browser");
assert.match(read("supabase/setup-cms.sql"),/enable row level security/i);
assert.match(read("supabase/setup-cms.sql"),/cms_admins/i);
assert.match(read("supabase/setup-cms.sql"),/inex-site-media/i);

assert.ok(read("index.html").includes('data-cms-image-key="index.logo.18"'),"Insurer logos must be individually manageable in the CMS");
assert.ok(read("supabase/setup-cms.sql").includes("'index.logo.18'"),"CMS setup must seed all 18 insurer logo records");
assert.ok(read("supabase/setup-cms.sql").includes("image_mode"),"CMS schema must support cropped sprite and uploaded image assets");
assert.ok(read("assets/cms-public.js").includes("row.image_mode==="),"CMS renderer must preserve sprite crops and support individual logo uploads");
assert.ok(read("_headers").includes("https://esm.sh"),"CSP must allow the pinned Supabase browser SDK import");


/* iNex CMS inventory, security boundary and deployment-readiness checks. */
const cmsSql=read("supabase/setup-cms.sql");
const cmsSqlCompact=cmsSql.replace(/\s+/g,"");
const cmsPublic=read("assets/cms-public.js");
const cmsAdmin=read("assets/admin.js");
const cmsPages=["index.html","platform.html","solutions.html","awareness.html","company.html","contact.html","resources.html"];
const cmsTypeCounts={};
for(const type of ["text","image","card"])cmsTypeCounts[type]=cmsSql.split(", '"+type+"',").length-1;
assert.ok(cmsTypeCounts.text>=624,"CMS seed must retain the bilingual page text inventory");
const cmsImageKeys=cmsSql.match(/(?:index|platform|solutions|awareness|company|contact|resources)\.(?:image|logo)\.\d+/g)||[]; assert.ok(new Set(cmsImageKeys).size>=38,"CMS seed must retain page imagery and individually managed insurer logos");
assert.ok(cmsSql.includes("content_type in ('text','card')"),"CMS schema must support adding card content");
for(let i=1;i<=18;i++)assert.ok(cmsSql.includes("'index.logo."+String(i).padStart(2,"0")+"'"),"Missing individually managed insurer logo "+i);
for(const page of cmsPages){
 const slug=page.replace(".html","");
 const html=read(page);
 assert.ok(html.includes('data-cms-page="'+slug+'"'),page+" must identify its CMS page slug");
 assert.ok(html.includes('data-cms-region="custom-content"'),page+" must provide a custom-content region");
 assert.ok(html.includes('assets/cms-config.js')&&html.includes('assets/cms-public.js'),page+" must load the optional public CMS layer");
 for(const [attribute,type] of [["data-cms-key","text"],["data-cms-image-key","image"]]){
  for(const match of html.matchAll(new RegExp(attribute+'="([^"]+)"',"g"))){
   const seedRow="('"+slug+"','"+match[1]+"','"+type+"'";
   assert.ok(cmsSqlCompact.includes(seedRow),page+" CMS key has no matching "+type+" seed: "+match[1]);
  }
 }
}
assert.ok(cmsPublic.includes("new DOMParser()"),"Public CMS content must be parsed before rendering");
assert.ok(cmsPublic.includes('const allowed=new Set(["BR","STRONG","B","EM","I","U","SMALL","SPAN","SUB","SUP"])'),"Public CMS content must allow only safe inline elements");
assert.ok(cmsPublic.includes('if(url.protocol!=="https:")return null;'),"Remote CMS image URLs must require HTTPS");
assert.ok(cmsPublic.includes('eq("is_published",true)'),"Public pages must never load unpublished CMS content");
assert.ok(cmsPublic.includes("rows.filter(row=>row.is_custom&&row.is_visible)"),"Custom CMS blocks must respect their visibility state");
assert.ok(cmsSql.includes("alter table public.cms_admins enable row level security"));
assert.ok(cmsSql.includes("alter table public.cms_content enable row level security"));
assert.ok(cmsSql.includes('create policy "CMS admins can update content"'));
assert.ok(cmsSql.includes("with check ((select public.is_cms_admin()))"),"CMS writes must verify admin authorization");
for(const policy of ["iNex CMS admins can upload media","iNex CMS admins can replace media","iNex CMS admins can delete media"])assert.ok(cmsSql.includes(policy),"Storage operation must be restricted: "+policy);
assert.ok(cmsAdmin.includes("signInWithPassword"),"CMS must use authenticated password login");
assert.ok(cmsAdmin.includes("cms_admins"),"CMS must verify admin membership");
assert.ok(cmsAdmin.includes("file.size>8*1024*1024"),"CMS uploads must enforce the 8MB limit");
assert.ok(cmsAdmin.includes('user.id+"/"+page'),"Uploaded media must be scoped to the authenticated admin");
assert.ok(!cmsAdmin.includes("signUp("),"The CMS must not expose public account registration");
assert.doesNotMatch(cmsAdmin+cmsPublic+read("assets/cms-config.js"),/service_role|sb_secret_/i,"No privileged Supabase key may be shipped to the browser");


/* iNex editorial visuals, page backgrounds and CMS-managed image inventory. */
const visualPages=["index.html","platform.html","solutions.html","awareness.html","company.html","contact.html","resources.html"];
const visualAssets=["insurance-protection.svg","digital-policy.svg","insurance-transformation.svg","digital-platform.svg"];
for(const asset of visualAssets){
 const assetPath=path.join(root,"assets",asset);
 assert.ok(fs.existsSync(assetPath),"Missing editorial image asset: "+asset);
 assert.ok(fs.statSync(assetPath).size>3500,"Editorial SVG asset is unexpectedly small: "+asset);
 assert.ok(fs.readFileSync(assetPath,"utf8").includes(`width="1200" height="800" viewBox="0 0 1200 800"`),"Editorial SVG must declare a full-resolution 3:2 canvas: "+asset);
}
const pageBackgrounds=read("assets/page-backgrounds.css");
assert.ok(pageBackgrounds.includes('url("/assets/inex-logo.png")'),"Page background must use the iNex mark as a subtle watermark");
assert.ok(pageBackgrounds.includes("position:fixed")&&pageBackgrounds.includes("opacity:.035"),"iNex mark must read as a restrained site-wide watermark");
assert.ok(pageBackgrounds.includes("filter:grayscale(1)"),"The watermark must be monochrome rather than a full-colour logo");
assert.ok(pageBackgrounds.includes(".page-hero:after{content:none!important"),"The oversized page-hero monogram must not compete with the watermark");
assert.ok(pageBackgrounds.includes(".visual-feature-media img")&&pageBackgrounds.includes("aspect-ratio:3/2"),"Editorial images must retain their complete native 3:2 composition");
for(const slug of ["index","platform","solutions","awareness","company","contact","resources"]){
 const html=read(slug+".html");
 assert.ok(html.includes('href="/assets/page-backgrounds.css"'),slug+" must load its iNex page background");
 assert.ok(pageBackgrounds.includes('body[data-cms-page="'+slug+'"]'),slug+" must have its own background treatment");
}
assert.ok(read("404.html").includes('href="/assets/page-backgrounds.css"'),"404 page must inherit the iNex background system");
assert.ok(read("assets/site.js").includes('image.dataset.altAr')&&read("assets/site.js").includes('image.dataset.altEn'),"Image alternative text must switch with the page language");
const homepageVisual=read("index.html");
assert.ok(homepageVisual.includes('id="insurance-visual-library"'),"Homepage must include the four-topic visual library");
for(const key of ["index.image.07","index.image.08","index.image.09","index.image.10"])assert.ok(homepageVisual.includes('data-cms-image-key="'+key+'"'),"Homepage visual image is missing CMS key "+key);
for(const [page,id,key] of [
 ["platform.html","platform-visual-story","platform.image.03"],
 ["solutions.html","solutions-visual-story","solutions.image.03"],
 ["awareness.html","awareness-visual-story","awareness.image.03"],
 ["company.html","company-visual-story","company.image.06"],
 ["contact.html","contact-visual-story","contact.image.03"],
 ["resources.html","resources-visual-story","resources.image.03"]
]){
 const html=read(page);
 assert.ok(html.includes('id="'+id+'"'),page+" must include its topic-specific visual story");
 assert.ok(html.includes('data-cms-image-key="'+key+'"'),page+" visual image must be editable through CMS");
}
for(const key of [
 "index.text.801","index.text.802","index.text.803","index.text.804","index.text.805","index.text.806","index.text.807","index.text.808",
 "platform.text.801","platform.text.802","solutions.text.801","solutions.text.802","awareness.text.801","awareness.text.802",
 "company.text.801","company.text.802","contact.text.801","contact.text.802","resources.text.801","resources.text.802"
])assert.ok(cmsSql.includes("'"+key+"'"),"CMS seed is missing editorial text key "+key);
for(const asset of visualAssets)assert.ok(cmsSql.includes("/assets/"+asset),"CMS seed must map the image asset "+asset);
assert.ok(new Set(cmsImageKeys).size>=48,"CMS must include the original inventory and 10 new editable editorial images");


/* Readability and contrast regression checks for both site languages. */
const typeSystem=read("assets/brand-system.css");
assert.ok(typeSystem.includes("iNex readable type & contrast system"),"The site-wide readability system must be present");
assert.ok(typeSystem.includes("--nx-text-secondary:#4b6076"),"Secondary copy must use a high-contrast slate tone");
assert.ok(typeSystem.includes("--nx-heading-dark:#ffffff"),"Dark surfaces must use white headings");
assert.ok(typeSystem.includes("--nx-gold-on-dark:#f1d49b"),"Gold emphasis on dark surfaces must use the light-gold token");
assert.ok(typeSystem.includes("html[lang=\"ar\"] body :is(p,li,dd,figcaption"),"Arabic reading copy must receive explicit typography rules");
assert.ok(typeSystem.includes("font-size:16px;")&&typeSystem.includes("font-weight:500;"),"Arabic body copy must be readable in size and weight");
assert.ok(typeSystem.includes(".dark-band :is(h1,h2,h3,h4,h5,h6)")||typeSystem.includes(":is(.dark-band,.insurtech-feature"),"Dark section headings must be explicitly protected from dark text colours");
assert.ok(typeSystem.includes("-webkit-text-fill-color:currentColor!important"),"Emphasis text must not become transparent on dark surfaces");


/* Company partnership panel contrast regression checks. */
assert.ok(typeSystem.includes("Strategic partnership panel: explicit light-on-navy contrast"),"The strategic partnership panel must have dedicated dark-surface typography");
assert.ok(typeSystem.includes(".partner-section-copy h2{\n  color:#ffffff!important"),"Partnership heading must remain white on navy");
assert.ok(typeSystem.includes(".partner-section-copy h2 em{\n  color:#f1d49b!important"),"Partnership heading emphasis must use light gold");
assert.ok(typeSystem.includes(".partner-section-copy p{\n  color:#e4edf5!important"),"Partnership paragraph must remain light and readable");


/* Production security hardening regression checks. */
const responseHeaders=read("_headers");
for(const header of [
 "X-Content-Type-Options: nosniff",
 "X-Frame-Options: DENY",
 "Referrer-Policy: strict-origin-when-cross-origin",
 "Strict-Transport-Security: max-age=31536000",
 "X-Permitted-Cross-Domain-Policies: none",
 "Permissions-Policy:"
])assert.ok(responseHeaders.includes(header),"Missing security response header: "+header);
assert.ok(responseHeaders.includes("default-src 'self'"),"CSP must default to same-origin resources");
assert.ok(responseHeaders.includes("script-src 'self' https://esm.sh"),"CSP must allow only local scripts and the pinned Supabase SDK host");
assert.ok(responseHeaders.includes("frame-ancestors 'none'"),"CSP must prevent framing");
assert.ok(responseHeaders.includes("object-src 'none'"),"CSP must disable legacy plugin objects");
assert.ok(responseHeaders.includes("upgrade-insecure-requests"),"CSP must upgrade accidental insecure requests");
assert.doesNotMatch(responseHeaders,/script-src[^;]*'unsafe-inline'/,"CSP must not allow inline JavaScript");
assert.doesNotMatch(responseHeaders,/script-src[^;]*'unsafe-eval'/,"CSP must not allow eval-based JavaScript");
assert.ok(responseHeaders.includes("/admin/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n  Cache-Control: no-store, max-age=0"),"Admin pages must not be indexed or cached");
assert.ok(responseHeaders.includes("https://*.supabase.co"),"CSP must allow only the expected Supabase project host pattern for CMS content");
assert.doesNotMatch(responseHeaders,/Access-Control-Allow-Origin:\s*\*/i,"The website must not publish a wildcard CORS policy");

const cmsAdminSql=cmsSql.slice(cmsSql.indexOf("create table if not exists public.cms_admins"),cmsSql.indexOf("-- Initial editable inventory"));
assert.ok(cmsAdminSql.includes("alter table public.cms_admins enable row level security"),"CMS admin membership must use RLS");
assert.ok(cmsAdminSql.includes("user_id = (select auth.uid())"),"Admins may only read their own membership record");
assert.match(cmsAdminSql,/security invoker/i,"The admin-check function must run with invoker privileges");
assert.doesNotMatch(cmsAdminSql,/security definer/i,"CMS authorization must not bypass RLS via SECURITY DEFINER");
assert.ok(cmsAdminSql.includes("alter table public.cms_content enable row level security"),"CMS content must use RLS");
assert.ok(cmsAdminSql.includes("using (is_published = true)"),"Anonymous content reads must be limited to published content");
assert.ok(cmsAdminSql.includes("with check ((select public.is_cms_admin()))"),"CMS inserts and updates must require an active CMS admin");
assert.ok(cmsAdminSql.includes("bucket_id = 'inex-site-media' and (select public.is_cms_admin())"),"Storage writes must be restricted to active CMS admins and the dedicated bucket");
assert.ok(cmsAdmin.includes("signInWithPassword"),"CMS must authenticate administrators with Supabase Auth");
assert.ok(!/signUp\s*\(/.test(cmsAdmin),"CMS must not allow public sign-up");
assert.ok(cmsAdmin.includes("cms_admins")&&cmsAdmin.includes("is_active"),"CMS must verify active membership before showing the dashboard");
const publicCmsConfig=read("assets/cms-config.js");
assert.ok(publicCmsConfig.includes('supabaseUrl: ""')&&publicCmsConfig.includes('publishableKey: ""'),"CMS must stay disconnected until a dedicated database is deliberately provisioned");
assert.doesNotMatch(publicCmsConfig,/service_role|sb_secret_|SUPABASE_SERVICE_ROLE_KEY/i,"No privileged Supabase credential may be included in public configuration");

const publicSourceFiles=[...pages,"resources.html","404.html"].map(read).concat([
 read("assets/site.js"),read("assets/admin.js"),read("assets/cms-public.js"),publicCmsConfig,
 read("assets/site.css"),read("assets/brand-system.css"),read("assets/admin.css")
]);
const secretPattern=/(sb_secret_[A-Za-z0-9_-]+|gh[pousr]_[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|-----BEGIN (?:RSA |EC )?PRIVATE KEY-----)/i;
for(let i=0;i<publicSourceFiles.length;i++)assert.doesNotMatch(publicSourceFiles[i],secretPattern,"Public source file "+i+" appears to contain a private credential");
for(const page of [...pages,"resources.html","404.html"]){
 const html=read(page);
 assert.doesNotMatch(html,/\son[a-z]+\s*=\s*["']/i,page+" must not contain inline event handlers");
 assert.doesNotMatch(html,/href\s*=\s*["']\s*javascript:/i,page+" must not contain javascript: URLs");
}
const codeql=read(".github/workflows/codeql.yml");
assert.ok(codeql.includes("github/codeql-action/init@v4")&&codeql.includes("github/codeql-action/analyze@v4"),"CodeQL v4 analysis must be configured");
assert.ok(codeql.includes("security-events: write"),"CodeQL must have the minimum permission needed to upload scan results");
const dependabot=read(".github/dependabot.yml");
assert.ok(dependabot.includes("package-ecosystem: npm")&&dependabot.includes("package-ecosystem: github-actions"),"Dependabot must monitor application and workflow dependencies");
assert.ok(dependabot.includes("interval: weekly"),"Dependency updates must be checked weekly");
