import {
  constantTimeStringEqual,
  createAdminSession,
  verifyAdminSession,
  SESSION_TTL_SECONDS,
  getAdminConfigurationIssues,
  isSameOriginAdminRequest
} from "./auth.mjs";

const COOKIE_NAME = "__Secure-iNexAdminSession";
const LOGIN_PATH = "/admin/__login";
const LOGOUT_PATH = "/admin/__logout";

const LOGIN_CSS = "/assets/admin-gate.css";

function responseHeaders(contentType = "text/html; charset=utf-8") {
  return {
    "Content-Type": contentType,
    "Cache-Control": "no-store, private, max-age=0",
    "Pragma": "no-cache",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": "default-src 'none'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; style-src 'self'; img-src 'self'; upgrade-insecure-requests"
  };
}

function htmlResponse(body, status = 200) {
  return new Response(body, { status, headers: responseHeaders() });
}

function redirectResponse(path, cookie) {
  const headers = new Headers({
    Location: path,
    "Cache-Control": "no-store, private, max-age=0",
    "Pragma": "no-cache",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
  });
  if (cookie) headers.append("Set-Cookie", cookie);
  return new Response(null, { status: 303, headers });
}

function getCookie(request, name) {
  const cookies = request.headers.get("Cookie") || "";
  for (const part of cookies.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    const key = part.slice(0, separator).trim();
    if (key === name) return part.slice(separator + 1).trim();
  }
  return "";
}

function loginPage(error = false) {
  const message = error
    ? '<p class="gate-error" role="alert">بيانات الدخول غير صحيحة. حاول مرة أخرى.</p>'
    : "";
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive">
<meta name="theme-color" content="#07182e">
<title>دخول إدارة iNex</title>
<link rel="icon" href="/assets/inex-logo.png">
<link rel="stylesheet" href="${LOGIN_CSS}">
</head>
<body>
<main class="gate-shell">
  <section class="gate-card" aria-labelledby="gate-title">
    <a class="gate-brand" href="/" aria-label="iNex">
      <img src="/assets/inex-logo.png" alt="iNex">
      <span><strong>iNex</strong><small>PRIVATE ADMINISTRATION</small></span>
    </a>
    <div class="gate-copy">
      <span class="gate-eyebrow">مساحة خاصة</span>
      <h1 id="gate-title">تسجيل الدخول إلى إدارة الموقع</h1>
      <p>هذه المنطقة مخصصة للمسؤول المصرّح له فقط.</p>
    </div>
    ${message}
    <form method="post" action="${LOGIN_PATH}" class="gate-form">
      <label for="email">البريد الإلكتروني</label>
      <input id="email" name="email" type="email" autocomplete="username" inputmode="email" maxlength="254" required>
      <label for="password">كلمة المرور</label>
      <input id="password" name="password" type="password" autocomplete="current-password" minlength="24" maxlength="256" required>
      <button type="submit">دخول آمن</button>
    </form>
    <p class="gate-footnote">تُحمى الجلسة بملف ارتباط آمن وتنتهي تلقائيًا بعد 8 ساعات.</p>
    <a class="gate-home" href="/">العودة إلى موقع iNex</a>
  </section>
</main>
</body>
</html>`;
}

function configurationErrorPage(issues) {
  const items = issues.map((issue) => `<li>${issue}</li>`).join("");
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow,noarchive"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin configuration required</title></head>
<body>
<main>
<h1>Admin access is not configured</h1>
<p>The admin gate is safely closed. Check these Production runtime bindings in Cloudflare Pages:</p>
<ul>${items}</ul>
<p>After correcting the listed binding(s), create a new Production deployment.</p>
</main>
</body>
</html>`;
}

function sessionCookie(value) {
  return `${COOKIE_NAME}=${value}; Max-Age=${SESSION_TTL_SECONDS}; Path=/admin; Secure; HttpOnly; SameSite=Strict`;
}

function expiredCookie() {
  return `${COOKIE_NAME}=; Max-Age=0; Path=/admin; Secure; HttpOnly; SameSite=Strict`;
}

async function sessionIsValid(request, env) {
  const token = getCookie(request, COOKIE_NAME);
  if (!token) return false;
  return verifyAdminSession(token, env.INEX_ADMIN_EMAIL, env.INEX_ADMIN_SESSION_SECRET);
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // This handler is attached only to Pages routes under /admin.
  if (path !== "/admin" && !path.startsWith("/admin/")) return context.next();

  const configurationIssues = getAdminConfigurationIssues(env);
  if (configurationIssues.length > 0) {
    return htmlResponse(configurationErrorPage(configurationIssues), 503);
  }

  if (path === LOGOUT_PATH) {
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: responseHeaders("text/plain; charset=utf-8") });
    if (!isSameOriginAdminRequest(request, url)) return new Response("Forbidden", { status: 403, headers: responseHeaders("text/plain; charset=utf-8") });
    return redirectResponse("/admin/", expiredCookie());
  }

  if (path === LOGIN_PATH) {
    if (request.method === "GET") {
      if (await sessionIsValid(request, env)) return redirectResponse("/admin/");
      return htmlResponse(loginPage());
    }
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: responseHeaders("text/plain; charset=utf-8") });
    if (!isSameOriginAdminRequest(request, url)) return new Response("Forbidden", { status: 403, headers: responseHeaders("text/plain; charset=utf-8") });

    const contentType = request.headers.get("Content-Type") || "";
    if (!contentType.toLowerCase().startsWith("application/x-www-form-urlencoded")) {
      return htmlResponse(loginPage(true), 415);
    }

    let body;
    try {
      body = await request.text();
    } catch {
      return htmlResponse(loginPage(true), 400);
    }
    if (new TextEncoder().encode(body).byteLength > 4096) return htmlResponse(loginPage(true), 413);

    const form = new URLSearchParams(body);
    const submittedEmail = String(form.get("email") || "").trim().toLowerCase();
    const submittedPassword = String(form.get("password") || "");
    const [emailMatches, passwordMatches] = await Promise.all([
      constantTimeStringEqual(submittedEmail, env.INEX_ADMIN_EMAIL.trim().toLowerCase()),
      constantTimeStringEqual(submittedPassword, env.INEX_ADMIN_PASSWORD)
    ]);

    if (!emailMatches || !passwordMatches) return htmlResponse(loginPage(true), 401);

    const token = await createAdminSession(env.INEX_ADMIN_EMAIL.trim(), env.INEX_ADMIN_SESSION_SECRET);
    return redirectResponse("/admin/", sessionCookie(token));
  }

  if (await sessionIsValid(request, env)) return context.next();
  return htmlResponse(loginPage());
}
