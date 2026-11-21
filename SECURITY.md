# Security policy — iNex Website

## Scope

This repository contains the public, static iNex marketing website and its optional content-management interface. The public site is served through Cloudflare Pages. The CMS is designed to use a separate Supabase project for authentication, content records and public website imagery.

The current repository configuration has an empty Supabase URL and publishable key in `assets/cms-config.js`. The CMS is therefore not connected to a live database and its content-editing controls remain disabled. The admin URL is additionally protected at the Cloudflare Pages edge by a separate session gate; this edge login does not itself provision or enable CMS editing.

## Reporting a vulnerability

Please do not publish credentials, personal information or an exploitable vulnerability in a public issue. Use GitHub's **Security → Report a vulnerability** flow for this repository. The repository owner should keep Private vulnerability reporting enabled.

## Security controls in the repository

- Cloudflare Pages response headers include a restrictive Content Security Policy, frame protections, MIME sniffing protection, a referrer policy, HSTS and a restrictive browser permissions policy.
- The `/admin/*` route is gated by a Cloudflare Pages Function before the static admin page is served. Access requires the configured admin email and password, and the function fails closed if the required secrets are missing.
- The edge gate signs an eight-hour session with HMAC-SHA-256 and sets a Secure, HttpOnly, SameSite=Strict cookie scoped to `/admin`. Login and logout POSTs must originate from the same site.
- The Functions routes are limited to `/admin` and its nested paths; public pages and static assets do not invoke the Function and keep the unlimited static Pages request allowance. Pages Functions use the Cloudflare Workers Free daily request quota, so the admin route must remain low-traffic.
- Before enabling the gate in production, set `INEX_ADMIN_EMAIL` as a Cloudflare production variable and `INEX_ADMIN_PASSWORD` plus `INEX_ADMIN_SESSION_SECRET` as encrypted production secrets. Use at least 24 characters for the password and at least 32 characters for the session secret. Never add these values to GitHub.
- The admin client uses password authentication and separately checks membership in `public.cms_admins`.
- The Supabase schema enables RLS on `cms_admins` and `cms_content`. The admin-check function uses `SECURITY INVOKER`; only active CMS admins can write to content and site-media objects.
- The browser may contain only the Supabase Project URL and publishable key. A service-role key, secret key, database password, Cloudflare API token or GitHub token must never be placed in HTML, JavaScript, CSS or other public files.
- Static and browser CI checks validate the security configuration. CodeQL scans the JavaScript, and Dependabot monitors npm and GitHub Actions dependencies.


- The repository keeps `wrangler.toml` for local development only and intentionally omits `pages_build_output_dir`. This keeps Cloudflare Pages production configuration—including dashboard-managed environment variables and secrets—under the Cloudflare dashboard rather than opting production into Wrangler-file configuration.

## Required repository settings

The owner should configure a branch protection rule or repository ruleset for `main`:

1. Require changes to enter through a pull request; do not permit direct pushes.
2. Require the `static-checks`, `chromium-smoke-tests` and `Analyze JavaScript` checks to pass.
3. Block force pushes and branch deletion.
4. Require conversation resolution.
5. Require one approval when a second trusted maintainer is available. If the repository is operated by one person, keep the pull-request and status-check requirements without creating an impossible self-approval requirement.
6. Do not allow routine bypasses of these rules.

Also enable GitHub Dependabot alerts, secret scanning and push protection in the repository's **Settings → Security** area. Keep two-factor authentication enabled on every GitHub account with write or admin access.

## Required Cloudflare settings

- Keep the Cloudflare Pages production branch set to `main`; feature branches should create previews only.
- Enable Bot Fight Mode where available and review Cloudflare Security Events regularly.
- Keep the Cloudflare Zero Trust Access checkout disabled; no payment method or paid Access plan is required for the Pages edge gate.
- In Pages Settings > Runtime, set the Function exhaustion behavior to **Fail closed** so an exhausted free Functions quota cannot fall back to serving the static admin file without authentication. Because only admin routes invoke the Function, routine public traffic remains static.
- Do not expose Cloudflare API tokens or deployment credentials in the repository. Use narrowly scoped Cloudflare/GitHub integrations and rotate any token that may have been disclosed.

## Required Supabase settings before CMS activation

- Use a dedicated iNex CMS project, never the InsurNex project.
- Disable public sign-ups and anonymous sign-ins. Create the administrator account deliberately and add its Auth user ID to `cms_admins`.
- Enable MFA for the administrator, confirm the email, use a unique password/passkey and configure the approved redirect URLs only.
- Keep RLS enabled and test that an anonymous visitor and a normal authenticated user cannot insert, update or delete CMS content or upload, replace or delete storage objects.
- The `inex-site-media` bucket is intentionally public because its contents are public website images. Never upload identity documents, insurance policies, claims files or other private customer data to this bucket.
- Never expose a service-role or secret API key in the browser.

## Incident response

If a token or password may have been exposed, revoke or rotate it at the issuing service, review recent sign-ins and deployments, inspect GitHub and Cloudflare audit/security events, and redeploy from a reviewed commit. Removing a secret from the latest file alone does not invalidate a leaked credential.
