const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("index.html");
const css = read("assets/site.css");
const js = read("assets/site.js");
const readme = read("README.md");

const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]);
assert.equal(new Set(ids).size, ids.length, "HTML IDs must be unique");

for (const asset of ["assets/site.css", "assets/site.js", "assets/inex-logo.png"]) {
  assert.ok(html.includes(asset), "HTML must load " + asset);
  assert.ok(fs.existsSync(path.join(root, asset)), "Missing local asset: " + asset);
}

const translations = js.match(/const copy=\{\s*ar:\{([\s\S]*?)\n\},\s*en:\{([\s\S]*?)\n\}\};/);
assert.ok(translations, "Arabic and English translation dictionaries must exist");
const htmlKeys = [...html.matchAll(/data-i18n=["']([^"']+)["']/g)].map((match) => match[1]);
for (const key of new Set(htmlKeys)) {
  assert.ok(translations[1].includes(key + ":"), "Missing Arabic translation: " + key);
  assert.ok(translations[2].includes(key + ":"), "Missing English translation: " + key);
}

const externalBlankLinks = [...html.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/g)].map((match) => match[0]);
for (const link of externalBlankLinks) {
  assert.match(link, /rel=["'][^"']*noopener[^"']*["']/, "External new-tab links must include rel=noopener");
}
assert.match(html, /<nav[^>]+id=["']mobileMenu["'][^>]+hidden/, "Mobile menu must start hidden");
assert.match(html, /aria-controls=["']mobileMenu["']/, "Menu trigger must reference its controlled navigation");
assert.match(js, /event\.key==="Escape"/, "Mobile navigation must support Escape");
assert.match(css, /prefers-reduced-motion:reduce/, "Reduced-motion preference must be supported");
assert.match(css, /:focus-visible/, "Keyboard focus styles must be present");
assert.match(html, /name=["']description["']/, "SEO description is required");
assert.match(html, /property=["']og:title["']/, "Open Graph title is required");
assert.match(js, /meta\[name="description"\]/, "Language switching must update the description");
assert.match(js, /meta\[property="og:locale"\]/, "Language switching must update Open Graph locale");
assert.doesNotMatch(js, /\bfetch\s*\(/, "Marketing site must not call application APIs");

assert.ok(fs.existsSync(path.join(root, "404.html")), "Branded 404 page is required");
assert.match(read("404.html"), /name="robots" content="noindex,follow"/, "404 page must not be indexed");
assert.ok(!read("404.html").includes(" style="), "404 page must not use inline styles under CSP");
assert.ok(fs.existsSync(path.join(root, "_headers")), "Cloudflare Pages security headers file is required");
const headers = read("_headers");
for (const directive of ["X-Content-Type-Options: nosniff", "X-Frame-Options: DENY", "Content-Security-Policy:"]) {
  assert.ok(headers.includes(directive), "Missing security header: " + directive);
}
assert.match(read("robots.txt"), /User-agent: \*/, "robots.txt must declare crawler policy");
assert.match(readme, /No Firebase, Firestore, authentication, Cloudinary, Worker, API/, "Marketing site must remain isolated from app services");

assert.ok(html.includes("og:image:alt"), "Open Graph image alternative text is required");
assert.ok(html.includes("twitter:image:alt"), "Twitter image alternative text is required");
assert.ok(html.includes("apple-touch-icon"), "Apple touch icon metadata is required");
assert.ok(!html.includes("iNex-App/main/inex-logo.png"), "Social logo metadata must not depend on the application repository");

console.log("iNex website deployment-readiness checks passed.");
