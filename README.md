# iNex Corporate InsurTech Website

Independent bilingual corporate website for the iNex insurance technology platform.

## Website structure

- `index.html` — corporate homepage
- `platform.html` — platform capabilities
- `solutions.html` — broker, customer, corporate and ecosystem use cases
- `resources.html` — knowledge-centre landing page (editorial content is not yet published)
- `company.html` — company perspective and service disclosures
- `contact.html` — contact information and approved-channel placeholder
- `404.html` — branded not-found page

## Project boundaries

- This repository contains the public corporate website only.
- `eslamshahin1087-lab/iNex-App` is a read-only product reference.
- No Firebase, Firestore, authentication, Cloudinary, Worker, API or production data integration is included.
- The website does not modify or deploy the application.
- Do not connect the application repository to Cloudflare Pages.
- No custom domain or production deployment is part of this development branch.

## Stack

Static HTML, CSS and vanilla JavaScript. No build step or runtime dependency.

## Local preview

Run a static server from the repository root:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Cloudflare Pages

The current production Pages project is separate from this development branch. Do not change production settings or deploy this branch without explicit approval.

For static hosting, use the repository root as the output directory and no build command.

## Product accuracy and disclosures

Public copy is intentionally limited to capabilities previously documented in the application: policy and document tracking, protection assessment, quote requests/review, InsuraPoints, customer services, broker administration and Corporate HR Hub. Availability may depend on account permissions and current application configuration.

No payroll, attendance, AI copilot, insurer integrations, analytics, or other unverified functionality is advertised.

iNex is described as a technology platform connected to insurance brokerage services. It is not described as an insurer and does not claim to issue insurance policies itself. Coverage, pricing and acceptance remain subject to the insurer's terms and final policy.

The contact page intentionally does not invent an email address or display a non-functional form. Add an approved corporate contact channel before launch.

## Quality and accessibility

- Shared responsive design system for all pages.
- Arabic RTL by default and English LTR through a persistent language switch.
- Keyboard-operable mobile navigation with Escape support.
- Visible keyboard focus and reduced-motion support.
- Local approved logo asset.
- External new-tab links include `rel="noopener"`.
- Run static regression checks with `npm test`.
- Run Chromium smoke tests with `npm run test:e2e` after installing Playwright and Chromium.

## Deployment

All work is performed on a feature branch and must pass static and browser checks before review. Production deployment, custom-domain changes and application changes require separate explicit approval.
