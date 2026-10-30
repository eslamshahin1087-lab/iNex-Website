const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const pages = ["index.html","platform.html","solutions.html","resources.html","company.html","contact.html"];
for (const page of pages) {
  const html = read(page);
  assert.match(html, /<html lang="ar" dir="rtl">/, page + " must default to Arabic RTL");
  assert.match(html, /assets\/site\.css/, page + " must load shared CSS");
  assert.match(html, /assets\/site\.js/, page + " must load shared JS");
  assert.match(html, /id="mobileMenu"/, page + " must include mobile navigation");
  assert.match(html, /id="langBtn"/, page + " must include language switch");
  assert.match(html, /data-ar=/, page + " must provide Arabic copy");
  assert.match(html, /data-en=/, page + " must provide English copy");
  assert.match(html, /assets\/inex-logo\.png/, page + " must use local approved logo");
  const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length, page + " IDs must be unique");
}
const css = read("assets/site.css");
const js = read("assets/site.js");
for (const asset of ["assets/site.css","assets/site.js","assets/inex-logo.png"]) assert.ok(fs.existsSync(path.join(root,asset)), "Missing asset " + asset);
assert.match(js, /localStorage\.getItem\("inex-site-language"\)/, "Language preference should persist");
assert.match(js, /innerHTML=el\.dataset\[next\]/, "Authored emphasis markup should survive language switching");
assert.match(js, /e\.key==="Escape"/, "Mobile menu must support Escape");
assert.match(css, /prefers-reduced-motion:reduce/, "Reduced motion must be supported");
assert.match(css, /:focus-visible/, "Keyboard focus styles must be present");
for (const page of pages) {
 const html=read(page);
 const links=[...html.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/g)].map(m=>m[0]);
 for(const link of links) assert.match(link,/rel=["'][^"']*noopener[^"']*["']/,"External links must use noopener");
}
assert.match(read("_headers"),/Content-Security-Policy:/);
assert.match(read("_headers"),/X-Frame-Options: DENY/);
assert.match(read("404.html"),/name="robots" content="noindex,follow"/);
assert.match(read("README.md"),/No Firebase, Firestore, authentication, Cloudinary, Worker, API/);
assert.doesNotMatch(read("contact.html"),/hello@inex\.com|mailto:/,"Do not invent contact addresses");
console.log("iNex corporate website checks passed.");
