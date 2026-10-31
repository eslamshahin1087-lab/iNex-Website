# iNex — Insurance Awareness & Customer Solutions

Independent bilingual corporate website for **iNex**, the customer-facing insurance awareness and customer solutions platform.

## Product definition

iNex is designed around customers and insurance awareness. It helps people understand insurance concepts, review their protection needs, explore insurance options and access customer services through a digital experience.

**iNex is not InsurNex.** InsurNex is a separate insurance-brokerage operations product and is outside the scope of this website.

## Website structure

- `index.html` — customer-first brand homepage
- `platform.html` — verified iNex customer-facing capabilities
- `solutions.html` — individuals, families, employees and corporate customer contexts
- `awareness.html` — insurance education topics and awareness guidance
- `company.html` — iNex philosophy, role and service disclosures plus CEO and COO/co-founder profiles
- `contact.html` — customer service route through the iNex application
- `404.html` — branded not-found page

## Product accuracy

Website copy is grounded in the iNex application repository and customer app, including:
- Insurance tips and awareness content
- Insurance protection assessment
- Customer policy and document access
- Quote requests and comparison of available offers
- Consultation, appointments, complaints and broker communication
- InsuraPoints rewards programme
- Corporate HR Hub capabilities, subject to account permissions and configuration

General awareness content is educational and does not replace policy wording, insurer terms or professional advice. The website does not claim that a full editorial article library is currently published.

iNex is a technology and awareness platform connected to insurance brokerage services. It is not an insurer, does not underwrite risk and does not issue policies itself. Quote requests and consultations are handled through the licensed insurance broker; coverage, pricing and acceptance remain subject to the insurer's terms and final policy.

## Application access

The customer application is maintained in the separate `iNex-App` repository. Its registration entry point is `https://eslamshahin1087-lab.github.io/iNex-App/wathiqati-app.html?screen=signup` and opens the account creation screen for signed-out visitors. Do not use the obsolete `/iNex/` path in website navigation or calls to action.

## Project boundaries

- This repository contains the public iNex website only.
- The iNex application repository is a read-only product reference.
- InsurNex is a separate product and must not be referenced as the iNex product.
- No Firebase, Firestore, authentication, Cloudinary, Worker, API or production data integration is included.
- Do not modify the application repository or its backend.
- Do not change Cloudflare production settings, custom domains or production deployment without separate explicit approval.

## Stack and local preview

Static HTML, CSS and vanilla JavaScript. No build step.

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Quality

- Arabic RTL by default and English LTR with persisted language choice.
- Localized page titles, descriptions, navigation and page copy.
- Responsive desktop and mobile navigation.
- Keyboard-operable mobile menu with Escape support.
- Visible focus styles and reduced-motion support.
- Subtle scroll-reveal interactions, animated progress indicator and motion-safe micro-interactions.
- Responsive founding leadership profiles for Islam Ibrahim (CEO & Founder) and Fawzya Hesham (COO & Co-Founder), with localized Arabic/English copy and supplied portraits.
- Run static checks with `npm test`.
- Run browser checks with `npm run test:e2e` after installing Playwright and Chromium.

## Deployment

Development takes place on a feature branch. All changes must pass static and browser checks and be reviewed before merging. Production deployment and custom-domain changes require separate explicit approval.
