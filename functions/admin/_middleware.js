import {
  constantTimeStringEqual,
  createAdminSession,
  verifyAdminSession,
  SESSION_TTL_SECONDS
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

function configured(env) {
  return (
    typeof env.INEX_ADMIN_EMAIL === "string" &&
    env.INEX_ADMIN_EMAIL.includes("@") &&
    typeof env.INEX_ADMIN_PASSWORD === "string" &&
    env.INEX_ADMIN_PASSWORD.length >= 20 &&
    typeof env.INEX_ADMIN_SESSION_SECRET === "string" &&
    env.INEX_ADMIN_SESSION_SECRET.length >= 32
  );
}

function getCookie(request, name) {
  const cookies = request.headers.get("Cookie") || "";
  const escapedName = name.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&");
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${escapedName}=([^;]*)`));
  return match ? match[1] : "";
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
      <input id="password" name="password" type="password" autocomplete="current-password" minlength="20" maxlength="256" required>
      <button type="submit">دخول آمن</button>
    </form>
    <p class="gate-footnote">تُحمى الجلسة بملف ارتباط آمن وتنتهي تلقائيًا بعد 8 ساعات.</p>
    <a class="gate-home" href="/">العودة إلى موقع iNex</a>
  </section>
</main>
</body>
</html>`;
}

function isSameOrigin(request, url) {
  const origin = request.headers.get("Origin");
  return Boolean(origin) && origin === url.origin;
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

  if (!configured(env)) {
    return htmlResponse(
      "<!doctype html><html lang='en'><meta charset='utf-8'><title>Admin unavailable</title><body><h1>Admin access is not configured</h1><p>Set the required encrypted Cloudflare secrets, then redeploy.</p></body></html>",
      503
    );
  }

  if (path === LOGOUT_PATH) {
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: responseHeaders("text/plain; charset=utf-8") });
    if (!isSameOrigin(request, url)) return new Response("Forbidden", { status: 403, headers: responseHeaders("text/plain; charset=utf-8") });
    return redirectResponse("/admin/", expiredCookie());
  }

  if (path === LOGIN_PATH) {
    if (request.method === "GET") {
      if (await sessionIsValid(request, env)) return redirectResponse("/admin/");
      return htmlResponse(loginPage());
    }
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: responseHeaders("text/plain; charset=utf-8") });
    if (!isSameOrigin(request, url)) return new Response("Forbidden", { status: 403, headers: responseHeaders("text/plain; charset=utf-8") });

    const contentLength = Number(request.headers.get("Content-Length") || "0");
    if (contentLength > 4096) return htmlResponse(loginPage(true), 413);

    let form;
    try {
      form = await request.formData();
    } catch {
      return htmlResponse(loginPage(true), 400);
    }

    const submittedEmail = String(form.get("email") || "").trim().toLowerCase();
    const submittedPassword = String(form.get("password") || "");
    const [emailMatches, passwordMatches] = await Promise.all([
      constantTimeStringEqual(submittedEmail, env.INEX_ADMIN_EMAIL.toLowerCase()),
      constantTimeStringEqual(submittedPassword, env.INEX_ADMIN_PASSWORD)
    ]);

    if (!emailMatches || !passwordMatches) return htmlResponse(loginPage(true), 401);

    const token = await createAdminSession(env.INEX_ADMIN_EMAIL, env.INEX_ADMIN_SESSION_SECRET);
    return redirectResponse("/admin/", sessionCookie(token));
  }

  if (await sessionIsValid(request, env)) return context.next();
  return htmlResponse(loginPage());
}
