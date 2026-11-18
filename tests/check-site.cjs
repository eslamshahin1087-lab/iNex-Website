const fs=require("node:fs");const path=require("node:path");const assert=require("node:assert/strict");const root=path.resolve(__dirname,"..");const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const pages=["index.html","platform.html","solutions.html","awareness.html","company.html","contact.html"];
for(const page of pages){const html=read(page);assert.ok(html.includes('<html lang="ar" dir="rtl">'),page+" must default to Arabic RTL");for(const token of ['assets/site.css','assets/site.js','id="mobileMenu"','id="langBtn"','data-ar=','data-en=','assets/inex-logo.png'])assert.ok(html.includes(token),page+" missing "+token);const ids=[...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,page+" IDs must be unique");const english=[...html.matchAll(/data-en="([^"]*)"/g)].map(m=>m[1]);for(const value of english)assert.ok(![...value].some(c=>{const n=c.codePointAt(0);return n>=0x0600&&n<=0x06ff}),page+" has Arabic in English translation: "+value);const external=[...html.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/g)].map(m=>m[0]);for(const link of external)assert.match(link,/rel=["'][^"']*noopener[^"']*["']/,"External links must use noopener");}
const css=read("assets/site.css"),js=read("assets/site.js"),readme=read("README.md");for(const asset of ["assets/site.css","assets/site.js","assets/inex-logo.png"])assert.ok(fs.existsSync(path.join(root,asset)),"Missing "+asset);
assert.match(js,/localStorage\.getItem\("inex-site-language"\)/);assert.match(js,/dataset\.html==="true"/);assert.match(js,/textContent=translation/);assert.match(js,/normalizePageKey/);assert.match(js,/querySelectorAll\("\.reveal/);assert.match(js,/event\.key==="Escape"/);
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
assert.match(read("assets/site.js"),/ResizeObserver/);
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