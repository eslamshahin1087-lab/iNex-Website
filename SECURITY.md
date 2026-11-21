# Security policy — iNex Website

## Scope

This repository contains the public, static iNex marketing website and its optional content-management interface. The public site is served through Cloudflare Pages. The CMS is designed to use a separate Supabase project for authentication, content records and public website imagery.

The current repository configuration has an empty Supabase URL and publishable key in `assets/cms-config.js`. Therefore the CMS is not connected to a live database and its login controls remain disabled. Do not treat the presence of the admin page as proof that the CMS has been provisioned or security-tested against a live backend.

## Reporting a vulnerability

Please do not publish credentials, personal information or an exploitable vulnerability in a public issue. Use GitHub's **Security → Report a vulnerability** flow for this repository. The repository owner should keep Private vulnerability reporting enabled.

## Security controls in the repository

- Cloudflare Pages response headers include a restrictive Content Security Policy, frame protections, MIME sniffing protection, a referrer policy, HSTS and a restrictive browser permissions policy.
- The `/admin/*` path is marked noindex and no-store. These headers reduce exposure and caching; they do not replace authentication.
- The admin client uses password authentication and separately checks membership in `public.cms_admins`.
- The Supabase schema enables RLS on `cms_admins` and `cms_content`. The admin-check function uses `SECURITY INVOKER`; only active CMS admins can write to content and site-media objects.
- The browser may contain only the Supabase Project URL and publishable key. A service-role key, secret key, database password, Cloudflare API token or GitHub token must never be placed in HTML, JavaScript, CSS or other public files.
- Static and browser CI checks validate the security configuration. CodeQL scans the JavaScript, and Dependabot monitors npm and GitHub Actions dependencies.

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
- Once a custom domain in a Cloudflare-managed zone is connected, create a Cloudflare Access application for `/admin/*`. Allow only the named administrator identity, require MFA/one-time email verification, and leave the default policy as deny. Access on a custom domain is an additional layer; it does not replace Supabase authorization.
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
