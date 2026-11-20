# iNex — Insurance Awareness & Customer Solutions

Independent bilingual corporate website for **iNex**, the customer-facing insurance awareness and customer solutions platform, with a clearly identified strategic partnership with **InsurNex**, an intelligent assistant for insurance brokers.

## Product definition

iNex is designed around customers and insurance awareness. It helps people understand insurance concepts, review their protection needs, explore insurance options and access customer services through a digital experience.

**iNex and InsurNex are distinct products.** iNex serves insurance customers with awareness and customer solutions. InsurNex is a strategic partner and an intelligent assistant for insurance brokers. This website may promote and link to InsurNex, while clearly explaining each product's audience and purpose. Do not imply shared accounts, data integration, or capabilities unless verified.

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

The iNex customer application is maintained in the separate `iNex-App` repository. Its registration entry point is `https://eslamshahin1087-lab.github.io/iNex-App/wathiqati-app.html` and opens the account creation screen for signed-out visitors. The strategic partner InsurNex app is available at `https://insurnex-8a9df.web.app/?view=desktop`. Do not use the obsolete `/iNex/` path in website navigation or calls to action.

## Project boundaries

- This repository contains the public iNex website only.
- The iNex application repository is a read-only product reference.
- InsurNex is a distinct strategic partner product; present it separately from iNex and link to its published application.
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


## Homepage insurance and InsurTech content

The homepage includes a bilingual insurer directory inspired by a publicly visible Amanleek website section. The five referenced company names are Libano-Suisse Takaful, Allianz, Chubb, MetLife and Sarwa Insurance. They are displayed as an informational directory with links to each company's official website; their appearance does not imply a commercial partnership, endorsement, ranking, recommendation, or confirmed product availability through iNex.

The homepage also includes two original SVG illustrations: one for customer protection and insurance categories, and another for digital insurance technology. The insurance awareness, iNex customer platform and InsurNex broker-facing product remain clearly differentiated.


## Shared visual identity system

All public HTML pages load `assets/brand-system.css` after the existing component stylesheet. This shared layer standardizes iNex's midnight-navy, champagne-gold and restrained digital-blue palette, navigation, typography, buttons, cards, section rhythm, page headers, insurer directory, InsurTech panels, leadership and contact layouts. It includes RTL/LTR and mobile breakpoints and respects reduced-motion preferences.


## Supplied insurance company logo directory

The homepage insurer directory uses the 18 company logo images supplied for this project, combined into an optimized AVIF sprite at `assets/insurance-companies-sprite.avif`. The display is an informational directory with links to company websites. It is not a ranking, recommendation, endorsement, or statement that the named insurers have partnered with iNex or that their products are available through the platform.


## Insurer logo marquee

The 18 supplied company logos are shown in a continuous horizontal marquee. The animation runs at a moderate pace, pauses while the pointer is over the logo viewport or keyboard focus is within it, and respects `prefers-reduced-motion`. The visual duplicate set is hidden from assistive technology and made inert so it does not create duplicate keyboard stops.


## Arabic typography and continuous marquee correction

The homepage now uses IBM Plex Sans Arabic for reading and Alexandria for headings and controls, with neutral Arabic letter spacing and language-appropriate line heights. The insurer section is explicitly closed before the next content section. The marquee measures one complete logo set (including its responsive spacing) and moves by exactly that distance for a seamless loop; both sets remain non-shrinking and single-line. It pauses on hover/focus and uses a manually scrollable fallback for reduced-motion preferences.


## Marquee rendering reliability

The logo marquee uses a pure-CSS half-track translation. Because the track contains two identical, non-shrinking logo groups, `translateX(-50%)` advances exactly one complete group and loops seamlessly without relying on JavaScript width measurements. Browser smoke tests also verify that at least one logo card intersects the visible marquee viewport.


## English-first and bilingual content expansion

- The default page source language is English (`lang="en"`, `dir="ltr"`) across the public pages, including the branded 404 page.
- Visitors can switch to Arabic; the selected language is retained within the current browser tab using `sessionStorage`, while a fresh tab starts in English.
- Arabic reading copy uses IBM Plex Sans Arabic, with Alexandria for headings and navigation, and language-specific spacing and line-height rules.
- The insurer logo marquee is explicitly isolated as an LTR horizontal track regardless of the page's language direction. It restarts on language changes, retains hover/focus pause behavior and respects reduced-motion preferences.
- New bilingual sections add practical decision prompts on the home page, an explanation of the platform journey, customer-use-case guidance, an insurance-awareness checklist, company principles, contact routing and introductory knowledge guides.
- Product positioning distinguishes iNex (customer awareness and digital services) from InsurNex (broker-facing software). The content does not imply that iNex underwrites risk or issues insurance policies.


## English-first and expanded insurance knowledge content

The Resources page now opens in English and contains practical starter guidance on reading a policy, comparing offers on a like-for-like basis, and preparing for a claim. The language control's accessible label follows the active language. Browser tests now start in English, switch to Arabic, validate Arabic fonts and verify that the insurer marquee continues moving and pauses on hover in both LTR and RTL page states.


## InsurTech content and visual experience refresh

- Expanded bilingual, benefits-led content explains how iNex connects insurance awareness, needs review, policy information and customer-service requests.
- Added dedicated customer-story sections to the homepage, platform, solutions, awareness, company, contact and resources pages.
- Clarified that iNex and InsurNex are distinct products with separate audiences: iNex is customer-facing and InsurNex is broker-facing.
- Added a site-wide abstract InsurTech background using low-contrast digital grids, data-like nodes, layered radial light and restrained navy, gold and blue depth. The treatment is CSS-based and does not add heavy image assets.
- Added subtle motion for icon cues, homepage orbits, editorial illustrations, ecosystem cards and page entry. Motion is disabled or reduced for visitors who request reduced motion.
- Added browser coverage for the motion/background system and reduced-motion accessibility.


## Private iNex content management

A private CMS interface is available at `/admin/`. It is designed to manage the existing bilingual text inventory, page imagery and the 18 insurer logos individually, as well as add new text, image and card blocks to each public page. Existing static elements can be hidden without removing their original HTML; newly created CMS blocks can be deleted.

The CMS uses a separate Supabase project, Auth, Row Level Security and a public site-media bucket. Its database setup and first-admin provisioning steps are documented in [CMS_SETUP.md](CMS_SETUP.md). Run the SQL in `supabase/setup-cms.sql` only in the dedicated iNex CMS project, then configure `assets/cms-config.js` with that project's URL and publishable key. Never place a service-role or secret key in browser code.
