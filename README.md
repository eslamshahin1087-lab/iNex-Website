# iNex Official Marketing Website

Independent bilingual marketing website for the iNex insurance platform.

## Project boundaries

- This repository contains the marketing website only.
- The application repository \`eslamshahin1087-lab/iNex-App\` is a read-only product reference.
- No Firebase, Firestore, authentication, Cloudinary, Worker, API or production data integration is included.
- The website does not modify or deploy the application.
- No production deployment or custom-domain connection has been performed.

## Stack

Static HTML, CSS and vanilla JavaScript. No build step or runtime dependency.

## Local preview

Run any static server from the repository root, for example:

\`\`\`bash
python3 -m http.server 8080
\`\`\`

Then visit \`http://localhost:8080\`.

## Cloudflare Pages

Recommended configuration:

- Production branch: \`main\`
- Build command: leave empty
- Build output directory: \`/\` (repository root)
- Root directory: \`/\`

Connect this repository to Cloudflare Pages only after review and explicit approval. Do not connect the application repository.

## App destination

The current app link is taken from the source application's README:
\`https://eslamshahin1087-lab.github.io/iNex/\`

The current logo is referenced from the source application repository via its raw GitHub URL. This avoids copying or modifying original app files. To fully self-host the logo in this repository, add the approved logo binary as \`assets/inex-logo.png\` after transferring it as a binary asset.

## Product accuracy

Public copy is intentionally limited to functions visible in the current app and its README: policy/document tracking, protection assessment, quote comparison, InsuraPoints, customer services, broker administration and Corporate HR Hub. No payroll, attendance, AI copilot or other unverified features are advertised.

The FRA number (38062) is cited in the source repository README and app landing page; this website describes it as a number stated in project materials and directs visitors to the app's current legal disclosure for authoritative details.

 
## Quality and accessibility

- Mobile navigation exposes its expanded state, supports Escape to close, and returns focus to the menu trigger.
- Visible keyboard focus styles and reduced-motion preferences are included.
- The marketing site is responsive; it does not claim to be an installable PWA. PWA functionality belongs to the application and is not asserted here.
- Open Graph and Twitter card metadata are provided. A canonical URL is intentionally omitted until a production domain is approved.
- Run the static project checks with `npm test`. The check uses only Node.js built-ins and introduces no runtime dependency.

## Deployment readiness

- `404.html` provides a branded not-found page for static hosting.
- `robots.txt` permits normal crawling. A sitemap and canonical URL are intentionally deferred until the final public site URL is approved.
- `_headers` supplies baseline security headers for Cloudflare Pages, including a restrictive Content Security Policy. Hosting providers that do not support the Cloudflare Pages `_headers` convention may ignore this file.
- Language switching updates the document language, direction, title, description and social metadata.
- Verify the published page and security headers on the chosen hosting provider before connecting a custom domain.
